import { createEffect, createSignal, For, on, onMount, Show } from "solid-js";

import { getSetting } from "./Settings.jsx";

import { linkifyUrlsToHtml } from "linkify-urls";
const linkifyOpts = { attributes: { target: getSetting("openInTab"), rel: "nofollow" } };

import { Alert } from "./Alert.jsx";
import { ColorChip } from "./ColorChip.jsx";
import { TagComplete } from "./Autocomplete.jsx";

import { apiURL, formatDate, formatFSz, splitAddressHeader, strip } from "./utils.js";
import { mkShortcut, Icon, AttachFile, Cancel, CheckCircle, Forward, Help, MarkUnread, Print, ReplyAll, Security, Trash } from "./UiUtils.jsx";

export function separateQuotedNonQuoted(text) {
  let lines = text.split('\n'),
      lastLine = lines.length;
  for(let index = 1; index < lines.length; index++) {
    let line = strip(lines[index].trim());
    if((line === "--") || (line === "—")) { // signature block
      lastLine = index - 1;
      break;
    } else if(line.match(/^From:/)) { // outlook
      lastLine = index;
      break;
    } else if(line.match(/^On.*wrote:$/)) { // various
      lastLine = index;
      if(!lines.slice(lastLine).some(l => l.startsWith(">") || l.startsWith("&gt;"))) {
        // only break if there are no quote signs afterwards (outlook)
        break;
      }
    } else if(line === "-----Original Message-----") { // also outlook
      lastLine = index;
      break;
    } else if(line.match(/^-+$/)) {
      lastLine = index;
      break;
    } else if(line.match(/^_+$/)) { // outlook mailing lists I think
      lastLine = index;
      break;
    } else if(line.length > 1 && !line.startsWith(">") && !line.startsWith("&gt;")) {
      // don't break if we see a > because there may be inline replies
      lastLine = index + 1;
    } else if(lastLine === lines.length && (line.startsWith(">") || line.startsWith("&gt;"))) {
      lastLine = index;
    }
  }

  // only whitespace on remaining lines
  if(lines.slice(lastLine).join("").match(/^\s*$/)) lastLine = lines.length;

  let mainPart = lines.slice(0, lastLine).join('\n'),
      quotedPart = null;
  if(lastLine !== lines.length) {
    quotedPart = lines.slice(lastLine).join('\n');
  }

  return {mainPart, quotedPart};
}

function formatDateTZ(date) {
  let ret = date;
  if((new Date()).getTimezoneOffset() !== (date.substring(date.length - 5, date.length - 4) === "+" ? -1 : 1) * (parseInt(date.substring(date.length - 4, date.length - 2), 10) * 60 + parseInt(date.substring(date.length - 2), 10)))
    ret += ` (${(new Date(date)).toLocaleString()})`;
  return ret;
}

function formatAddrs(addrs) {
  if(!(addrs instanceof Array)) {
    addrs = [addrs];
  }
  return addrs.map((addr) => {
    let pts = splitAddressHeader(addr);
    return (<ColorChip key={pts[0]} value={addr}/>);
  });
}

