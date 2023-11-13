import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";

import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import { ThemeProvider } from '@mui/material/styles';

import Collapse from '@mui/material/Collapse';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';

import AttachFile from '@mui/icons-material/AttachFile';
import Print from '@mui/icons-material/Print';
import Security from '@mui/icons-material/Security';
import Reply from '@mui/icons-material/Reply';
import Forward from '@mui/icons-material/Forward';

import { TagBar } from "./tags.jsx";

import invert from 'invert-color';
import { strip, getColor, apiURL, formatDate, formatFSz, theme } from "./utils.js";

import linkifyStr from 'linkify-string';

const linkifyOpts = { target: "_blank", rel: "nofollow" }

const timeout = 200;

class ShadowRoot extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  attachShadow = e => {
    if(e) {
      const shadowRoot = e.attachShadow({ mode: "open" });
      shadowRoot.appendChild(document.createElement("span"));
      this.setState({ shadowRoot });
    }
  };

  render() {
    const { attachShadow, props, state } = this;
    return (
      <div {...props} ref={attachShadow}>
      {state.shadowRoot ? (
        createPortal(props.children, state.shadowRoot.firstChild)
      ) : null}
      </div>
    );
  }
}

class MessageText extends React.Component {
  constructor(props) {
    super(props);
    this.state = { expanded: false };
    this.handleCollapse = this.handleCollapse.bind(this);
  }

  handleCollapse() {
    if(document.drag === false) {
      this.setState(prevState => ({
        expanded: !prevState.expanded
      }));
    }
  }

  render() {
    return (
      <React.Fragment>
        <Box style={{ whiteSpace: "pre-line" }} dangerouslySetInnerHTML={{ __html: linkifyStr(this.props.mainPart, linkifyOpts) }} />
        { this.props.quotedPart &&
          <Box onClick={this.handleCollapse}>
            <Collapse key={ this.props.id + "_quoted_collapsed" } in={!this.state.expanded} timeout={timeout} unmountOnExit>
              <Grid container justifyContent="space-between">
                <Grid item xs><Box style={{ overflow: "hidden", height: "3em" }} dangerouslySetInnerHTML={{ __html: this.props.quotedPart }} /></Grid>
                <Grid item><ExpandMore/></Grid>
              </Grid>
            </Collapse>
            <Collapse key={ this.props.id + "_quoted_expanded" } in={this.state.expanded} timeout={timeout} unmountOnExit>
              <Grid container justifyContent="space-between">
                <Grid item xs><Box style={{ whiteSpace: "pre-line" }} dangerouslySetInnerHTML={{ __html: linkifyStr(this.props.quotedPart, linkifyOpts) }} /></Grid>
                <Grid item><ExpandLess/></Grid>
              </Grid>
            </Collapse>
          </Box>
        }
      </React.Fragment>
    )
  }
}

function printUrl(id) {
  return '/message?id=' + encodeURIComponent(id);
}

function replyUrl(id) {
  return '/write?action=reply&id=' + encodeURIComponent(id);
}

function fwdUrl(id) {
  return '/write?action=forward&id=' + encodeURIComponent(id);
}

function secUrl(id) {
  return apiURL("api/auth_message/" + encodeURIComponent(id));
}

export class Message extends React.Component {
  constructor(props) {
    super(props);
    this.state = { expanded: this.props.open, html: false, lines: 2 };
    this.handleCollapse = this.handleCollapse.bind(this);
    this.handleHtml = this.handleHtml.bind(this);
    this.handleAttachment = this.handleAttachment.bind(this);
    this.formatAddrs = this.formatAddrs.bind(this);

    this.prevActive = this.props.active;

    this.elementTop = React.createRef();

    // separate into non-quoted and quoted text
    let lines = props.msg.body["text/plain"].split('\n');
    let lastLine = lines.length;
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

    this.mainPart = lines.slice(0, lastLine).join('\n');
    if(lastLine !== lines.length) {
      this.quotedPart = lines.slice(lastLine).join('\n');
    }

    this.sigMsg = "";
    this.sigSev = "warning";

    if(this.props.msg.signature) {
      if(this.props.msg.signature.valid) {
        this.sigMsg += "Signature verified";
        this.sigSev = "success";
      } else if(this.props.msg.signature.valid === null) {
        this.sigMsg += "Signature could not be verified";
      } else {
        this.sigMsg += "Signature verification failed";
        this.sigSev = "error";
      }
      if(this.props.msg.signature.message) {
        this.sigMsg += " (" + this.props.msg.signature.message + ")";
      }
    }
    this.sigMsg += ".";

    document.drag = false;
    document.addEventListener('mousedown', () => document.drag = false);
    document.addEventListener('mousemove', () => document.drag = true);
  }

