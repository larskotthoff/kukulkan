import { createEffect, createSignal, createResource, For, mergeProps, onMount, Show } from "solid-js";

import { Alert, Box, Button, Divider, Grid, LinearProgress, Modal, Paper, Stack } from "@suid/material";
import { Autocomplete } from "./Autocomplete.jsx";
import { ColorChip } from "./ColorChip.jsx";

import AttachFile from "@suid/icons-material/AttachFile";
import Cancel from "@suid/icons-material/Cancel";
import CheckCircle from "@suid/icons-material/CheckCircle";
import Forward from "@suid/icons-material/Forward";
import Help from "@suid/icons-material/Help";
import Print from "@suid/icons-material/Print";
import Reply from "@suid/icons-material/Reply";
import Security from "@suid/icons-material/Security";

import linkifyStr from 'linkify-string';
const linkifyOpts = { target: "_blank", rel: "nofollow" };

import "./Kukulkan.css";
import { apiURL, fetchAllTags, formatFSz, strip, formatDate } from "./utils.js";

async function fetchMessage(id) {
  if(id === null) return null;
  const response = await fetch(apiURL(`api/message/${id}`));
  if(!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
  return await response.json();
}

const separateQuotedNonQuoted = (text) => {
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

const formatDateTZ = (date) => {
  let ret = date;
  if((new Date()).getTimezoneOffset() !== (date.substring(date.length - 5, date.length - 4) === "+" ? -1 : 1) * (parseInt(date.substring(date.length - 4, date.length - 2)) * 60 + parseInt(date.substring(date.length - 2))))
    ret += ` (${(new Date(date)).toLocaleString()})`;
  return ret;
}

const formatAddrs = (addrs) => {
  // split on , preceded by > or by email address
  return addrs.split(/(?<=>),\s*|(?<=@[^, ]+),\s*/).map((addr) => (
    <ColorChip value={addr}/>
  ));
};

const calUrl = (id, action, index) => {
  return apiURL(`/write?action=reply-cal-${action}&id=${id}&index=${index}`);
};

const calendarAction = (msg, attachment, index) => {
  if(attachment.preview.method === "REQUEST" && attachment.preview.status === "NEEDS-ACTION") {
    return(<Grid container direction="row" justifyContent="space-around" m={1}>
      <a href={calUrl(msg.notmuch_id, 'accept', index)} target="_blank" rel="noreferrer">
        <CheckCircle fontSize="large"/>
      </a>
      <a href={calUrl(msg.notmuch_id, 'decline', index)} target="_blank" rel="noreferrer">
        <Cancel fontSize="large"/>
      </a>
      <a href={calUrl(msg.notmuch_id, 'tentative', index)} target="_blank" rel="noreferrer">
        <Help fontSize="large"/>
      </a>
      </Grid>)
  } else if(attachment.preview.status === "ACCEPTED") {
      return(<CheckCircle fontSize="large" style={{ margin: 8 }}/>)
  } else if(attachment.preview.status === "DECLINED") {
      return(<Cancel fontSize="large" style={{ margin: 8 }}/>)
  } else if(attachment.preview.status === "TENTATIVE") {
      return(<Help fontSize="large" style={{ margin: 8 }}/>)
  }
};

const handleAttachment = (msg, attachment, index, summary) => {
  if(attachment.content_type.includes("image")) {
    let mw = summary ? "3em" : "30em",
        mh = summary ? "2em" : "20em";
    return (<a href={apiURL(`api/attachment/${msg.notmuch_id}/${index}`)} target="_blank" rel="noreferrer">
        <img src={apiURL(`api/attachment/${msg.notmuch_id}/${index}`)} alt={attachment.filename} style={{ maxWidth: mw, maxHeight: mh }}/>
      </a>);
  } else if(attachment.content_type.includes("calendar") && attachment.preview !== null && summary === false) {
    return (<div><a href={apiURL(`api/attachment/${msg.notmuch_id}/${index}`)} target="_blank" rel="noreferrer">
        <AttachFile/>{attachment.filename}
        {" (" + formatFSz(attachment.content_size) + ", " + attachment.content_type + ")"}
      </a>
      <a target="_blank" rel="noreferrer"
        href={"https://www.google.com/calendar/render?action=TEMPLATE&text=" +
          encodeURIComponent(attachment.preview.summary) +
          "&dates=" + encodeURIComponent(attachment.preview.dtstart) +
          "/" + encodeURIComponent(attachment.preview.dtend) +
          "&location=" + encodeURIComponent(attachment.preview.location) +
          "&ctz=" + encodeURIComponent(attachment.preview.tz) +
          (attachment.preview.rrule !== null ? ("&recur=RRULE:" + encodeURIComponent(attachment.preview.rrule)) : "") +
          "&sf=true&output=xml"}>
        { attachment.preview.summary + " (" + attachment.preview.location + ")\n" +
          attachment.preview.start + " — " + attachment.preview.end + "\n" +
          attachment.preview.attendees + "\n" + attachment.preview.recur }
      </a>
      { calendarAction(msg, attachment, index) }
      </div>);
  } else {
    return (<a href={apiURL(`api/attachment/${msg.notmuch_id}/${index}`)} target="_blank" rel="noreferrer"><AttachFile/>{attachment.filename}
      {summary ? "" : " (" + formatFSz(attachment.content_size) + ", " + attachment.content_type + ")"}
      </a>);
  }
};

// claude helped with this
const ShadowRoot = (props) => {
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
};

const HeaderLine = ({left, right}) => {
  return(
    <Stack direction="row" spacing={.5}><span>{left}</span><span>{right}</span></Stack>
  );
};

export const Message = (passedProps) => {
  const props = mergeProps({ open: true }, passedProps),
        [showQuoted, setShowQuoted] = createSignal(false),
        [html, setHtml] = createSignal(false),
        [open, setOpen] = createSignal(props.open),
        msg = props.msg,
        {mainPart, quotedPart} = separateQuotedNonQuoted(msg.body["text/plain"]);
  let elementTop;

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
      sigMsg += ` (${props.msg.signature.message})`;
    }
  }
  sigMsg += ".";

  const saw = 6 / msg.attachments.length;

  return (
    <Paper elevation={props.active ? 20 : 3}
      class={{
        'kukulkan-message': true,
        'active': props.active
      }}
      ref={elementTop}>
      <Show when={open()}>
        <Box onClick={(e) => {
            // do not toggle open if we're clicking on a link or marking text for copying
            if(e.target.tagName.toLowerCase() !== 'a' && window.getSelection().toString().length === 0) {
              setOpen(false);
            }
          }}>
          <Show when={msg.from}><HeaderLine left="From:" right={formatAddrs(msg.from)}/></Show>
          <Show when={msg.reply_to}><HeaderLine left="Reply-To:" right={formatAddrs(msg.reply_to)}/></Show>
          <Show when={msg.to}><HeaderLine left="To:" right={formatAddrs(msg.to)}/></Show>
          <Show when={msg.forwarded_to}><HeaderLine left="Forwarded-To:" right={formatAddrs(msg.forwarded_to)}/></Show>
          <Show when={msg.cc}><HeaderLine left="CC:" right={formatAddrs(msg.cc)}/></Show>
          <Show when={msg.bcc}><HeaderLine left="BCC:" right={formatAddrs(msg.bcc)}/></Show>
          <HeaderLine left="Date:" right={formatDateTZ(msg.date)}/>
          <HeaderLine left="Subject:" right={msg.subject}/>
        </Box>

        <Show when={!props.print}>
          <Grid container justifyContent="space-between" direction="row" style={{ minHeight: "3.5em" }}>
            <Grid item xs={11}>
              <For each={msg.tags.sort()}>
                {(tag) => <ColorChip value={tag}/>}
              </For>
            </Grid>
            <Grid item key="reply">
              <a href={apiURL(`api/write?action=reply&mode=all&id=${msg.notmuch_id}`)} target="_blank" rel="noreferrer">
                <Reply/>
              </a>
            </Grid>
            <Grid item key="forward">
              <a href={apiURL(`api/write?action=forward&id=${msg.notmuch_id}`)} target="_blank" rel="noreferrer">
                <Forward/>
              </a>
            </Grid>
            <Grid item key="print">
              <a href={apiURL(`api/message?id=${msg.notmuch_id}`)} target="_blank" rel="noreferrer">
                <Print/>
              </a>
            </Grid>
            <Grid item key="security">
              <a href={apiURL(`api/auth_message/${msg.notmuch_id}`)} target="_blank" rel="noreferrer">
                <Security/>
              </a>
            </Grid>
          </Grid>

          <Show when={msg.attachments}>
            <Grid container spacing={1}>
              { msg.attachments.map((attachment, index2) => (
                  <Grid item class="center" xs={4} key={index2} style={{ minHeight: "3em" }}>
                    {handleAttachment(msg, attachment, index2, false)}
                  </Grid>
              )) }
            </Grid>
          </Show>

          <Show when={msg.signature}>
            <Alert width="100%" severity={sigSev}>{sigMsg}</Alert>
          </Show>
        </Show>

        <Divider class="margin"/>

        <Grid container justifyContent="flex-end">
          <Show when={msg.body["text/html"]}>
            <Button variant="outlined" class="kukulkan-content" onClick={() => setHtml(!html())}>{html() ? "Text" : "HTML"}</Button>
          </Show>
        </Grid>
        <Show when={html()}>
          <ShadowRoot html={msg.body["text/html"]}/>
        </Show>
        <Show when={!html()}>
          <Box class="message-text" innerHTML={linkifyStr(mainPart, linkifyOpts)}/>
          <Show when={quotedPart}>
            <Box class={{
                'message-text': true,
                'text-preview': !showQuoted()
              }}
              onClick={(e) => {
                // do not toggle expand if we're clicking on a link or marking text for copying
                if(e.target.tagName.toLowerCase() !== 'a' && window.getSelection().toString().length === 0) {
                  setShowQuoted(!showQuoted());
                }
              }}
              innerHTML={linkifyStr(quotedPart, linkifyOpts)}/>
          </Show>
        </Show>
      </Show>

      <Show when={!open()}>
        <Grid container direction="column" onClick={(e) => {
            // do not toggle open if we're clicking on a link or marking text for copying
            if(e.target.tagName.toLowerCase() !== 'a' && window.getSelection().toString().length === 0) {
              setOpen(true);
            }
          }}>
          <Grid container direction="row" justifyContent="space-between" wrap="nowrap">
            <Grid item>{formatAddrs(msg.from)}</Grid>
            {msg.attachments.filter((a) => a.filename !== "smime.p7s").map((attachment, index2) => (
              <Grid item key={index2} xs={saw} style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {handleAttachment(msg, attachment, index2, true)}
              </Grid>
            ))}
            <Grid item>{formatDate(new Date(msg.date))}</Grid>
          </Grid>
          <Box class={{
              'message-text': true,
              'text-preview': true
            }}
            onClick={(e) => {
              // do not toggle expand if we're clicking on a link or marking
              // text for copying
              if(e.target.tagName.toLowerCase() !== 'a' && window.getSelection().toString().length === 0) {
                setShowQuoted(!showQuoted());
              }
            }}
            innerHTML={linkifyStr(mainPart, linkifyOpts)}/>
        </Grid>
      </Show>
    </Paper>
  );
};

export const SingleMessage = () => {
  const [searchParams] = createSignal(window.location.search),
        [messageId] = createSignal((new URLSearchParams(searchParams())).get("id")),
        [message] = createResource(messageId, fetchMessage),
        [allTags] = createResource(fetchAllTags);

  createEffect(() => {
    message();
    document.title = message()?.subject || "Kukulkan";
  });

  return (
    <>
      <Show when={allTags.state === "ready" && message.state === "ready"} fallback={<LinearProgress/>}>
        <Message msg={message()} allTags={allTags()} active={true} open={true}/>
      </Show>
    </>
  );
};

// vim: tabstop=2 shiftwidth=2 expandtab