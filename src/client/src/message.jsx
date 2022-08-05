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
import { createTheme, ThemeProvider } from '@mui/material/styles';

import Collapse from '@mui/material/Collapse';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';

import AttachFile from '@mui/icons-material/AttachFile';
import Print from '@mui/icons-material/Print';
import Reply from '@mui/icons-material/Reply';
import Forward from '@mui/icons-material/Forward';

import { TagBar } from "./tags.jsx";

import invert from 'invert-color';
import { strip, getColor } from "./utils.js";

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
    this.setState(prevState => ({
      expanded: !prevState.expanded
    }));
  }

  render() {
    return (
      <React.Fragment>
        <Box style={{ whiteSpace: "pre-line" }} dangerouslySetInnerHTML={{ __html: this.props.mainPart }} />
        { this.props.quotedPart.length > 0 &&
          <Box onClick={this.handleCollapse}>
            <Collapse key={ this.props.id + "_quoted_collapsed" } in={!this.state.expanded} timeout={timeout} unmountOnExit>
              <Grid container justifyContent="space-between">
                <Grid item xs><Box style={{ overflow: "hidden", height: "3em" }} dangerouslySetInnerHTML={{ __html: this.props.quotedPart }} /></Grid>
                <Grid item><ExpandMore/></Grid>
              </Grid>
            </Collapse>
            <Collapse key={ this.props.id + "_quoted_expanded" } in={this.state.expanded} timeout={timeout} unmountOnExit>
              <Grid container justifyContent="space-between">
                <Grid item xs><Box style={{ whiteSpace: "pre-line" }} dangerouslySetInnerHTML={{ __html: this.props.quotedPart }} /></Grid>
                <Grid item><ExpandLess/></Grid>
              </Grid>
            </Collapse>
          </Box>
        }
      </React.Fragment>
    )
  }
}

export class Message extends React.Component {
  constructor(props) {
    super(props);
    this.state = { expanded: this.props.open, html: false };
    this.handleCollapse = this.handleCollapse.bind(this);
    this.handleHtml = this.handleHtml.bind(this);
    this.getAttachment = this.getAttachment.bind(this);
    this.formatAddrs = this.formatAddrs.bind(this);

    this.prevActive = false;

    this.elementTop = React.createRef();

    // separate into non-quoted and quoted text
    let lines = props.msg.body["text/plain"].split('\n');
    let lastLine = lines.length - 1;
    for(let index = 0; index < lines.length; index++) {
      let line = strip(lines[index].trim());
      if((line === "--") || (line === "—")) { // signature block
        lastLine = index - 1;
        break;
      } else if(line === "From:") { // outlook
        lastLine = index;
        break;
      } else if(line === "-----Original Message-----") { // also outlook
        lastLine = index;
        break;
      } else if(line === "________________________________") { // outlook mailing lists I think
        lastLine = index;
        break;
      } else if(line.length > 1 && !line.startsWith(">") && !line.startsWith("&gt;")) {
        // don't break if we see a > because there may be inline replies
        lastLine = index;
      }
    }

    if(lastLine === lines.length - 1) lastLine = lines.length;

    this.mainPart = lines.slice(0, lastLine).join('\n');
    this.quotedPart = lines.slice(lastLine).join('\n');
  }

  componentDidMount() {
    if(this.props.active) {
      this.elementTop.current.scrollIntoView({block: "nearest"});
    }

    this.elementTop.current.addEventListener("toggleContent", this.handleHtml);
    this.elementTop.current.addEventListener("toggleCollapse", this.handleCollapse);
    this.elementTop.current.addEventListener("print", () => {
      window.open('/message?id=' + this.props.msg.notmuch_id, '_blank');
    });
    this.elementTop.current.addEventListener("reply", () => {
      window.open('/write?action=reply&id=' + this.props.msg.notmuch_id, '_blank');
    });
    this.elementTop.current.addEventListener("forward", () => {
      window.open('/write?action=forward&id=' + this.props.msg.notmuch_id, '_blank');
    });

    if(this.state.expanded && this.props.msg.tags.includes("unread")) {
      setTimeout(() =>
        this.elementTop.current.getElementsByClassName("MuiAutocomplete-root")[0].dispatchEvent(new CustomEvent('read')),
      2000);
    }
  }

  componentDidUpdate() {
    if(!this.prevActive && this.props.active) {
      if(!this.state.expanded) {
        this.setState(prevState => ({
          expanded: true,
          html: prevState.html
        }));
      }
      this.elementTop.current.scrollIntoView({block: "nearest"});
    }
    this.prevActive = this.props.active;

    if(this.state.expanded && this.props.msg.tags.includes("unread")) {
      setTimeout(() =>
        this.elementTop.current.getElementsByClassName("MuiAutocomplete-root")[0].dispatchEvent(new CustomEvent('read')),
      2000);
    }
  }

  handleCollapse() {
    this.setState(prevState => ({
      expanded: !prevState.expanded,
      html: prevState.html
    }), () => {
      if(this.state.expanded) {
        if(this.props.setActiveMsg) {
          // not available in print view
          this.props.setActiveMsg(this.props.index);
        }
      }
    });
  }

  handleHtml() {
    this.setState(prevState => ({
      expanded: prevState.expanded,
      html: !prevState.html
    }));
  }

