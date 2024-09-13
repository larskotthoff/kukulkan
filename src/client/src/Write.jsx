import { createEffect, createSignal, createResource, For, Show } from "solid-js";
import { createStore } from "solid-js/store";

import { Alert, Box, Button, Grid, MenuItem, Paper, Select, TextField } from "@suid/material";
import { ChipComplete, TagComplete } from "./Autocomplete.jsx";
import { ColorChip } from "./ColorChip.jsx";

import AttachFile from "@suid/icons-material/AttachFile";
import Send from "@suid/icons-material/Send";

import "./Kukulkan.css";
import { separateQuotedNonQuoted } from "./Message.jsx";
import { apiURL, fetchAllTags, fetchMessage, filterAdminTags, formatFSz } from "./utils.js";
import { mkShortcut } from "./UiUtils.jsx";

const Templates = (props) => {
  return (
    <Grid container spacing={1} class="centered" sx={{ justifyContent: 'center' }}>
      <For each={props.templates}>
        {(template) => {
          mkShortcut([template.shortcut],
            () => document.getElementById(`template-${template.shortcut}`).click()
          );
          return (<Grid item>
            <Button id={`template-${template.shortcut}`} variant="outlined" onClick={() => props.setTemplate(template.template) }>{template.description} ({template.shortcut})</Button>
          </Grid>);
        }}
      </For>
    </Grid>
  );
};

