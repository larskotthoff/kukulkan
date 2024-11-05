import { createEffect, createSignal, For, Show } from "solid-js";
import { createStore } from "solid-js/store";

import Button from "@suid/material/Button";
import Grid from "@suid/material/Grid";
import MenuItem from "@suid/material/MenuItem";
import Select from "@suid/material/Select";
import TextField from "@suid/material/TextField";

import AttachFile from "@suid/icons-material/AttachFile";
import Send from "@suid/icons-material/Send";

import { Alert } from "./Alert.jsx";
import { ChipComplete, TagComplete } from "./Autocomplete.jsx";
import { ColorChip } from "./ColorChip.jsx";

import { getSetting } from "./Settings.jsx";

import "./Kukulkan.css";
import { separateQuotedNonQuoted } from "./Message.jsx";
import { apiURL, filterAdminTags, formatFSz } from "./utils.js";
import { mkShortcut } from "./UiUtils.jsx";

function Templates(props) {
  return (
    <Grid container spacing={1} class="centered" sx={{ justifyContent: 'center', width: 'fit-content' }}>
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
}

function AddrComplete(props) {
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
        if(props.message[props.addrAttr].length > 0) {
          localStorage.setItem(`draft-${props.draftKey}-${props.addrAttr}`, props.message[props.addrAttr].join("\n"));
        } else {
          localStorage.removeItem(`draft-${props.draftKey}-${props.addrAttr}`);
        }
      }}
      // eslint-disable-next-line solid/reactivity
      getOptions={async (text) => {
        if(text.length > 2) {
          return await (new Promise((resolve) => {
            controller?.abort();
            controller = new AbortController();
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(async () => {
              try {
                props.sp?.(0);
                const response = await fetch(apiURL(`api/address/${encodeURIComponent(text)}`), { signal: controller.signal });
                props.sp?.(100);
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
}

function makeToCc(msg, action, mode) {
  if(!msg || !action) return [ [], [] ];

  let tmpTo = [], tmpCc = [];
  if(action === "reply" || action.startsWith("reply-cal-")) {
    if(msg.reply_to) {
      tmpTo = [ msg.reply_to ];
    } else {
      tmpTo = [ msg.from ];
    }
    if(mode !== "one" && !action.startsWith("reply-cal-")) {
      tmpTo = tmpTo.concat(msg.to);

      if(msg.cc.length > 0) {
        tmpCc = msg.cc;
        tmpCc = tmpCc.filter(a => {
          // eslint-disable-next-line no-undef
          return a.length > 0 && !tmpTo.includes(a) && data.accounts.reduce((cum, acct) => {
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
      // eslint-disable-next-line no-undef
      return a.length > 0 && data.accounts.reduce((cum, acct) => {
        if(cum === false) return false;

        if(a.includes(acct.email)) {
          return false;
        }
        return true;
      }, true);
    });
  }
  return [ tmpTo, tmpCc ];
}

export function Write(props) {
  const searchParams = window.location.search,
        urlSearchParams = new URLSearchParams(searchParams),
        baseMessageId = urlSearchParams.get("id"),
        action = urlSearchParams.get("action") || "compose",
        mode = urlSearchParams.get("mode"),
        [useTemplate, setUseTemplate] = createSignal(null),
        [bodyRef, setBodyRef] = createSignal(),
        [statusMsg, setStatusMsg] = createSignal(),
        [message, setMessage] = createStore({});
  let defTo = [],
      defCc = [],
      draftKey = action;

  document.title = "Compose: New Message";

  // eslint-disable-next-line no-undef
  let defAcct = data.accounts?.find(a => a.default),
      from = defAcct?.id,
      subject = "";

  setMessage("files", []);
  // eslint-disable-next-line no-undef
  if(data.baseMessage) {
    // eslint-disable-next-line no-undef
    if(!draftKey.endsWith(data.baseMessage.message_id)) {
      // eslint-disable-next-line no-undef
      draftKey += `-${data.baseMessage.message_id}`;
    }
    if(action === "forward") {
      // eslint-disable-next-line no-undef
      if(data.baseMessage.attachments) {
        // attach files attached to previous email
        // eslint-disable-next-line no-undef
        const newFiles = data.baseMessage.attachments.map(a => { return { dummy: true, name: a.filename }; });
        setMessage("files", (prevFiles) => [...prevFiles, ...newFiles ]);
      }
      // eslint-disable-next-line no-undef
      if(data.baseMessage.body["text/html"]) {
        // attach HTML part of original email
        setMessage("files", (prevFiles) => [...prevFiles, ...[{dummy: true, name: "Original HTML message"}] ]);
      }
    }
    if(action.startsWith("reply-cal-")) {
      const idx = urlSearchParams.get("index"),
            // eslint-disable-next-line no-undef
            calFile = { dummy: true, name: data.baseMessage.attachments[idx].filename };
      setMessage("files", (prevFiles) => [...prevFiles, calFile]);
    }

    if(!localStorage.getItem(`draft-${draftKey}-from`)) {
      // eslint-disable-next-line no-undef
      let acct = data.accounts?.find(a => data.baseMessage.to.some(t => t.includes(a.email)));
      if(!acct) {
        // eslint-disable-next-line no-undef
        acct = data.accounts?.find(a => data.baseMessage.from.includes(a.email));
      }
      // eslint-disable-next-line no-undef
      if(!acct && data.baseMessage.cc) {
        // eslint-disable-next-line no-undef
        acct = data.accounts?.find(a => data.baseMessage.cc.some(c => c.includes(a.email)));
      }
      // eslint-disable-next-line no-undef
      if(!acct && data.baseMessage.bcc) {
        // eslint-disable-next-line no-undef
        acct = data.accounts?.find(a => data.baseMessage.bcc.some(b => b.includes(a.email)));
      }
      // eslint-disable-next-line no-undef
      if(!acct && data.baseMessage.delivered_to) {
        // eslint-disable-next-line no-undef
        acct = data.accounts?.find(a => data.baseMessage.delivered_to.includes(a.email));
      }
      // eslint-disable-next-line no-undef
      if(!acct && data.baseMessage.forwarded_to) {
        // eslint-disable-next-line no-undef
        acct = data.accounts?.find(a => data.baseMessage.forwarded_to.includes(a.email));
      }
      from = acct?.id;
    }

    // eslint-disable-next-line no-undef
    subject = prefix(data.baseMessage?.subject);
    document.title = `Compose: ${subject}`;

    // eslint-disable-next-line no-undef
    [defTo, defCc] = makeToCc(data.baseMessage, action, mode);
  }

  if(localStorage.getItem(`draft-${draftKey}-from`)) {
    from = localStorage.getItem(`draft-${draftKey}-from`);
  } else if(!from) {
    from = defAcct?.id;
  }
  setMessage("from", from);
  if(localStorage.getItem(`draft-${draftKey}-subject`)) {
    subject = localStorage.getItem(`draft-${draftKey}-subject`);
    document.title = `Compose: ${subject}`;
  }
  setMessage("subject", subject);
  setMessage("from", from);
  setMessage("to", localStorage.getItem(`draft-${draftKey}-to`)?.split('\n') || defTo);
  setMessage("cc", localStorage.getItem(`draft-${draftKey}-cc`)?.split('\n') || defCc);
  setMessage("bcc", localStorage.getItem(`draft-${draftKey}-bcc`)?.split('\n') || []);
  // eslint-disable-next-line no-undef
  setMessage("tags", localStorage.getItem(`draft-${draftKey}-tags`)?.split('\n') || filterAdminTags(data.baseMessage?.tags) || []);
  // eslint-disable-next-line no-undef
  setMessage("bodyDefaultValue", localStorage.getItem(`draft-${draftKey}-body`) || quote(data.baseMessage?.body["text/plain"]) || "");
  // eslint-disable-next-line solid/reactivity
  setMessage("body", message.bodyDefaultValue);

  createEffect(() => {
    if(bodyRef()) {
      bodyRef().value = message.bodyDefaultValue;
    }
  });

  createEffect(() => {
    if(useTemplate() && bodyRef().disabled === false) {
      bodyRef().value = useTemplate() + message.bodyDefaultValue;
      bodyRef().style.height = 'auto';
      setMessage("body", bodyRef().value);
    }
  });

  function quote(text) {
    if(text) {
      let {mainPart, quotedPart} = separateQuotedNonQuoted(text);
      mainPart = mainPart.replace(/&gt;/g, ">").replace(/&lt;/g, "<").split('\n').join("\n> ");
      if(quotedPart) {
        if(getSetting("abbreviateQuoted") && action === "reply") {
          mainPart += "\n> [...]";
        } else {
          mainPart += `\n> ${quotedPart.split('\n').join("\n> ")}`;
        }
      }
      // eslint-disable-next-line no-undef
      return `\n\n\nOn ${data.baseMessage.date}, ${data.baseMessage.from} wrote:\n> ${mainPart}`;
    }
  }

  function prefix(text) {
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
  }

  function listenForUpdates(sendId) {
    const eventSource = new EventSource(apiURL(`api/send_progress/${sendId}`));

    eventSource.onmessage = function(message) {
      const data = JSON.parse(message.data);

      if(data.send_status === "sending") {
        props.sp?.(Math.min(data.progress * 100, 99.9));
      } else {
        if(data.send_status === 0) {
          props.sp?.(100);
          setStatusMsg("Message sent.");
          Object.keys(localStorage).filter(k => k.startsWith(`draft-${draftKey}`))
            .map(k => localStorage.removeItem(k));
        } else {
          setStatusMsg(`Error sending message: ${data.send_output}`);
        }
        eventSource.close();
      }
    };

    eventSource.onerror = function(error) {
      setStatusMsg(`Error: ${error}`);
      eventSource.close();
    };
  }

  function sendMsg() {
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
    formData.append('to', message.to.join('\n'));
    formData.append('cc', message.cc.join('\n'));
    formData.append('bcc', message.bcc.join('\n'));
    formData.append('subject', message.subject);
    formData.append('tags', message.tags);
    formData.append('body', message.body);
    message.files.map((f, i) => formData.append(`attachment-${i}`, f.dummy ? f.name : f));

    props.sp?.(0);
    fetch(apiURL("api/send"), { method: 'POST', body: formData })
      .then((response) => response.json())
      .then((data) => {
        listenForUpdates(data.send_id);
      })
      .catch((error) => {
        setStatusMsg(`Error: ${JSON.stringify(error)}`);
      });
  }

  mkShortcut(["a"],
    () => document.getElementById("attach").click()
  );

  mkShortcut(["y"],
    // eslint-disable-next-line solid/reactivity
    () => bodyRef().disabled || document.getElementById("send").click()
  );

  mkShortcut(["b"],
    // eslint-disable-next-line solid/reactivity
    () => bodyRef().disabled || bodyRef().focus()
  );

  mkShortcut(["d"],
    // eslint-disable-next-line solid/reactivity
    () => Object.keys(localStorage).filter(k => k.startsWith(`draft-${draftKey}`))
            .map(k => localStorage.removeItem(k))
  );

  return (
    <>
      <Show when={statusMsg()}>
        <Alert severity={statusMsg().startsWith("Error") ? "error" : "success"}>{statusMsg()}</Alert>
      </Show>
      { /* eslint-disable-next-line no-undef */ }
      <Show when={data.compose}>
        { /* eslint-disable-next-line no-undef */ }
        <Templates templates={data.compose.templates} setTemplate={setUseTemplate}/>
      </Show>
      <div class="paper message centered">
        <Grid container spacing={1} class="input-field-set">
          <Grid item>From:</Grid>
          <Grid item>
            <Select
              class="select-margin"
              data-testid="from"
              value={message.from || ""}
              onChange={(ev) => {
                setMessage("from", ev.target.value);
                localStorage.setItem(`draft-${draftKey}-from`, ev.target.value);
              }}>
                { /* eslint-disable-next-line no-undef */ }
                <For each={data.accounts}>
                  {(acct) =>
                    <MenuItem value={acct.id}>
                      {`${acct.name} <${acct.email}>`}
                    </MenuItem>
                  }
                </For>
            </Select>
          </Grid>
        </Grid>
        <Grid container spacing={1} class="input-field-set">
          <Grid item>To:</Grid>
          <Grid item xs>
            <AddrComplete addrAttr="to" message={message} setMessage={setMessage}
              draftKey={draftKey}
              data-testid="to"
              sp={props.sp}/>
          </Grid>
        </Grid>
        <Grid container spacing={1} class="input-field-set">
          <Grid item>CC:</Grid>
          <Grid item xs>
            <AddrComplete addrAttr="cc" message={message} setMessage={setMessage}
              draftKey={draftKey}
              data-testid="cc"
              sp={props.sp}/>
          </Grid>
        </Grid>
        <Grid container spacing={1} class="input-field-set">
          <Grid item>BCC:</Grid>
          <Grid item xs>
            <AddrComplete addrAttr="bcc" message={message} setMessage={setMessage}
              draftKey={draftKey}
              data-testid="bcc"
              sp={props.sp}/>
          </Grid>
        </Grid>
        <Grid container spacing={1} class="input-field-set">
          <Grid item>Subject:</Grid>
          <Grid item xs><TextField
            variant="standard"
            value={message.subject || ""}
            data-testid="subject"
            onChange={(ev) => {
              setMessage("subject", ev.target.value);
              localStorage.setItem(`draft-${draftKey}-subject`, message.subject);
              document.title = `Compose: ${message.subject}`;
            }}
            fullWidth/>
          </Grid>
        </Grid>

        <Grid container spacing={1} class="input-field-set">
          <Grid item>Tags:</Grid>
          <Grid item xs>
            <TagComplete
              tags={message.tags}
              addTag={(tagToAdd) => {
                setMessage("tags", message.tags.length, tagToAdd);
                localStorage.setItem(`draft-${draftKey}-tags`, message.tags.join("\n"));
              }}
              removeTag={(tagToRemove) => {
                setMessage("tags", message.tags.filter(t => t !== tagToRemove));
                if(message.tags.length > 0) {
                  localStorage.setItem(`draft-${draftKey}-tags`, message.tags.join("\n"));
                } else {
                  localStorage.removeItem(`draft-${draftKey}-tags`);
                }
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
          // eslint-disable-next-line solid/reactivity
          onFocus={async (ev) => {
            // eslint-disable-next-line no-undef
            if((getSetting("externalCompose") === -1 && data.compose["external-editor"]) || (getSetting("externalCompose") === true)) {
              const formData = new FormData();
              formData.append('body', ev.target.value);

              ev.target.disabled = true;
              ev.target.value = "[Editing externally...]";
              const url = getSetting("externalCompose") === true ?
                `${window.location.protocol}//localhost:${window.location.port}/api/edit_external` :
                apiURL("api/edit_external");
              const response = await fetch(url, { method: 'POST', body: formData });
              ev.target.value = await response.text();
              ev.target.disabled = false;
              localStorage.setItem(`draft-${draftKey}-body`, ev.target.value);
              setMessage("body", ev.target.value);
              ev.target.style.height = 'auto';
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
      </div>
    </>
  );
}

// vim: tabstop=2 shiftwidth=2 expandtab