  componentDidMount() {
    this.elementTop.current.addEventListener("toggleContent", this.handleHtml);
    this.elementTop.current.addEventListener("toggleCollapse", this.handleCollapse);
    this.elementTop.current.addEventListener("print", () => {
      window.open(printUrl(this.props.msg.notmuch_id), '_blank');
    });
    this.elementTop.current.addEventListener("reply", () => {
      window.open(replyUrl(this.props.msg.notmuch_id), '_blank');
    });
    this.elementTop.current.addEventListener("forward", () => {
      window.open(fwdUrl(this.props.msg.notmuch_id), '_blank');
    });
    this.elementTop.current.addEventListener("security", () => {
      window.open(secUrl(this.props.msg.notmuch_id), '_blank');
    });
    this.elementTop.current.addEventListener("raw", () => {
      window.open(apiURL("api/raw_message/" + encodeURIComponent(this.props.msg.notmuch_id)), '_blank');
    });

    if(this.props.active) {
      this.elementTop.current.scrollIntoView({block: "nearest"});
    }

    if(this.state.expanded && this.props.msg.tags.includes("unread")) {
      setTimeout(() =>
        this.elementTop.current.getElementsByClassName("MuiAutocomplete-root")[0].dispatchEvent(new CustomEvent('read')),
      1000);
    }
  }

  componentDidUpdate() {
    if(!this.prevActive && this.props.active) {
      if(!this.state.expanded) {
        this.setState(prevState => ({
          expanded: true,
          html: prevState.html,
          lines: prevState.lines
        }));
      } else {
        this.elementTop.current.scrollIntoView({block: "nearest"});
      }
    }
    this.prevActive = this.props.active;

    if(this.state.expanded && this.props.msg.tags.includes("unread")) {
      setTimeout(() =>
        this.elementTop.current.getElementsByClassName("MuiAutocomplete-root")[0].dispatchEvent(new CustomEvent('read')),
      500);
    }
  }

  handleCollapse(e) {
    if(document.drag === false && e !== null && e.target.tagName !== "A") {
      this.setState(prevState => ({
        expanded: !prevState.expanded,
        html: prevState.html,
        lines: prevState.lines
      }), () => {
        if(this.state.expanded) {
          if(this.props.setActiveMsg) {
            // not available in print view
            this.props.setActiveMsg(this.props.index);
          }
        }
      });
    }
  }

  handleHtml() {
    this.setState(prevState => ({
      expanded: prevState.expanded,
      html: !prevState.html,
      lines: prevState.lines
    }));
  }

  handleAttachment(msg, attachment, index, summary) {
    if(attachment.content_type.includes("image")) {
      let mw = summary ? "3em" : "30em",
          mh = summary ? "2em" : "20em";
      return (<a href={apiURL("api/attachment/" + encodeURIComponent(this.props.msg.notmuch_id) + "/" + index)} target="_blank" rel="noreferrer">
          <img src={apiURL("api/attachment/" + encodeURIComponent(msg.notmuch_id) + "/" + index)} alt={attachment.filename} style={{ maxWidth: mw, maxHeight: mh }}/>
        </a>);
    } else if(attachment.content_type.includes("calendar") && attachment.preview !== null && summary === false) {
      return (<div><a href={apiURL("api/attachment/" + encodeURIComponent(this.props.msg.notmuch_id) + "/" + index)} target="_blank" rel="noreferrer">
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
          <Paper elevation={3} style={{ padding: ".5em", whiteSpace: "pre-line" }}>
          { attachment.preview.summary + " (" + attachment.preview.location + ")\n" +
            attachment.preview.start + " — " + attachment.preview.end + "\n" +
            attachment.preview.attendees + "\n" + attachment.preview.recur }
          </Paper>
        </a></div>);
    } else {
      return (<a href={apiURL("api/attachment/" + encodeURIComponent(this.props.msg.notmuch_id) + "/" + index)} target="_blank" rel="noreferrer"><AttachFile/>{attachment.filename}
        {summary ? "" : " (" + formatFSz(attachment.content_size) + ", " + attachment.content_type + ")"}
        </a>);
    }
  }