const AddrComplete = (props) => {
  let controller = null,
      debounceTimer = null;

  return (
    <ChipComplete
      chips={props.message[props.addrAttr]}
      addChip={(addr) => {
        props.setMessage(props.addrAttr, props.message[props.addrAttr].length, addr);
        localStorage.setItem(`draft-${props.draftKey}-${props.addrAttr}`, props.message[props.addrAttr].join("\n"));
      }}
      removeChip={(addr) => {
        props.setMessage(props.addrAttr, props.message[props.addrAttr].filter(a => a !== addr));
        localStorage.setItem(`draft-${props.draftKey}-${props.addrAttr}`, props.message[props.addrAttr].join("\n"));
      }}
      getOptions={async (text) => {
        if(text.length > 2) {
          return await (new Promise((resolve) => {
            controller?.abort();
            controller = new AbortController();
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(async () => {
              try {
                props.sl?.(true);
                const response = await fetch(apiURL(`api/address/${encodeURIComponent(text)}`), { signal: controller.signal });
                props.sl?.(false);
                if(!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
                resolve(response.json());
              } catch(_) {
                // this is fine, previous aborted completion request
              }
            }, 200);
          }));
        }
        return [];
      }}
      {...props}
    />
  );
};

async function fetchAccounts() {
  const response = await fetch(apiURL(`api/accounts/`));
  if(!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
  return await response.json();
}

async function fetchCompose() {
  const response = await fetch(apiURL(`api/compose/`));
  if(!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
  return await response.json();
}

const makeToCc = (msg, action, accounts, mode) => {
  if(!msg || !action || !accounts) return [ [], [] ];

  let tmpTo = [], tmpCc = [];
  if(action === "reply" || action.startsWith("reply-cal-")) {
    if(msg.reply_to) {
      tmpTo = [ msg.reply_to ];
    } else {
      tmpTo = [ msg.from ];
    }
    if(mode !== "one" && !action.startsWith("reply-cal-")) {
      tmpTo = tmpTo.concat(msg.to.split(/(?<=>),\s*|(?<=@[^, ]+),\s*/));

      if(msg.cc.length > 0) {
        tmpCc = msg.cc.split(/(?<=>),\s*|(?<=@[^, ]+),\s*/);
        tmpCc = tmpCc.filter(a => {
          return a.length > 0 && !tmpTo.includes(a) && accounts.reduce((cum, acct) => {
            if(cum === false) return false;

            if(a.includes(acct.email)) {
              return false;
            }
            return true;
          }, true);
        });
      }
    }

    tmpTo = tmpTo.filter(a => {
      return a.length > 0 && accounts.reduce((cum, acct) => {
        if(cum === false) return false;

        if(a.includes(acct.email)) {
          return false;
        }
        return true;
      }, true);
    });
  }
  return [ tmpTo, tmpCc ];
};

export const Write = (props) => {
  const [sp] = createSignal(window.location.search),
        searchParams = new URLSearchParams(sp()),
        baseMessageId = searchParams.get("id"),
        action = searchParams.get("action") || "compose",
        mode = searchParams.get("mode"),
        [baseMessage] = createResource(baseMessageId, fetchMessage),
        [allTags] = createResource(fetchAllTags),
        [accounts] = createResource(fetchAccounts),
        [compose] = createResource(fetchCompose),
        [useTemplate, setUseTemplate] = createSignal(null),
        [bodyRef, setBodyRef] = createSignal(),
        [statusMsg, setStatusMsg] = createSignal(),
        [message, setMessage] = createStore({});
  let draftKey = action,
      defTo = [],
      defCc = [];

  createEffect(() => {
    props.sl?.(allTags.loading || accounts.loading || compose.loading || baseMessage.loading);
    document.title = "Compose: New Message";
    if(localStorage.getItem(`draft-${draftKey}-from`)) {
      setMessage("from", localStorage.getItem(`draft-${draftKey}-from`));
    }

    let acct = accounts()?.find(a => a.default);

    setMessage("files", []);
    if(baseMessage()) {
      if(!draftKey.endsWith(baseMessage().message_id)) {
        draftKey += `-${baseMessage().message_id}`;
      }
      if(action === "forward" && baseMessage().attachments) {
        // attach files attached to previous email
        const newFiles = baseMessage().attachments.map(a => { return { dummy: true, name: a.filename }; });
        setMessage("files", (prevFiles) => [...prevFiles, ...newFiles ]);
      }
      if(action.startsWith("reply-cal-")) {
        const idx = searchParams.get("index"),
              calFile = { dummy: true, name: baseMessage().attachments[idx].filename };
        setMessage("files", (prevFiles) => [...prevFiles, calFile]);
      }

      if(localStorage.getItem(`draft-${draftKey}-from`)) {
        setMessage("from", localStorage.getItem(`draft-${draftKey}-from`));
      } else {
        acct = accounts()?.find(a => baseMessage().to.includes(a.email));
        if(!acct) {
          acct = accounts()?.find(a => baseMessage().from.includes(a.email));
        }
        if(!acct && baseMessage().cc) {
          acct = accounts()?.find(a => baseMessage().cc.includes(a.email));
        }
        if(!acct && baseMessage().bcc) {
          acct = accounts()?.find(a => baseMessage().bcc.includes(a.email));
        }
        if(!acct && baseMessage().delivered_to) {
          acct = accounts()?.find(a => baseMessage().delivered_to.includes(a.email));
        }
        if(!acct && baseMessage().forwarded_to) {
          acct = accounts()?.find(a => baseMessage().forwarded_to.includes(a.email));
        }
      }
      const subj = prefix(baseMessage()?.subject);
      setMessage("subject", subj);
      document.title = `Compose: ${subj}`;

      [defTo, defCc] = makeToCc(baseMessage(), action, accounts(), mode);
    } else {
      setMessage("subject", "");
    }

    setMessage("from", acct?.id);
    setMessage("to", localStorage.getItem(`draft-${draftKey}-to`)?.split('\n') || defTo);
    setMessage("cc", localStorage.getItem(`draft-${draftKey}-cc`)?.split('\n') || defCc);
    setMessage("bcc", localStorage.getItem(`draft-${draftKey}-bcc`)?.split('\n') || []);
    setMessage("tags", localStorage.getItem(`draft-${draftKey}-tags`)?.split('\n') || filterAdminTags(baseMessage()?.tags) || []);
    setMessage("bodyDefaultValue", localStorage.getItem(`draft-${draftKey}-body`) || quote(baseMessage()?.body["text/plain"]) || "");
    setMessage("body", message.bodyDefaultValue);
    if(bodyRef()) {
      bodyRef().value = message.bodyDefaultValue;
    }
  });

  createEffect(() => {
    if(useTemplate()) {
      bodyRef().value = useTemplate() + message.bodyDefaultValue;
      setMessage("body", bodyRef().value);
    }
  });

  const quote = (text) => {
    if(text) {
      let {mainPart, quotedPart} = separateQuotedNonQuoted(text);
      if(quotedPart) {
        mainPart += "[...]";
      }
      return `\n\n\nOn ${baseMessage().date}, ${baseMessage().from} wrote:\n> ${mainPart.replace(/&gt;/g, ">").replace(/&lt;/g, "<").split('\n').join("\n> ")}`;
    }
  };

  const prefix = (text) => {
    if(!text) return "";
    let pre = "";
    if(action === "reply" && !text.toLowerCase().startsWith("re:")) {
      pre = "Re: ";
    }
    if(action === "forward") {
      pre = "Fw: ";
    }
    if(action.startsWith("reply-cal-")) {
      let act = action.split('-')[2];
      pre = act[0].toUpperCase() + act.slice(1) + ": ";
    }
    return pre + text;
  };

  const sendMsg = () => {
    if(!message.from || message.from.length === 0) {
      setStatusMsg(`Error: No from account. Not sending.`);
      return;
    }
    if(message.to.length === 0) {
      setStatusMsg(`Error: No to address. Not sending.`);
      return;
    }
    if(!message.subject) {
      setStatusMsg(`Error: No subject. Not sending.`);
      return;
    }

    const formData = new FormData();
    formData.append('refId', baseMessageId);
    formData.append('action', action);
    formData.append('from', message.from);
    formData.append('to', message.to);
    formData.append('cc', message.cc);
    formData.append('bcc', message.bcc);
    formData.append('subject', message.subject);
    formData.append('tags', message.tags);
    formData.append('body', message.body);
    message.files.map((f, i) => formData.append(`attachment-${i}`, f.dummy ? f.name : f));

    props.sl?.(true);
    fetch(apiURL("api/send"), { method: 'POST', body: formData })
      .then((response) => response.json())
      .then((result) => {
        if(result.sendStatus === 0) {
          setStatusMsg("Message sent.");
          Object.keys(localStorage).filter(k => k.startsWith(`draft-${draftKey}`))
            .map(k => localStorage.removeItem(k));
        } else {
          setStatusMsg(`Error sending message: ${result.sendOutput}`);
        }
      })
      .catch((error) => {
        setStatusMsg(`Error: ${error}`);
      })
      .finally(() => {
        props.sl?.(false);
      });
  };

  mkShortcut(["a"],
    () => document.getElementById("attach").click()
  );

  mkShortcut(["y"],
    () => document.getElementById("send").click()
  );

  mkShortcut(["b"],
    () => bodyRef().focus()
  );

  return (
    <>
      <Show when={!allTags.loading && !accounts.loading && !compose.loading && !baseMessage.loading}>
        <Box width="95%" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Show when={statusMsg()}>
          <Alert severity={statusMsg().startsWith("Error") ? "error" : "success"}>{statusMsg()}</Alert>
        </Show>
        <Show when={compose()}>
          <Templates templates={compose().templates} setTemplate={setUseTemplate}/>
        </Show>
        <Paper elevation={3} class="kukulkan-message">
          <Grid container spacing={1} class="inputFieldSet">
            <Grid item>From:</Grid>
            <Grid item>
              <Select
                class="selectMargin"
                data-testid="from"
                value={message.from}
                onChange={(ev) => {
                  setMessage("from", ev.target.value);
                  localStorage.setItem(`draft-${draftKey}-from`, ev.target.value);
                }}>
                  <For each={accounts()}>
                    {(acct) =>
                      <MenuItem value={acct.id}>
                        {`${acct.name} <${acct.email}>`}
                      </MenuItem>
                    }
                  </For>
              </Select>
            </Grid>
          </Grid>
          <Grid container spacing={1} class="inputFieldSet">
            <Grid item>To:</Grid>
            <Grid item xs>
              <AddrComplete addrAttr="to" message={message} setMessage={setMessage} draftKey={draftKey} data-testid="to" sl={props.sl}/>
            </Grid>
          </Grid>
          <Grid container spacing={1} class="inputFieldSet">
            <Grid item>CC:</Grid>
            <Grid item xs>
              <AddrComplete addrAttr="cc" message={message} setMessage={setMessage}
                draftKey={draftKey}
                data-testid="cc"
                sl={props.sl}
                defVal={localStorage.getItem(`draft-${draftKey}-cc`)?.split('\n') || defCc}/>
            </Grid>
          </Grid>
          <Grid container spacing={1} class="inputFieldSet">
            <Grid item>BCC:</Grid>
            <Grid item xs>
              <AddrComplete addrAttr="bcc" message={message} setMessage={setMessage}
                draftKey={draftKey}
                data-testid="bcc"
                sl={props.sl}
                defVal={localStorage.getItem(`draft-${draftKey}-bcc`)?.split('\n') || []}/>
            </Grid>
          </Grid>
          <Grid container spacing={1} class="inputFieldSet">
            <Grid item>Subject:</Grid>
            <Grid item xs><TextField
              variant="standard"
              defaultValue={localStorage.getItem(`draft-${draftKey}-subject`) || prefix(baseMessage()?.subject)}
              data-testid="subject"
              onChange={(ev) => {
                setMessage("subject", ev.target.value);
                localStorage.setItem(`draft-${draftKey}-subject`, message.subject);
                document.title = `Compose: ${message.subject}`;
              }}
              fullWidth/>
            </Grid>
          </Grid>

          <Grid container spacing={1} class="inputFieldSet">
            <Grid item>Tags:</Grid>
            <Grid item xs>
              <TagComplete
                tags={message.tags}
                allTags={allTags()}
                addTag={(tagToAdd) => {
                  setMessage("tags", message.tags.length, tagToAdd);
                  localStorage.setItem(`draft-${draftKey}-tags`, message.tags.join("\n"));
                }}
                removeTag={(tagToRemove) => {
                  setMessage("tags", message.tags.filter(t => t !== tagToRemove));
                  localStorage.setItem(`draft-${draftKey}-tags`, message.tags.join("\n"));
                }}
                data-testid="tagedit"
              />
            </Grid>
          </Grid>

          <TextField
            multiline
            minRows={10}
            maxRows={window.innerHeight / parseFloat(window.getComputedStyle(document.getElementsByTagName("body")[0]).getPropertyValue("line-height")) - 18}
            fullWidth
            inputRef={setBodyRef}
            data-testid="body"
            sx={{ marginBottom: ".5em", marginTop: "1em" }}
            onFocus={async (ev) => {
              if(compose()["external-editor"]) {
                const formData = new FormData();
                formData.append('body', ev.target.value);

                ev.target.disabled = true;
                ev.target.value = "[Editing externally...]";
                const response = await fetch(apiURL("api/edit_external"), { method: 'POST', body: formData });
                ev.target.value = await response.text();
                ev.target.disabled = false;
                localStorage.setItem(`draft-${draftKey}-body`, ev.target.value);
                setMessage("body", ev.target.value);
              }
            }}
            onChange={(ev) => {
              localStorage.setItem(`draft-${draftKey}-body`, ev.target.value);
              setMessage("body", ev.target.value);
            }}/>
          <For each={message.files}>
            {(f) => <ColorChip value={`${f.name}` + (f.size ? ` (${formatFSz(f.size)})` : ``)} onClick={(e) => {
                setMessage("files", message.files.filter(fi => fi !== f));
                e.stopPropagation();
              }}/>
            }
          </For>
          <Grid container sx={{ marginTop: ".5em" }}>
            <Grid item xs>
              <Button id="attach" startIcon={<AttachFile/>} variant="outlined" component="label">
                Attach
                <input type="file" multiple hidden onChange={(ev) => {
                  setMessage("files", (prevFiles) => [...prevFiles, ...Array.from(ev.target.files)]);
                  // not storing these in localStorage as we would have to
                  // encode/decode them and contents would become stale
                }}/>
              </Button>
            </Grid>
            <Grid item>
              <Button id="send" startIcon={<Send/>} variant="outlined" onClick={sendMsg}>Send</Button>
            </Grid>
          </Grid>
        </Paper>
        </Box>
      </Show>
    </>
  );
};

// vim: tabstop=2 shiftwidth=2 expandtab
