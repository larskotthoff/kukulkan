import { createEffect, createSignal, For, onMount, Show } from "solid-js";

import Grid from "@suid/material/Grid";
import Stack from "@suid/material/Stack";

import AttachFile from "@suid/icons-material/AttachFile";
import Cancel from "@suid/icons-material/Cancel";
import CheckCircle from "@suid/icons-material/CheckCircle";
import Forward from "@suid/icons-material/Forward";
import Help from "@suid/icons-material/Help";
import Print from "@suid/icons-material/Print";
import Reply from "@suid/icons-material/Reply";
import Security from "@suid/icons-material/Security";

import { getSetting } from "./Settings.jsx";

import { linkifyUrlsToHtml } from "linkify-urls";
const linkifyOpts = { attributes: { target: getSetting("openInTab"), rel: "nofollow" } };

import { Alert } from "./Alert.jsx";
import { ColorChip } from "./ColorChip.jsx";
import { TagComplete } from "./Autocomplete.jsx";

import "./Kukulkan.css";
import { apiURL, formatDate, formatFSz, strip } from "./utils.js";
import { mkShortcut } from "./UiUtils.jsx";

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
  return addrs.map((addr) => (
    <ColorChip value={addr}/>
  ));
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
    return (<Grid container direction="row" justifyContent="space-around" m={1}>
      <a href={calUrl(msg.notmuch_id, 'accept', index)} target={getSetting("openInTab")} rel="noreferrer">
        <CheckCircle fontSize="large"/>
      </a>
      <a href={calUrl(msg.notmuch_id, 'decline', index)} target={getSetting("openInTab")} rel="noreferrer">
        <Cancel fontSize="large"/>
      </a>
      <a href={calUrl(msg.notmuch_id, 'tentative', index)} target={getSetting("openInTab")} rel="noreferrer">
        <Help fontSize="large"/>
      </a>
      </Grid>);
  } else if(attachment.preview.status === "ACCEPTED") {
      return (<CheckCircle fontSize="large" style={{ margin: "8px" }}/>);
  } else if(attachment.preview.status === "DECLINED") {
      return (<Cancel fontSize="large" style={{ margin: "8px" }}/>);
  } else if(attachment.preview.status === "TENTATIVE") {
      return (<Help fontSize="large" style={{ margin: "8px" }}/>);
  }
}

function handleAttachment(msg, attachment, index, summary) {
  if(attachment.content_type.includes("image")) {
    let mw = summary ? "3em" : "30em",
        mh = summary ? "2em" : "20em";
    return (<a href={apiURL(`api/attachment/${encodeURIComponent(msg.notmuch_id)}/${index}`)} target={getSetting("openInTab")} rel="noreferrer">
        <img src={apiURL(`api/attachment/${encodeURIComponent(msg.notmuch_id)}/${index}`)} alt={attachment.filename} style={{ 'max-width': mw, 'max-height': mh }}/>
      </a>);
  } else if(attachment.content_type.includes("calendar") && attachment.preview !== null && summary === false) {
    return (<div style={{ 'text-align': "center"}}><a href={apiURL(`api/attachment/${encodeURIComponent(msg.notmuch_id)}/${index}`)} target={getSetting("openInTab")} rel="noreferrer">
        <AttachFile/>{attachment.filename}
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
            attachment.preview.start + " — " + attachment.preview.end + "\n" +
            attachment.preview.attendees + "\n" + attachment.preview.recur }
        </div>
      </a>
      { calendarAction(msg, attachment, index) }
      </div>);
  } else if(attachment.content_type.includes("message/rfc822")) {
    return (<a href={`/message?id=${encodeURIComponent(msg.notmuch_id)}&attachNum=${index}`} target={getSetting("openInTab")} rel="noreferrer"><AttachFile/>{attachment.filename}
      {summary ? "" : " (" + formatFSz(attachment.content_size) + ", " + attachment.content_type + ")"}
      </a>);
  } else {
    return (<a href={apiURL(`api/attachment/${encodeURIComponent(msg.notmuch_id)}/${index}`)} target={getSetting("openInTab")} rel="noreferrer"><AttachFile/>{attachment.filename}
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

      createEffect(() => {
        contentDiv.innerHTML = props.html;
      });
    }
  });

  return <div ref={containerRef}/>;
}

