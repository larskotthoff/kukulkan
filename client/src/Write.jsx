import { createEffect, createSignal, For, on, Show } from "solid-js";
import { createStore } from "solid-js/store";

import { Alert } from "./Alert.jsx";
import { ChipComplete, TagComplete } from "./Autocomplete.jsx";
import { ColorChip } from "./ColorChip.jsx";

import { getSetting } from "./Settings.jsx";

import "./Kukulkan.css";
import { separateQuotedNonQuoted } from "./Message.jsx";
import { apiURL, delayedDebouncedFetch, filterAdminTags, formatFSz } from "./utils.js";
import { mkShortcut, Icon, AttachFile, Send } from "./UiUtils.jsx";

function Templates(props) {
  return (
    <div class="centered horizontal-stack justify-center">
      <For each={props.templates}>
        {(template) => {
          mkShortcut([[template.shortcut]],
            () => document.getElementById(`template-${template.shortcut}`).click()
          );
          return (<button id={`template-${template.shortcut}`} onClick={() => props.setTemplate(template.template) }>{template.description} ({template.shortcut})</button>);
        }}
      </For>
    </div>
  );
}

function AddrComplete(props) {
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
          return delayedDebouncedFetch(apiURL(`api/address/${encodeURIComponent(text)}`), 200, props.sp);
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
      return a.length > 0 && data.accounts.reduce((cum, acct) => {
        if(cum === false) return false;

        if(a.includes(acct.email)) {
          return false;
        }
        return true;
      }, true);
    });
  }
  return [ [...new Set(tmpTo)], [...new Set(tmpCc)] ];
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

  let defAcct = data.accounts?.find(a => a.default),
      from = defAcct?.id,
      subject = "";

  setMessage("files", []);
  if(data.baseMessage) {
    if(!draftKey.endsWith(data.baseMessage.message_id)) {
      draftKey += `-${data.baseMessage.message_id}`;
    }
    if(action === "forward") {
      if(data.baseMessage.attachments) {
        // attach files attached to previous email
        const newFiles = data.baseMessage.attachments.map(a => { return { dummy: true, name: a.filename }; });
        setMessage("files", (prevFiles) => [...prevFiles, ...newFiles ]);
      }
      if(data.baseMessage.body["text/html"]) {
        // attach HTML part of original email
        setMessage("files", (prevFiles) => [...prevFiles, ...[{dummy: true, name: "Original HTML message"}] ]);
      }
    }
    if(action.startsWith("reply-cal-")) {
      const idx = urlSearchParams.get("index"),
            calFile = { dummy: true, name: data.baseMessage.attachments[idx].filename };
      setMessage("files", (prevFiles) => [...prevFiles, calFile]);
    }

    if(!localStorage.getItem(`draft-${draftKey}-from`)) {
      let acct = data.accounts?.find(a => data.baseMessage.to.some(t => t.includes(a.email)));
      if(!acct) {
        acct = data.accounts?.find(a => data.baseMessage.from.includes(a.email));
      }
      if(!acct && data.baseMessage.cc) {
        acct = data.accounts?.find(a => data.baseMessage.cc.some(c => c.includes(a.email)));
      }
      if(!acct && data.baseMessage.bcc) {
        acct = data.accounts?.find(a => data.baseMessage.bcc.some(b => b.includes(a.email)));
      }
      if(!acct && data.baseMessage.delivered_to) {
        acct = data.accounts?.find(a => data.baseMessage.delivered_to.includes(a.email));
      }
      if(!acct && data.baseMessage.forwarded_to) {
        acct = data.accounts?.find(a => data.baseMessage.forwarded_to.includes(a.email));
      }
      from = acct?.id;
    }

    subject = prefix(data.baseMessage?.subject);
    document.title = `Compose: ${subject}`;

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
  setMessage("tags", localStorage.getItem(`draft-${draftKey}-tags`)?.split('\n') || filterAdminTags(data.baseMessage?.tags) || []);
  setMessage("bodyDefaultValue", localStorage.getItem(`draft-${draftKey}-body`) || quote(data.baseMessage?.body["text/plain"]) || "");
  // eslint-disable-next-line solid/reactivity
  setMessage("body", message.bodyDefaultValue);

  createEffect(on(bodyRef, () => {
    if(bodyRef()) {
      bodyRef().value = message.bodyDefaultValue;
    }
  }));

  createEffect(on(useTemplate, () => {
    if(useTemplate() && bodyRef().disabled === false) {
      bodyRef().value = useTemplate() + message.bodyDefaultValue;
      setMessage("body", bodyRef().value);
    }
  }));

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
      return `\n\n\nOn ${data.baseMessage.date}, ${data.baseMessage.from} wrote:\n> ${mainPart}`;
    }
  }

  function prefix(text) {
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

    eventSource.onopen = function() {
        props.sp?.(0);
    }

    eventSource.onmessage = function(message) {
      const data = JSON.parse(message.data);

      if(data.send_status === "sending") {
        props.sp?.(Math.min(data.progress, 0.99));
      } else {
        if(data.send_status === 0) {
          props.sp?.(1);
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
    setStatusMsg();
    document.getElementById("send").disabled = true;

    if(message.to.length === 0) {
      setStatusMsg(`Error: No to address. Not sending.`);
      document.getElementById("send").disabled = false;
      return;
    }
    if(!message.subject) {
      setStatusMsg(`Error: No subject. Not sending.`);
      document.getElementById("send").disabled = false;
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
      })
      .finally(() => {
        document.getElementById("send").disabled = false;
      });
  }

  mkShortcut([["a"]],
    () => document.getElementById("attach").click()
  );

  mkShortcut([["y"]],
    () => document.getElementById("send").click()
  );

  mkShortcut([["b"]],
    // eslint-disable-next-line solid/reactivity
    () => bodyRef().disabled || bodyRef().focus(),
    true
  );

  mkShortcut([["d"]],
    () => Object.keys(localStorage).filter(k => k.startsWith(`draft-${draftKey}`))
            .map(k => localStorage.removeItem(k))
  );

  return (
    <>
      <Show when={statusMsg()}>
        <Alert class="centered fit-content margin-bottom" severity={statusMsg().startsWith("Error") ? "error" : "success"}>{statusMsg()}</Alert>
      </Show>
      <Show when={data.compose}>
        <Templates templates={data.compose.templates} setTemplate={setUseTemplate}/>
      </Show>
      <div class="paper message centered margin">
        <div class="horizontal-stack justify-start align-center">
          From:
          <select
            data-testid="from"
            value={message.from || ""}
            onChange={(ev) => {
              setMessage("from", ev.target.value);
              localStorage.setItem(`draft-${draftKey}-from`, ev.target.value);
            }}>
              <For each={data.accounts}>
                {(acct) =>
                  <option value={acct.id}>
                    {`${acct.name} <${acct.email}>`}
                  </option>
                }
              </For>
          </select>
        </div>
        <div class="horizontal-stack align-center">
          To:
          <AddrComplete addrAttr="to" message={message} setMessage={setMessage}
            draftKey={draftKey}
            data-testid="to"
            sp={props.sp}/>
        </div>
        <div class="horizontal-stack align-center">
          CC:
          <AddrComplete addrAttr="cc" message={message} setMessage={setMessage}
            draftKey={draftKey}
            data-testid="cc"
            sp={props.sp}/>
        </div>
        <div class="horizontal-stack align-center">
          BCC:
          <AddrComplete addrAttr="bcc" message={message} setMessage={setMessage}
            draftKey={draftKey}
            data-testid="bcc"
            sp={props.sp}/>
        </div>
        <div class="horizontal-stack align-center">
          Subject:
          <input
            type="text"
            class="input-wide"
            value={message.subject || ""}
            data-testid="subject"
            onInput={(ev) => {
              setMessage("subject", ev.target.value);
              localStorage.setItem(`draft-${draftKey}-subject`, message.subject);
              document.title = `Compose: ${message.subject}`;
            }}/>
        </div>

        <div class="horizontal-stack align-center">
          Tags:
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
        </div>

        <textarea
          class="input-wide margin"
          rows={window.innerHeight / parseFloat(window.getComputedStyle(document.getElementsByTagName("body")[0]).getPropertyValue("line-height")) - 18}
          ref={setBodyRef}
          data-testid="body"
          onFocus={async (ev) => {
            if((getSetting("externalCompose") === -1 && data.compose["external-editor"]) || (getSetting("externalCompose") === true)) {
              const formData = new FormData();
              formData.append('body', ev.target.value);

              ev.target.disabled = true;
              document.getElementById("send").disabled = true;
              ev.target.value = "[Editing externally...]";
              const url = getSetting("externalCompose") === true ?
                `${window.location.protocol}//localhost:${window.location.port}/api/edit_external` :
                apiURL("api/edit_external");
              const response = await fetch(url, { method: 'POST', body: formData });
              ev.target.value = await response.text();
              ev.target.disabled = false;
              document.getElementById("send").disabled = false;
              localStorage.setItem(`draft-${draftKey}-body`, ev.target.value);
              setMessage("body", ev.target.value);
            }
          }}
          onInput={(ev) => {
            localStorage.setItem(`draft-${draftKey}-body`, ev.target.value);
            setMessage("body", ev.target.value);
          }}/>
        <Show when={message.files.length > 0}>
          <div class="margin-bottom">
            <For each={message.files}>
              {(f) => <ColorChip value={`${f.name}` + (f.size ? ` (${formatFSz(f.size)})` : ``)} onClick={(e) => {
                  setMessage("files", message.files.filter(fi => fi !== f));
                  e.stopPropagation();
                }}/>
              }
            </For>
          </div>
        </Show>
        <div class="horizontal-stack space-between">
          <button onClick={() => document.getElementById("attach").click()}>
            <Icon icon={AttachFile}/>
            <span>Attach</span>
            <input type="file" id="attach" multiple hidden onChange={(ev) => {
              setMessage("files", (prevFiles) => [...prevFiles, ...Array.from(ev.target.files)]);
              // not storing these in localStorage as we would have to
              // encode/decode them and contents would become stale
            }}/>
          </button>
          <button id="send" onClick={sendMsg}><Icon icon={Send}/><span>Send</span></button>
        </div>
      </div>
    </>
  );
}

// vim: tabstop=2 shiftwidth=2 expandtab
