import React, { useState, useEffect } from 'react';
import { useSearchParams } from "react-router-dom";

import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import { createTheme, ThemeProvider } from '@mui/material/styles';

import Collapse from '@mui/material/Collapse';

import { getColor } from "./utils.js";

class MessageText extends React.Component {
  constructor(props) {
    super(props);
    this.state = { expanded: this.props.open };
    this.handleClick = this.handleClick.bind(this);

    let lines = this.props.text.split('\n');
    let lastLine = 0;
    for(let index = 0; index < lines.length; index++) {
      let line = lines[index];
      if(line.trim() === "--") break; // signature block
      if(line.trim().length !== 0 && !line.startsWith(">") && !line.startsWith("&gt;")) lastLine = index;
    }

    this.mainPart = lines.slice(0, lastLine).join('\n');
    this.quotedPart = lines.slice(lastLine).join('\n');
  }

  handleClick() {
    this.setState(prevState => ({
      expanded: !prevState.expanded
    }));
  }

  render() {
    return (
      <Box onClick={this.handleClick}>
        <Typography style={{whiteSpace: 'pre-line'}} dangerouslySetInnerHTML={{ __html: this.mainPart }} />
        <Collapse key={this.props.id + "_quoted_collapsed" } in={!this.state.expanded} timeout={300} unmountOnExit>
            <Typography style={{overflow: "hidden", height: "3em"}} dangerouslySetInnerHTML={{ __html: this.quotedPart }} />
        </Collapse>
        <Collapse key={this.props.id + "_quoted_expanded" } in={this.state.expanded} timeout={300} unmountOnExit>
            <Typography style={{whiteSpace: 'pre-line'}} dangerouslySetInnerHTML={{ __html: this.quotedPart }} />
        </Collapse>
      </Box>
    )
  }
}

class Message extends React.Component {
  constructor(props) {
    super(props);
    this.state = { expanded: this.props.open };
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
    this.setState(prevState => ({
      expanded: !prevState.expanded
    }));
  }

  render() {
    const { msg } = this.props;
    return (
      <Paper elevation={3} sx={{ padding: 1, margin: 2, width: "80em" }}>
        <Collapse key={msg.message_id + "_collapsed" } in={!this.state.expanded} timeout={300} unmountOnExit>
          <Grid container justifyContent="space-between" onClick={this.handleClick}>
            <Typography align="left">{msg.from}</Typography>
            <Typography align="right">{msg.date}</Typography>
            <Typography style={{overflow: "hidden", height: "3em"}} dangerouslySetInnerHTML={{ __html: msg.content }} />
          </Grid>
        </Collapse>
        <Collapse key={msg.message_id + "_expanded" } in={this.state.expanded} timeout={300} unmountOnExit>
          <Box onClick={this.handleClick}>
            { msg.from && <Typography variant="h6">From: {msg.from}</Typography> }
            { msg.to && <Typography variant="h6">To: {msg.to}</Typography> }
            { msg.cc && <Typography variant="h6">CC: {msg.cc}</Typography> }
            { msg.bcc && <Typography variant="h6">BCC: {msg.bcc}</Typography> }
            <Typography variant="h6">Date: {msg.date}</Typography>
            <Typography variant="h6">Subject: {msg.subject}</Typography>
            <Grid container spacing={1}>
              { msg.tags.map((tag, index2) => (
                <Grid item key={index2}>
                  <Chip key={index2} label={tag} style={{ color: getColor(tag) }} onDelete={console.log}/>
                </Grid>
              )) }
            </Grid>
          </Box>
          <Divider sx={{ marginTop: 2, marginBottom: 2 }} />
          <MessageText key={msg.message_id + "_text"} id={msg.message_id} text={msg.content} open={false} />
        </Collapse>
      </Paper>
    )
  }
}

export function Thread() {
  const [threadLoading, setThreadLoading] = useState(false);
  const [thread, setThread] = useState(null);
  const [threadId, setThreadId] = useState(null);
  const [error, setError] = useState(null);

  const [searchParams] = useSearchParams();
  useEffect(() => {
    setThreadId(searchParams.get("id"));
  }, [searchParams]);

  useEffect(() => {
    if(threadId !== null) {
      setThread(null);
      setThreadLoading(true);
      fetch('http://localhost:5000/api/thread/' + threadId)
        .then(res => res.json())
        .then(
          (result) => {
              setThread(result);
              setError(null);
          },
          (error) => {
              setThread(null);
              setError(error);
          }
        )
        .finally(() => {
          setThreadLoading(false);
        });
    }
  }, [threadId]);

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
          { threadLoading && <CircularProgress /> }
          { error && 
            <Box id="error" sx={{ mt: 1 }}>
              <Alert severity="error">Error querying backend: {error.message}</Alert>
            </Box>
          }
          { thread && 
              <Box>
              { thread.map((msg, index) => (
                <Message key={msg.message_id} msg={msg} open={index === thread.length - 1} />
              )) }
            </Box>
          }
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

// vim: tabstop=2 shiftwidth=2 expandtab