  formatAddrs(addrs) {
    // split on , preceded by > or by email address
    return addrs.split(/(?<=>),\s*|(?<=@[^, ]+),\s*/).map((addr, index) => (
      <span key={index} style={{ backgroundColor: getColor(addr), color: invert(getColor(addr), true), padding: 2, margin: 2, borderRadius: 3 }}>{addr}</span>
    )).reduce((acc, x) => <>{acc}{'​'}{x}</>);
  }

  render() {
    const msg = this.props.msg;

    document.title = msg.subject;

    document.onkeydown = function(evt) {
      evt = evt || window.event;
      let isEscape = false;
      if("key" in evt) isEscape = (evt.key === "Escape" || evt.key === "Esc");
      else isEscape = (evt.keyCode === 27);
      if(isEscape) document.activeElement.blur();
    };

    const saw = 6 / msg.attachments.length;

    return (
      <Paper elevation={this.props.active ? 20 : 3} sx={{ padding: 1, margin: 1, width: "min(80em, 80vw)" }} className={ this.props.active ? "kukulkan-active-thread" : ""} ref={this.elementTop}>
        <Collapse key={msg.notmuch_id + "_collapsed" } in={!this.state.expanded} timeout={timeout} unmountOnExit>
          <Grid container direction="column" onClick={this.handleCollapse}>
            <Grid container direction="row" justifyContent="space-between" wrap="nowrap">
              <Grid item><Typography>{this.formatAddrs(msg.from)}</Typography></Grid>
              { msg.attachments.filter((a) => a.filename !== "smime.p7s").map((attachment, index2) => (
                  <Grid item key={index2} xs={saw} style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      { this.handleAttachment(msg, attachment, index2, true) }
                  </Grid>
              )) }
              <Grid item><Typography>{formatDate(new Date(msg.date))}</Typography></Grid>
            </Grid>
            <Grid container direction="row" justifyContent="space-between" onMouseEnter={() =>
              this.setState(prevState => ({
                expanded: prevState.expanded,
                html: prevState.html,
                lines: 10
              }))
            } onMouseLeave={() =>
              this.setState(prevState => ({
                expanded: prevState.expanded,
                html: prevState.html,
                lines: 2
              }))
            }>
              <Grid item xs><Typography style={{ overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: this.state.lines, WebkitBoxOrient: "vertical" }} dangerouslySetInnerHTML={{ __html: this.mainPart }} /></Grid>
              <Grid item><ExpandMore/></Grid>
            </Grid>
          </Grid>
        </Collapse>

        <Collapse key={msg.notmuch_id + "_expanded" } in={this.state.expanded} timeout={timeout} onEntered={() => this.elementTop.current.scrollIntoView({block: "nearest"})} unmountOnExit>
          <Box onClick={this.handleCollapse}>
            { msg.from && <Typography>From: {this.formatAddrs(msg.from)}</Typography> }
            { msg.reply_to && <Typography>Reply-To: {this.formatAddrs(msg.reply_to)}</Typography> }
            { msg.to && <Typography>To: {this.formatAddrs(msg.to)}</Typography> }
            { msg.cc && <Typography>CC: {this.formatAddrs(msg.cc)}</Typography> }
            { msg.bcc && <Typography>BCC: {this.formatAddrs(msg.bcc)}</Typography> }
            <Typography>Date: {msg.date} {(new Date()).getTimezoneOffset() !== (msg.date.substring(msg.date.length - 5, msg.date.length - 4) === "+" ? -1 : 1) * (parseInt(msg.date.substring(msg.date.length - 4, msg.date.length - 2)) * 60 + parseInt(msg.date.substring(msg.date.length - 2))) && "(" + (new Date(msg.date)).toLocaleString() + ")"}</Typography>
            <Grid container justifyContent="space-between">
              <Grid item xs><Typography>Subject: {msg.subject}</Typography></Grid>
              { this.props.print || <Grid item><ExpandLess/></Grid> }
            </Grid>
          </Box>

          { this.props.print ||
            <React.Fragment>
              <Grid container justifyContent="space-between" direction="row" style={{ minHeight: "3.5em" }}>
                <Grid item xs={11}>
                  <TagBar tagsObject={msg} options={this.props.allTags} id={msg.notmuch_id} type="message"/>
                </Grid>
                <Grid item key="reply">
                  <a href={replyUrl(msg.notmuch_id)} target="_blank" rel="noreferrer">
                    <Reply/>
                  </a>
                </Grid>
                <Grid item key="forward">
                  <a href={fwdUrl(msg.notmuch_id)} target="_blank" rel="noreferrer">
                    <Forward/>
                  </a>
                </Grid>
                <Grid item key="print">
                  <a href={printUrl(msg.notmuch_id)} target="_blank" rel="noreferrer">
                    <Print/>
                  </a>
                </Grid>
                <Grid item key="security">
                  <a href={secUrl(msg.notmuch_id)} target="_blank" rel="noreferrer">
                    <Security/>
                  </a>
                </Grid>
              </Grid>

              <React.Fragment>
                { msg.attachments &&
                  <Grid container spacing={1}>
                    { msg.attachments.map((attachment, index2) => (
                        <Grid item align="center" xs={4} key={index2} style={{ minHeight: "3em" }}>
                          { this.handleAttachment(msg, attachment, index2, false) }
                        </Grid>
                    )) }
                  </Grid>
                }
              </React.Fragment>

              { msg.signature &&
                <Alert width="100%" severity={ this.sigSev } style={{ whiteSpace: "pre-line" }}>
                  { this.sigMsg }
                </Alert>
              }
            </React.Fragment>
          }

          <Divider sx={{ marginTop: 2, marginBottom: 2 }} />

          <Grid container justifyContent="flex-end">
            { msg.body["text/html"] && <Button variant="outlined" className="kukulkan-content" onClick={this.handleHtml}>{this.state.html ? "Text" : "HTML"}</Button> }
          </Grid>
          { this.state.html && msg.body["text/html"] ?
            <ShadowRoot><Box dangerouslySetInnerHTML={{ __html: msg.body["text/html"] }} /></ShadowRoot> :
            <MessageText key={msg.notmuch_id + "_text"} id={msg.notmuch_id} mainPart={this.mainPart} quotedPart={this.quotedPart} /> }
        </Collapse>
      </Paper>
    )
  }
}

