import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from "react-router-dom";

import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import { createTheme, ThemeProvider } from '@mui/material/styles';

import { useHotkeys } from 'react-hotkeys-hook';

import { getColor, extractEmailsSort, filterTagsColor, filterSubjectColor } from "./utils.js";
import { Message, DeletedMessage } from "./message.jsx";

class MessageList extends React.Component {
  componentDidUpdate() {
    if(this.props.filteredThread) this.props.updateActiveMsg(this.props.filteredThread.length - 1);
  }

  render() {
    return (
      <React.Fragment>
        { this.props.filteredThread && this.props.filteredThread.map((msg, index) => (
            msg.tags.includes("deleted") ?
            <DeletedMessage key={msg.notmuch_id} msg={msg} updateActiveMsg={this.props.updateActiveMsg} /> :
            <Message key={msg.notmuch_id} index={index} msg={msg} open={index === this.props.filteredThread.length - 1} updateActiveMsg={this.props.updateActiveMsg} />
          ))
        }
      </React.Fragment>
    )
  }
}


function filterThread(msg, thread) {
  let prv = [];
  let tmp = msg;
  while(tmp.in_reply_to) {
    // eslint-disable-next-line
    tmp = thread.find(i => { return i.message_id === tmp.in_reply_to; });
    if(!tmp) { // we don't have the message replied to here (looking at you, spam filter)
      break;
    }
    prv.push(tmp);
  }

  let nxt = [];
  tmp = msg;
  while(tmp) {
    nxt.push(tmp);
    // eslint-disable-next-line
    tmp = thread.find(i => { return tmp.message_id === i.in_reply_to; });
  }

  return prv.reverse().concat(nxt);
}

export function Thread() {
  const [threadLoading, setThreadLoading] = useState(false);
  const [thread, setThread] = useState(null);
  const [filteredThread, setFilteredThread] = useState(null);
  const [threadId, setThreadId] = useState(null);
  const [error, setError] = useState(null);

  const activeMsg = useRef(0);

  const [searchParams] = useSearchParams();
  useEffect(() => {
    setThreadId(searchParams.get("id"));
  }, [searchParams]);

  useEffect(() => {
    if(threadId !== null) {
      setThread(null);
      setThreadLoading(true);
      fetch(window.location.protocol + '//' + window.location.hostname + ':5000/api/thread/' + threadId)
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

  useEffect(() => {
    if(thread) {
      let tmp = thread.slice();

      let depth = 1;
      while(tmp.length > 0) {
        let cur = tmp.pop();
        while(cur) {
          cur.depth = depth;
          // eslint-disable-next-line
          cur = tmp.find(i => { return i.message_id === cur.in_reply_to; });
          // eslint-disable-next-line
          tmp = tmp.filter(i => { return i !== cur; });
        }
        depth++;
      }

      setFilteredThread(filterThread(thread[thread.length - 1], thread));
    }
  }, [thread]);

  const theme = createTheme();

  function updateActiveMsg(at) {
    activeMsg.current = at;
    Array.from(document.getElementsByClassName("kukulkan-keyboard-nav")).forEach((el, index) => {
      if(el.style.getPropertyValue("box-shadow") !== "" && activeMsg.current !== index) {
        el.style.setProperty("box-shadow", "");
      } else if(activeMsg.current === index && el.style.getPropertyValue("box-shadow") === "") {
        // elevation 20
        el.style.setProperty("box-shadow", "0px 10px 13px -6px rgb(0 0 0 / 20%), 0px 20px 31px 3px rgb(0 0 0 / 14%), 0px 8px 38px 7px rgb(0 0 0 / 12%)");
        el.scrollIntoView({block: "nearest"});
      }
    });
  }

  useHotkeys('k', () => updateActiveMsg(Math.max(0, activeMsg.current - 1)), [activeMsg]);
  useHotkeys('j', () => updateActiveMsg(Math.min(filteredThread.length - 1, activeMsg.current + 1)), [filteredThread, activeMsg]);
  useHotkeys('e,Enter', () => {
    let elm = null;
    Array.from(document.getElementsByClassName("kukulkan-keyboard-nav")).forEach((el, index) => {
      if(index === activeMsg.current) elm = el;
    });
    if(elm) elm.getElementsByClassName("kukulkan-clickable")[0].click();
  }, [activeMsg]);

  return (
    <ThemeProvider theme={theme}>
      <Container component="main" maxWidth="100%">
        <CssBaseline />
        <Grid container id="thread" direction="column" justifyContent="center" alignItems="center" style={{ marginTop: "1em" }}>
          { threadLoading && <CircularProgress/> }
          { error && <Alert id="error" severity="error">Error querying backend: {error.message}</Alert> }
          { thread &&
            <Drawer variant="permanent" anchor="left">
              <Grid container direction="column" margin="1em">
                { thread.map((msg, index) => (
                  <Grid item container key={index} direction="row">
                    { (new Array(msg.depth).fill(0)).map((_, index2) => (
                      <Grid item key={index2}>
                        <Box
                          onClick={() => setFilteredThread(filterThread(msg, thread))}
                          style={{ width: "1em", height: "1em", margin: ".03em",
                            opacity: (filteredThread && filteredThread.find((i) => { return i.message_id === msg.message_id; })) ?
                              1 :
                              .3,
                            backgroundColor: (index2 === msg.depth - 1 ?
                              getColor(filterSubjectColor(msg.subject) +
                                filterTagsColor(msg.tags) + extractEmailsSort(msg.from + msg.to + msg.cc)) :
                              "" )}}/>
                      </Grid>
                    )) }
                  </Grid>
                )) }
              </Grid>
            </Drawer>
          }
          <MessageList filteredThread={filteredThread} updateActiveMsg={updateActiveMsg}/>
        </Grid>
      </Container>
    </ThemeProvider>
  );
}

// vim: tabstop=2 shiftwidth=2 expandtab
