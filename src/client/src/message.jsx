import React, { useState, useEffect } from 'react';
import { useSearchParams } from "react-router-dom";

import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import { createTheme, ThemeProvider } from '@mui/material/styles';

import Collapse from '@mui/material/Collapse';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';

import AttachFile from '@mui/icons-material/AttachFile';
import Print from '@mui/icons-material/Print';

import { getColor, strip } from "./utils.js";

const timeout = 200;

class MessageText extends React.Component {
  constructor(props) {
    super(props);
    this.state = { expanded: this.props.open };
    this.handleCollapse = this.handleCollapse.bind(this);

    let lines = this.props.text.split('\n');
    let lastLine = lines.length - 1;
    for(let index = 0; index < lines.length; index++) {
      let line = strip(lines[index].trim());
      if((line === "--") || (line === "—")) { // signature block
        if(lastLine === lines.length - 1) {
          lastLine = index - 1;
        }
        break;
      } else if(line.length > 0 && !line.startsWith(">") && !line.startsWith("&gt;")) {
        lastLine = index;
      }
    }

    if(lastLine === lines.length - 1) lastLine = lines.length;

    this.mainPart = lines.slice(0, lastLine).join('\n');
    this.quotedPart = lines.slice(lastLine).join('\n');
  }

  handleCollapse() {
    this.setState(prevState => ({
      expanded: !prevState.expanded
    }));
  }