export class DeletedMessage extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hidden: true };
    this.handleReplace = this.handleReplace.bind(this);
  }

  handleReplace() {
    this.setState({ hidden: false });
  }

  render() {
    if(this.state.hidden) {
      return (
        <Paper elevation={1} sx={{ padding: 1, margin: 2, maxWidth: "80em" }}>
          <Button onClick={this.handleReplace}>show deleted message</Button>
        </Paper>
      )
    } else {
      return (<Message key={this.key} index={this.props.index} msg={this.props.msg} active={true} open={true} allTags={this.props.allTags} setActiveMsg={this.props.setActiveMsg}/>)
    }
  }
}

export function SingleMessage() {
  const [message, setMessage] = useState(null);

  const error = useRef(null);
  const messageId = useRef(null);

  const [searchParams] = useSearchParams();
  useEffect(() => {
    messageId.current = searchParams.get("id");
    if(messageId.current !== null) {
      setMessage(null);
      fetch(apiURL("api/message/" + encodeURIComponent(messageId.current)))
        .then(res => res.json())
        .then(
          (result) => {
              setMessage(result);
              error.current = null;
          },
          (e) => {
              setMessage(null);
              error.current = e;
          }
        );
    }
  }, [searchParams]);

  return (
    <ThemeProvider theme={theme}>
      <Container component="main" maxWidth="100%">
        <CssBaseline />
          { message === null && <CircularProgress /> }
          { error.current && <Alert severity="error">Error querying backend: {error.current.message}</Alert> }
          { message && <Message key={message.notmuch_id} index={0} msg={message} active={true} open={true} print={true}/> }
      </Container>
    </ThemeProvider>
  );
}

// vim: tabstop=2 shiftwidth=2 expandtab