  getAttachment(attachment) {
    window.open(window.location.protocol + '//' + window.location.hostname + ':5000/api/attachment/' + encodeURIComponent(this.props.msg.notmuch_id) + "/" + attachment, '_blank');
  }

  formatAddrs(addrs) {
    // split on , preceded by > or by email address
    return addrs.split(/(?<=>),\s*|(?<=@[^, ]+),\s*/).map((addr, index) => (
      <span key={index} style={{ backgroundColor: getColor(addr), color: invert(getColor(addr), true), padding: 2, margin: 2, borderRadius: 3 }}>{addr}</span>
    ))
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

    let validMsg = "";
    let validSev = "warning";

    if(msg.dkim) {
      validMsg = "DKIM verified";
      validSev = "success";
    } else {
      validMsg = "DKIM verification failed";
    }
    if(msg.signature) {
      validMsg += ", ";
      if(msg.signature.valid) {
        validMsg += "signature verified";
        validSev = "success";
      } else {
        validMsg += "signature verification failed";
        validSev = "error";
      }
      if(msg.signature.message) {
        validMsg += " (" + msg.signature.message + ")";
      }
    }
    validMsg += ".";

    return (
      <Paper elevation={this.props.active ? 20 : 3} sx={{ padding: 1, margin: 1, width: "80em" }} className={ this.props.active ? "kukulkan-active-thread" : ""} ref={this.elementTop}>
        <Collapse key={msg.notmuch_id + "_collapsed" } in={!this.state.expanded} timeout={timeout} unmountOnExit>
          <Grid container direction="column" onClick={this.handleCollapse}>
            <Grid container direction="row" justifyContent="space-between">
              <Grid item><Typography>{this.formatAddrs(msg.from)}</Typography></Grid>
              <Grid item><Typography>{msg.date}</Typography></Grid>
            </Grid>
            <Grid container direction="row" justifyContent="space-between">
              <Grid item xs><Typography style={{ overflow: "hidden", maxHeight: "3em" }} dangerouslySetInnerHTML={{ __html: this.mainPart }} /></Grid>
              <Grid item><ExpandMore/></Grid>
            </Grid>
          </Grid>
        </Collapse>

        <Collapse key={msg.notmuch_id + "_expanded" } in={this.state.expanded} timeout={timeout} unmountOnExit>
          <Box onClick={this.handleCollapse}>
            { msg.from && <Typography>From: {this.formatAddrs(msg.from)}</Typography> }
            { msg.to && <Typography>To: {this.formatAddrs(msg.to)}</Typography> }
            { msg.cc && <Typography>CC: {this.formatAddrs(msg.cc)}</Typography> }
            { msg.bcc && <Typography>BCC: {this.formatAddrs(msg.bcc)}</Typography> }
            <Typography>Date: {msg.date}</Typography>
            <Grid container justifyContent="space-between">
              <Grid item xs><Typography>Subject: {msg.subject}</Typography></Grid>
              { this.props.print || <Grid item><ExpandLess/></Grid> }
            </Grid>
          </Box>

          { this.props.print ||
            <React.Fragment>
              <Grid container spacing={1} justifyContent="space-between" direction="row" style={{ minHeight: "3.5em" }}>
                <Grid item xs={11}>
                  <TagBar tagsObject={msg} options={this.props.allTags} id={msg.notmuch_id} type="message"/>
                </Grid>
                <Grid item key="reply">
                  <a href={"/write?action=reply&id=" + msg.notmuch_id} target="_blank" rel="noreferrer">
                    <Reply/>
                  </a>
                </Grid>
                <Grid item key="forward">
                  <a href={"/write?action=forward&id=" + msg.notmuch_id} target="_blank" rel="noreferrer">
                    <Forward/>
                  </a>
                </Grid>
                <Grid item key="print">
                  <a href={"/message?id=" + msg.notmuch_id} target="_blank" rel="noreferrer">
                    <Print/>
                  </a>
                </Grid>
              </Grid>

              <React.Fragment>
                { msg.attachments &&
                  <Grid container spacing={1}>
                    { msg.attachments.map((attachment, index2) => (
                        <Grid item align="center" key={index2} style={{ minHeight: "3em" }} onClick={() => { this.getAttachment(index2); }}>
                          { attachment.content_type.includes("image") ?
                            <img src={window.location.protocol + '//' + window.location.hostname + ':5000/api/attachment/' + encodeURIComponent(msg.notmuch_id) + "/" + index2} alt={attachment.filename} style={{ maxWidth: "30em" }}/> :
                            <Button key={index2} startIcon={<AttachFile/>} variant="outlined">
                              {attachment.filename} ({attachment.content_type})
                            </Button>
                          }
                        </Grid>
                    )) }
                  </Grid>
                }
              </React.Fragment>

              <Alert width="100%" severity={ validSev }>{ validMsg }</Alert>
            </React.Fragment>
          }

          <Divider sx={{ marginTop: 2, marginBottom: 2 }} />

          <Grid container justifyContent="flex-end">
            { msg.body["text/html"] && <Button variant="outlined" className="kukulkan-content" onClick={this.handleHtml}>{this.state.html ? "Text" : "HTML"}</Button> }
          </Grid>
          { this.state.html ?
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
      fetch(window.location.protocol + '//' + window.location.hostname + ':5000/api/message/' + encodeURIComponent(messageId.current))
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

  const theme = createTheme();

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