  render() {
    return (
      <Box onClick={this.handleCollapse}>
        <Typography style={{ whiteSpace: "pre-line" }} dangerouslySetInnerHTML={{ __html: this.mainPart }} />
        { this.quotedPart.length > 0 &&
          <Box>
            <Collapse key={ this.props.id + "_quoted_collapsed" } in={!this.state.expanded} timeout={timeout} unmountOnExit>
              <Grid container justifyContent="space-between">
                <Typography align="left" style={{ overflow: "hidden", height: "3em", maxWidth: "77em" }} dangerouslySetInnerHTML={{ __html: this.quotedPart }} />
                <ExpandMore align="right" />
              </Grid>
            </Collapse>
            <Collapse key={ this.props.id + "_quoted_expanded" } in={this.state.expanded} timeout={timeout} unmountOnExit>
              <Grid container justifyContent="space-between">
                <Typography align="left" style={{ whiteSpace: "pre-line", maxWidth: "77em" }} dangerouslySetInnerHTML={{ __html: this.quotedPart }} />
                <ExpandLess align="right" />
              </Grid>
            </Collapse>
          </Box>
        }
      </Box>
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

    this.elementTop = React.createRef();
  }

  handleCollapse() {
    this.setState(prevState => ({
      expanded: !prevState.expanded,
      html: prevState.html
    }));
  }

  handleHtml() {
    this.setState(prevState => ({
      expanded: prevState.expanded,
      html: !prevState.html
    }));
  }

  getAttachment(attachment) {
    const { msg } = this.props;
    fetch(window.location.protocol + '//' + window.location.hostname + ':5000/api/attachment/' + msg.message_id + "/" + attachment)
      .then(res => res.blob())
      .then(blob => {
        const href = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.download = msg.attachments[attachment].filename;
        a.href = href;
        a.click();
        a.remove();
      },
      error => {
        console.log(error);
      });
  }

  componentDidUpdate() {
    if(this.state.expanded) {
      this.elementTop.current.scrollIntoView();
    }
  }

  componentDidMount() {
    if(this.state.expanded) {
      this.elementTop.current.scrollIntoView();
    }
  }

  render() {
    const { msg } = this.props;

    document.title = msg.subject;

    let validMsg = "Message DKIM verification failed, not signed.";
    let validSev = "warning";
    if(msg.dkim && msg.signature === "valid") {
      validMsg = "Message DKIM and signature verified.";
      validSev = "success";
    } else if(msg.dkim && msg.signature === "invalid") {
      validMsg = "Message DKIM verified, but signature verification failed.";
      validSev = "error";
    } else if(msg.dkim) {
      validMsg = "Message DKIM verified, not signed.";
      validSev = "success";
    } else if(!msg.dkim && msg.signature === "valid") {
      validMsg = "Message DKIM verification failed, signature verified.";
      validSev = "success";
    } else if(!msg.dkim && msg.signature === "invalid") {
      validMsg = "Message DKIM and signature verification failed.";
      validSev = "error";
    }

    return (
      <Paper elevation={3} sx={{ padding: 1, margin: 2, maxWidth: "80em" }} ref={this.elementTop}>
        <Collapse key={msg.message_id + "_collapsed" } in={!this.state.expanded} timeout={timeout} unmountOnExit>
          <Grid container justifyContent="space-between" onClick={this.handleCollapse}>
            <Typography align="left" style={{ maxWidth: "50em" }}>{msg.from}</Typography>
            <Typography align="right" style={{ maxWidth: "29em" }}>{msg.date}</Typography>
            <Typography align="left" style={{ overflow: "hidden", height: "3em", maxWidth: "77em" }} dangerouslySetInnerHTML={{ __html: msg.body["text/plain"] }} />
            <ExpandMore align="right" />
          </Grid>
        </Collapse>
        <Collapse key={msg.message_id + "_expanded" } in={this.state.expanded} timeout={timeout} unmountOnExit>
          <Box onClick={this.handleCollapse}>
            { msg.from && <Typography variant="h6">From: {msg.from}</Typography> }
            { msg.to && <Typography variant="h6">To: {msg.to}</Typography> }
            { msg.cc && <Typography variant="h6">CC: {msg.cc}</Typography> }
            { msg.bcc && <Typography variant="h6">BCC: {msg.bcc}</Typography> }
            <Typography variant="h6">Date: {msg.date}</Typography>
            <Grid container justifyContent="space-between">
              <Typography align="left" variant="h6" style={{ maxWidth: "62em" }}>Subject: {msg.subject}</Typography>
              <ExpandLess align="right" />
            </Grid>
          </Box>

          <Grid container spacing={1} justifyContent="space-between" direction="row">
            <Grid item>
              <Grid container spacing={1}>
                { msg.tags.map((tag, index2) => (
                  <Grid item key={index2} style={{ height: "3em" }}>
                    <Chip key={index2} label={tag} style={{ color: getColor(tag) }} onDelete={console.log}/>
                  </Grid>
                )) }
              </Grid>
            </Grid>
            <Grid item>
              <Grid item key="print" style={{ height: "3em" }}>
                <a href={"/message?id=" + msg.message_id} target="_blank" rel="noreferrer">
                  <Print/>
                </a>
              </Grid>
            </Grid>
          </Grid>

          { msg.attachments &&
            <Grid container spacing={1} alignItems="center">
              { msg.attachments.map((attachment, index2) => (
                  <Grid item align="center" key={index2} style={{ height: "3em" }} onClick={() => { this.getAttachment(index2); }}>
                    <Button key={index2} startIcon={<AttachFile/>} variant="outlined">
                      {attachment.filename} ({attachment.content_type})
                    </Button>
                  </Grid>
              )) }
            </Grid>
          }

          <Grid container spacing={1} alignItems="center" style={{ marginTop: ".1em" }}>
            <Grid item style={{ width: "100%" }}>
              <Alert severity={ validSev }>{ validMsg }</Alert>
            </Grid>
          </Grid>

          <Divider sx={{ marginTop: 2, marginBottom: 2 }} />

          <Grid container justifyContent="flex-end">
            { msg.body["text/html"] && <Button variant="outlined" onClick={this.handleHtml}>{this.state.html ? "Text" : "HTML"}</Button> }
          </Grid>
          { this.state.html ?
            <Typography dangerouslySetInnerHTML={{ __html: msg.body["text/html"] }} /> :
            <MessageText key={msg.message_id + "_text"} id={msg.message_id} text={msg.body["text/plain"]} open={false} /> }
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
      const { msg } = this.props;
      return (<Message key={this.key} msg={msg} open={true} />)
    }
  }
}

export function SingleMessage() {
  const [messageLoading, setMessageLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageId, setMessageId] = useState(null);
  const [error, setError] = useState(null);

  const [searchParams] = useSearchParams();
  useEffect(() => {
    setMessageId(searchParams.get("id"));
  }, [searchParams]);

  useEffect(() => {
    if(messageId !== null) {
      setMessage(null);
      setMessageLoading(true);
      fetch(window.location.protocol + '//' + window.location.hostname + ':5000/api/message/' + messageId)
        .then(res => res.json())
        .then(
          (result) => {
              setMessage(result);
              setError(null);
          },
          (error) => {
              setMessage(null);
              setError(error);
          }
        )
        .finally(() => {
          setMessageLoading(false);
        });
    }
  }, [messageId]);

  const theme = createTheme();

  return (
    <ThemeProvider theme={theme}>
      <Container component="main" maxWidth="90%">
        <CssBaseline />
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Box id="thread" sx={{ mt: 1 }}>
          { messageLoading && <CircularProgress /> }
          { error && 
            <Box id="error" sx={{ mt: 1 }}>
              <Alert severity="error">Error querying backend: {error.message}</Alert>
            </Box>
          }
          { message && 
              <Box>
              { message.tags.includes("deleted") ?
                <DeletedMessage key={message.message_id} msg={message} /> :
                <Message key={message.message_id} msg={message} open={true} />
              }
            </Box>
          }
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

// vim: tabstop=2 shiftwidth=2 expandtab