function angles(text) {
  return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function printUrl(id) {
  return `/message?id=${encodeURIComponent(id)}&print=true`;
}

function replyUrl(id, mode = "all") {
  return `/write?action=reply&id=${encodeURIComponent(id)}&mode=${mode}`;
}

function fwdUrl(id) {
  return `/write?action=forward&id=${encodeURIComponent(id)}`;
}

function secUrl(id) {
  return apiURL(`api/auth_message/${encodeURIComponent(id)}`);
}

function calUrl(id, action, index) {
  return `/write?action=reply-cal-${action}&id=${encodeURIComponent(id)}&index=${index}`;
}

function calendarAction(msg, attachment, index) {
  if(attachment.preview.method === "REQUEST" && attachment.preview.status === "NEEDS-ACTION") {
    return (<div class="horizontal-stack margin">
      <a href={calUrl(msg.notmuch_id, 'accept', index)} target={getSetting("openInTab")} rel="noreferrer">
        <Icon icon={CheckCircle}/>
      </a>
      <a href={calUrl(msg.notmuch_id, 'decline', index)} target={getSetting("openInTab")} rel="noreferrer">
        <Icon icon={Cancel}/>
      </a>
      <a href={calUrl(msg.notmuch_id, 'tentative', index)} target={getSetting("openInTab")} rel="noreferrer">
        <Icon icon={Help}/>
      </a>
      </div>);
  } else if(attachment.preview.status === "ACCEPTED") {
      return (<Icon icon={CheckCircle} style={{ margin: "8px" }}/>);
  } else if(attachment.preview.status === "DECLINED") {
      return (<Icon icon={Cancel} style={{ margin: "8px" }}/>);
  } else if(attachment.preview.status === "TENTATIVE") {
      return (<Icon icon={Help} style={{ margin: "8px" }}/>);
  }
}

function handleAttachment(msg, attachment, index, summary) {
  if(attachment.content_type.includes("image")) {
    return (<a href={apiURL(`api/attachment/${encodeURIComponent(msg.notmuch_id)}/${index}`)} target={getSetting("openInTab")} rel="noreferrer">
        <img src={apiURL(`api/attachment/${encodeURIComponent(msg.notmuch_id)}/${index}/1`)} alt={attachment.filename}/>
      </a>);
  } else if(attachment.content_type.includes("calendar") && attachment.preview !== null && summary === false) {
    return (<div><a href={apiURL(`api/attachment/${encodeURIComponent(msg.notmuch_id)}/${index}`)} target={getSetting("openInTab")} rel="noreferrer">
        <Icon icon={AttachFile}/>{attachment.filename}
        {" (" + formatFSz(attachment.content_size) + ", " + attachment.content_type + ")"}
      </a>
      <a target={getSetting("openInTab")} rel="noreferrer"
        href={"https://www.google.com/calendar/render?action=TEMPLATE&text=" +
          encodeURIComponent(attachment.preview.summary) +
          "&dates=" + encodeURIComponent(attachment.preview.dtstart) +
          "/" + encodeURIComponent(attachment.preview.dtend) +
          "&location=" + encodeURIComponent(attachment.preview.location) +
          "&ctz=" + encodeURIComponent(attachment.preview.tz) +
          (attachment.preview.rrule !== null ? ("&recur=RRULE:" + encodeURIComponent(attachment.preview.rrule)) : "") +
          "&sf=true&output=xml"}>
        <div class="cal-preview paper">
          { attachment.preview.summary + " (" + attachment.preview.location + ")\n" +
            formatDate(new Date(attachment.preview.start * 1000)) + " — " +
            formatDate(new Date(attachment.preview.end * 1000)) + "\n" +
            attachment.preview.attendees + "\n" + attachment.preview.recur }
        </div>
      </a>
      { calendarAction(msg, attachment, index) }
      </div>);
  } else if(attachment.content_type.includes("message/rfc822")) {
    return (<a href={`/message?id=${encodeURIComponent(msg.notmuch_id)}&attachNum=${index}`} target={getSetting("openInTab")} rel="noreferrer"><Icon icon={AttachFile}/>{attachment.filename}
      {summary ? "" : " (" + formatFSz(attachment.content_size) + ", " + attachment.content_type + ")"}
      </a>);
  } else {
    return (<a href={apiURL(`api/attachment/${encodeURIComponent(msg.notmuch_id)}/${index}`)} target={getSetting("openInTab")} rel="noreferrer"><Icon icon={AttachFile}/>{attachment.filename}
      {summary ? "" : " (" + formatFSz(attachment.content_size) + ", " + attachment.content_type + ")"}
      </a>);
  }
}

// claude helped with this
function ShadowRoot(props) {
  let containerRef;

  onMount(() => {
    if(containerRef) {
      const shadow = containerRef.attachShadow({mode: "open"}),
            contentDiv = document.createElement("div");
      shadow.appendChild(contentDiv);

      createEffect(on(() => props.html, () => {
        contentDiv.innerHTML = props.html;
      }));
    }
  });

  return <div ref={containerRef}/>;
}

function HeaderLine(props) {
  return (
    <div class="horizontal-stack justify-start"><span>{props.left}</span><span>{props.right}</span></div>
  );
}

export function Message(props) {
  const [showQuoted, setShowQuoted] = createSignal(false),
        [html, setHtml] = createSignal(false),
        [htmlContent, setHtmlContent] = createSignal(undefined),
        // eslint-disable-next-line solid/reactivity
        msg = props.msg,
        [tags, setTags] = createSignal(msg.tags.sort()),
        {mainPart, quotedPart} = separateQuotedNonQuoted(msg.body["text/plain"]);
  let elementTop;

  async function changeTags(tagChanges) {
    props.sp?.(0);
    const response = await fetch(apiURL(`api/tag_batch/message/${encodeURIComponent(msg.notmuch_id)}/${encodeURIComponent(tagChanges)}`));
    props.sp?.(1);
    if(!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
    tagChanges.split(' ').forEach((edit) => {
      if(edit[0] === '-') {
        setTags(tags().filter((t) => t !== edit.substring(1)));
      } else {
        if(tags().indexOf(edit) === -1) {
          const tmp = tags().concat(edit);
          setTags(tmp.sort());
        }
      }
    });
    msg.tags = tags();
  }

  let sigMsg = "",
      sigSev = "warning";

  if(msg.signature) {
    if(msg.signature.valid) {
      sigMsg += "Signature verified";
      sigSev = "success";
    } else if(msg.signature.valid === null) {
      sigMsg += "Signature could not be verified";
    } else {
      sigMsg += "Signature verification failed";
      sigSev = "error";
    }
    if(msg.signature.message) {
      // eslint-disable-next-line solid/reactivity
      sigMsg += ` (${props.msg.signature.message})`;
    }
  }
  sigMsg += ".";

  createEffect(on(() => props.active, () => {
    if(props.active) {
      elementTop?.scrollIntoView({block: "nearest"});
      document.title = msg.subject || "Kukulkan";
      if(msg.tags.includes("unread")) setTimeout(() => changeTags("-unread"), 500);
    }
  }));

  mkShortcut([["e"]],
    // eslint-disable-next-line solid/reactivity
    () => { if(props.active) document.querySelector("div.message.active > div.preview-container")?.click(); }
  );

  mkShortcut([["r"]],
    // eslint-disable-next-line solid/reactivity
    () => { if(props.active) document.querySelector("a[id='reply']")?.click(); }
  );

  mkShortcut([["Shift", "r"]],
    // eslint-disable-next-line solid/reactivity
    () => { if(props.active) window.open(replyUrl(msg.notmuch_id, "one"), getSetting("openInTab")); }
  );

  mkShortcut([["f"]],
    // eslint-disable-next-line solid/reactivity
    () => { if(props.active) document.querySelector("a[id='forward']")?.click(); }
  );

  mkShortcut([["p"]],
    // eslint-disable-next-line solid/reactivity
    () => { if(props.active) document.querySelector("a[id='print']")?.click(); }
  );

  mkShortcut([["s"]],
    // eslint-disable-next-line solid/reactivity
    () => { if(props.active) document.querySelector("a[id='security']")?.click(); }
  );

  mkShortcut([["w"]],
    // eslint-disable-next-line solid/reactivity
    () => { if(props.active) window.open(apiURL(`api/raw_message/${encodeURIComponent(msg.notmuch_id)}`), getSetting("openInTab")); }
  );

  mkShortcut([["t"]],
    // eslint-disable-next-line solid/reactivity
    () => { if(props.active) document.getElementById("editTags").querySelector("input")?.focus(); },
    true
  );

  mkShortcut([["c"]],
    // eslint-disable-next-line solid/reactivity
    () => { if(props.active) document.querySelector("button.toggle-content")?.click(); }
  );

  mkShortcut([["u"]],
    // eslint-disable-next-line solid/reactivity
    () => { if(props.active) document.querySelector("a[id='unread']")?.click(); },
    true
  );

  mkShortcut([["Delete"]],
    // eslint-disable-next-line solid/reactivity
    () => { if(props.active) document.querySelector("a[id='delete']")?.click(); },
    true
  );

  mkShortcut([["Shift", "?"]],
    // eslint-disable-next-line solid/reactivity
    () => { if(props.active) window.open(`/?query=from:"${encodeURIComponent(msg.from)}"`, getSetting("openInTab")); }
  );

  return (
    // eslint-disable-next-line solid/reactivity
    <div onClick={props.onClick}
      classList={{
        'message': true,
        'paper': true,
        'margin': true,
        'active': props.active,
        'deleted': msg.tags.includes("deleted")
      }}
      ref={elementTop}>
      <Show when={props.active}>
        <div>
          <Show when={msg.from}><HeaderLine left="From:" right={formatAddrs(msg.from)}/></Show>
          <Show when={msg.reply_to}><HeaderLine left="Reply-To:" right={formatAddrs(msg.reply_to)}/></Show>
          <Show when={msg.to && msg.to.length > 0}><HeaderLine left="To:" right={formatAddrs(msg.to)}/></Show>
          <Show when={msg.forwarded_to}><HeaderLine left="Forwarded-To:" right={formatAddrs(msg.forwarded_to)}/></Show>
          <Show when={msg.cc && msg.cc.length > 0}><HeaderLine left="CC:" right={formatAddrs(msg.cc)}/></Show>
          <Show when={msg.bcc && msg.bcc.length > 0}><HeaderLine left="BCC:" right={formatAddrs(msg.bcc)}/></Show>
          <HeaderLine left="Date:" right={formatDateTZ(msg.date)}/>
          <HeaderLine left="Subject:" right={msg.subject}/>
        </div>

        <Show when={!props.print}>
          <div class="centered horizontal-stack">
            <TagComplete
              id="editTags"
              tags={tags()}
              sp={props.sp}
              addTag={(tagToAdd) => {
                changeTags(tagToAdd);
              }}
              removeTag={(tagToRemove) => {
                changeTags('-' + tagToRemove);
              }}
            />
            <div class="message-action-icons">
              <a id="reply" href={replyUrl(msg.notmuch_id)} target={getSetting("openInTab")} rel="noreferrer">
                <Icon icon={ReplyAll}/>
              </a>
              <a id="forward" href={fwdUrl(msg.notmuch_id)} target={getSetting("openInTab")} rel="noreferrer">
                <Icon icon={Forward}/>
              </a>
              <a id="print" href={printUrl(msg.notmuch_id)} target={getSetting("openInTab")} rel="noreferrer">
                <Icon icon={Print}/>
              </a>
              <a id="security" href={secUrl(msg.notmuch_id)} target={getSetting("openInTab")} rel="noreferrer">
                <Icon icon={Security}/>
              </a>
              <a id="unread" href="#" onClick={() => { if(props.active) { changeTags("unread"); }}}>
                <Icon icon={MarkUnread}/>
              </a>
              <a id="delete" href="#" onClick={() => { if(props.active) { changeTags("-unread deleted"); }}}>
                <Icon icon={Trash}/>
              </a>
            </div>
          </div>

          <Show when={msg.attachments}>
            <div class="attachments" style={{ '--num-attachments': `${msg.attachments.length}` }}>
              <For each={msg.attachments}>
                {(attachment, index) =>
                  <div>
                    {handleAttachment(msg, attachment, index(), false)}
                  </div>
                }
              </For>
            </div>
          </Show>

          <Show when={msg.signature}>
            <Alert severity={sigSev}>{sigMsg}</Alert>
          </Show>
        </Show>

        <div class="horizontal-stack margin justify-end">
          <Show when={msg.body["text/html"] === true}>
            <button class="toggle-content" data-testid={html() ? "Text" : "HTML"} onClick={async (e) => {
                setHtml(!html());
                e.stopPropagation();
                if(html() && htmlContent() === undefined) {
                  setHtmlContent("loading...");
                  props.sp?.(0);
                  const response = await fetch(apiURL(`api/message_html/${encodeURIComponent(msg.notmuch_id)}`));
                  props.sp?.(1);
                  if(!response.ok) {
                    setHtmlContent(`Error retrieving HTML content (${response.status}): ${response.statusText}`);
                  } else {
                    setHtmlContent(await response.text());
                  }
                }
              }}>{html() ? "Text" : "HTML"}</button>
          </Show>
        </div>
        <Show when={html()}>
          <ShadowRoot html={htmlContent()}/>
        </Show>
        <Show when={!html()}>
          <div class="message-text"
            // eslint-disable-next-line solid/no-innerhtml
            innerHTML={linkifyUrlsToHtml(angles(mainPart), linkifyOpts)}/>
          <Show when={quotedPart}>
            <div classList={{
                'message-text': true,
                'preview-container': true,
                'text-preview': !showQuoted()
              }}
              onClick={(e) => {
                // do not toggle expand if we're clicking on a link or marking text for copying
                if(e.target.tagName.toLowerCase() !== 'a' && window.getSelection().toString().length === 0) {
                  setShowQuoted(!showQuoted());
                  e.stopPropagation();
                }
              }}
              // eslint-disable-next-line solid/no-innerhtml
              innerHTML={linkifyUrlsToHtml(angles(quotedPart), linkifyOpts)}/>
          </Show>
        </Show>
      </Show>

      <Show when={!props.active}>
        <div class="vertical-stack">
          <div class="horizontal-stack space-between">
            <div>{formatAddrs(msg.from)}</div>
            <div class="attachments" style={{ '--num-attachments': `${msg.attachments.length}` }}>
              <For each={msg.attachments}>
                {(attachment, index) => {
                  if(attachment.filename !== "smime.p7s") {
                    return(<div class="text-preview">
                      {handleAttachment(msg, attachment, index(), true)}
                    </div>);
                  }
                }}
              </For>
            </div>
            <div>{formatDate(new Date(msg.date))}</div>
          </div>
          <div classList={{
              'message-text': true,
              'text-preview': true
            }}
            // eslint-disable-next-line solid/no-innerhtml
            innerHTML={linkifyUrlsToHtml(angles(mainPart), linkifyOpts)}/>
        </div>
      </Show>
    </div>
  );
}

export function FetchedMessage() {
  const searchParams = window.location.search,
        urlSearchParams = new URLSearchParams(searchParams),
        print = urlSearchParams.get("print");

  return (
    <>
      <Message msg={data.message} active={true} print={print}/>
    </>
  );
}

// vim: tabstop=2 shiftwidth=2 expandtab