function HeaderLine(props) {
  return (
    <Stack direction="row" spacing={.5}><span>{props.left}</span><span>{props.right}</span></Stack>
  );
}

export function Message(props) {
  const [showQuoted, setShowQuoted] = createSignal(false),
        [html, setHtml] = createSignal(false),
        // eslint-disable-next-line solid/reactivity
        msg = props.msg,
        [tags, setTags] = createSignal(msg.tags.sort()),
        {mainPart, quotedPart} = separateQuotedNonQuoted(msg.body["text/plain"]);
  let elementTop;

  async function removeTag(tag) {
    props.sp?.(0);
    const response = await fetch(apiURL(`api/tag/remove/message/${encodeURIComponent(msg.notmuch_id)}/${encodeURIComponent(tag)}`));
    props.sp?.(100);
    if(!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
    setTags(tags().filter((t) => t !== tag));
    msg.tags = tags();
  }

  async function addTag(tag) {
    props.sp?.(0);
    const response = await fetch(apiURL(`api/tag/add/message/${encodeURIComponent(msg.notmuch_id)}/${encodeURIComponent(tag)}`));
    props.sp?.(100);
    if(!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
    const tmp = tags().concat(tag);
    setTags(tmp.sort());
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

  const saw = 6 / msg.attachments.length;

  createEffect(() => {
    if(props.active) {
      elementTop?.scrollIntoView({block: "nearest"});
      document.title = msg.subject || "Kukulkan";
      if(msg.tags.includes("unread")) setTimeout(() => removeTag("unread"), 500);
    }
  });

  createEffect(() => {
    props.sp?.(100 * (1 - msg.loading));
  });

  mkShortcut(["r"],
    // eslint-disable-next-line solid/reactivity
    () => { if(props.active) document.querySelector("a[id='reply']")?.click(); }
  );

  mkShortcut(["Shift", "r"],
    // eslint-disable-next-line solid/reactivity
    () => { if(props.active) window.open(replyUrl(msg.notmuch_id, "one"), getSetting("openInTab")); }
  );

  mkShortcut(["f"],
    // eslint-disable-next-line solid/reactivity
    () => { if(props.active) document.querySelector("a[id='forward']")?.click(); }
  );

  mkShortcut(["p"],
    // eslint-disable-next-line solid/reactivity
    () => { if(props.active) document.querySelector("a[id='print']")?.click(); }
  );

  mkShortcut(["s"],
    // eslint-disable-next-line solid/reactivity
    () => { if(props.active) document.querySelector("a[id='security']")?.click(); }
  );

  mkShortcut(["w"],
    // eslint-disable-next-line solid/reactivity
    () => { if(props.active) window.open(apiURL(`api/raw_message/${encodeURIComponent(msg.notmuch_id)}`), getSetting("openInTab")); }
  );

  mkShortcut(["t"],
    // eslint-disable-next-line solid/reactivity
    () => { if(props.active) document.getElementById("editTags")?.focus(); },
    true
  );

  mkShortcut(["c"],
    // eslint-disable-next-line solid/reactivity
    () => { if(props.active) document.querySelector("button.content")?.click(); }
  );

  mkShortcut(["Delete"],
    // eslint-disable-next-line solid/reactivity
    () => {
      if(props.active) {
        removeTag("unread");
        addTag("deleted");
      }
    },
    true
  );

  mkShortcut(["Shift", "?"],
    // eslint-disable-next-line solid/reactivity
    () => { if(props.active) window.open(`/?query=from:"${encodeURIComponent(msg.from)}"`, getSetting("openInTab")); }
  );

  return (
    // eslint-disable-next-line solid/reactivity
    <div onClick={props.onClick}
      classList={{
        'message': true,
        'paper': true,
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
          <Grid container justifyContent="space-between" direction="row" style={{ 'min-height': "3.5em" }} class="centered">
            <Grid item xs>
              <TagComplete
                id="editTags"
                tags={tags()}
                addTag={(tagToAdd) => {
                  addTag(tagToAdd);
                }}
                removeTag={(tagToRemove) => {
                  removeTag(tagToRemove);
                }}
              />
            </Grid>
            <Grid item>
              <a id="reply" href={replyUrl(msg.notmuch_id)} target={getSetting("openInTab")} rel="noreferrer">
                <Reply/>
              </a>
            </Grid>
            <Grid item>
              <a id="forward" href={fwdUrl(msg.notmuch_id)} target={getSetting("openInTab")} rel="noreferrer">
                <Forward/>
              </a>
            </Grid>
            <Grid item>
              <a id="print" href={printUrl(msg.notmuch_id)} target={getSetting("openInTab")} rel="noreferrer">
                <Print/>
              </a>
            </Grid>
            <Grid item>
              <a id="security" href={secUrl(msg.notmuch_id)} target={getSetting("openInTab")} rel="noreferrer">
                <Security/>
              </a>
            </Grid>
          </Grid>

          <Show when={msg.attachments}>
            <Grid container spacing={1}>
              <For each={msg.attachments}>
                {(attachment, index) =>
                  <Grid item xs={4} style={{ 'min-height': "3em" }}>
                    {handleAttachment(msg, attachment, index(), false)}
                  </Grid>
                }
              </For>
            </Grid>
          </Show>

          <Show when={msg.signature}>
            <Alert severity={sigSev}>{sigMsg}</Alert>
          </Show>
        </Show>

        <Grid container justifyContent="flex-end" class="margin">
          <Show when={msg.body["text/html"]}>
            <button class="content" data-testid={html() ? "Text" : "HTML"} onClick={(e) => {
                setHtml(!html());
                e.stopPropagation();
              }}>{html() ? "Text" : "HTML"}</button>
          </Show>
        </Grid>
        <Show when={html()}>
          <ShadowRoot html={msg.body["text/html"]}/>
        </Show>
        <Show when={!html()}>
          <div class="message-text"
            // eslint-disable-next-line solid/no-innerhtml
            innerHTML={linkifyUrlsToHtml(mainPart, linkifyOpts)}/>
          <Show when={quotedPart}>
            <div classList={{
                'message-text': true,
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
              innerHTML={linkifyUrlsToHtml(quotedPart, linkifyOpts)}/>
          </Show>
        </Show>
      </Show>

      <Show when={!props.active}>
        <Grid container direction="column">
          <Grid container direction="row" justifyContent="space-between" wrap="nowrap">
            <Grid item>{formatAddrs(msg.from)}</Grid>
            <For each={msg.attachments}>
              {(attachment, index) => {
                if(attachment.filename !== "smime.p7s") {
                  return(<Grid item xs={saw} class="text-preview">
                    {handleAttachment(msg, attachment, index(), true)}
                  </Grid>);
                }
              }}
            </For>
            <Grid item>{formatDate(new Date(msg.date))}</Grid>
          </Grid>
          <div classList={{
              'message-text': true,
              'text-preview': true
            }}
            // eslint-disable-next-line solid/no-innerhtml
            innerHTML={linkifyUrlsToHtml(mainPart, linkifyOpts)}/>
        </Grid>
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
      { /* eslint-disable-next-line no-undef */ }
      <Message msg={data.message} active={true} print={print}/>
    </>
  );
}

// vim: tabstop=2 shiftwidth=2 expandtab
