import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from "react-router-dom";

import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import { ThemeProvider } from '@mui/material/styles';

import { useHotkeys } from 'react-hotkeys-hook';

import invert from 'invert-color';

import { getColor, extractEmailsSort, filterTagsColor, filterSubjectColor, apiURL, theme } from "./utils.js";
import { Message, DeletedMessage } from "./message.jsx";

class MessageList extends React.Component {
  render() {
    return (
      <Grid container direction="column" justifyContent="center" alignItems="center">
        { this.props.filteredThread && this.props.filteredThread.map((msg, index) => (
            msg.tags.includes("deleted") && this.props.filteredThread.length > 1 ?
            <DeletedMessage key={msg.notmuch_id} msg={msg} allTags={this.props.allTags} setActiveMsg={this.props.setActiveMsg}/> :
            <Message key={msg.notmuch_id} index={index} msg={msg} allTags={this.props.allTags}
              open={index === this.props.activeMsg} active={index === this.props.activeMsg} setActiveMsg={this.props.setActiveMsg}/>
          ))
        }
      </Grid>
    )
  }
}

class ThreadNav extends React.Component {
  render() {
    return (
      <React.Fragment>
        { this.props.thread.current &&
          <Grid container direction="column" marginTop="1em">
            { this.props.thread.current.map((msg, index) => (
              <Grid item container key={index} direction="row">
                { (new Array(msg.depth).fill(0)).map((_, index2) => (
                  <Grid item key={index2}>
                    <Box
                      onClick={() => {
                        if(this.props.filteredThread.find((i) => { return i.message_id === msg.message_id; })) {
                          this.props.setActiveMsg(this.props.filteredThread.indexOf(msg), true);
                        } else {
                          this.props.setFilteredThread(filterThread(msg, this.props.thread.current, this.props.setActiveMsg));
                        }
                      }}
                      style={{ width: "1em", height: "1em", margin: ".03em",
                        opacity: (this.props.filteredThread && this.props.filteredThread.find((i) => { return i.message_id === msg.message_id; })) ?
                          1 :
                          .3,
                        borderRadius: msg.tags.includes("unread") ? "10px" : "0px",
                        border: (index2 === msg.depth - 1 && this.props.filteredThread[this.props.activeMsg].message_id === msg.message_id) ? "3px solid " + invert(getColor(filterSubjectColor(msg.subject) +
                            filterTagsColor(msg.tags) + extractEmailsSort(msg.from + msg.to + msg.cc))) : "",
                        backgroundColor: (index2 === msg.depth - 1 ?
                          getColor(filterSubjectColor(msg.subject) +
                            filterTagsColor(msg.tags) + extractEmailsSort(msg.from + msg.to + msg.cc)) :
                          "" )}}/>
                  </Grid>
                )) }
              </Grid>
            )) }
          </Grid>
        }
      </React.Fragment>
    )
  }
}

function filterThread(msg, thread, setActiveMsg) {
  if(msg === null) {
    let firstUnread = thread.findIndex((m) => {
      return m.tags.includes("unread");
    });
    if(firstUnread > -1) {
      msg = thread[firstUnread];
    } else {
      msg = thread[thread.length - 1];
    }
  }

  let prv = [];
  let tmp = msg;
  while(tmp.in_reply_to) {
    // eslint-disable-next-line
    tmp = thread.find(i => { return '<' + i.message_id + '>' === tmp.in_reply_to; });
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
    tmp = thread.find(i => { return '<' + tmp.message_id + '>' === i.in_reply_to; });
  }

  let res = prv.reverse().concat(nxt);
  setActiveMsg(res.findIndex(m => m === msg));

  return res;
}

export function Thread() {
  const [allTags, setAllTags] = useState(null);
  const [filteredThread, setFilteredThread] = useState(null);
  const [activeMsg, setActiveMsg] = useState(0);

  const maxDepth = useRef(1);
  const thread = useRef(null);
  const threadId = useRef(null);
  const error = useRef(null);

  const [searchParams] = useSearchParams();
  useEffect(() => {
    threadId.current = searchParams.get("id");
    if(threadId.current !== null) {
      fetch(apiURL("api/thread/" + encodeURIComponent(threadId.current)))
        .then(res => res.json())
        .then(
          (result) => {
              thread.current = result;
              error.current = null;
              if(thread.current) {
                let tmp = thread.current.slice();

                let depth = 1;
                while(tmp.length > 0) {
                  maxDepth.current = depth;
                  let cur = tmp.pop();
                  while(cur) {
                    cur.depth = depth;
                    // eslint-disable-next-line
                    cur = tmp.find(i => { return '<' + i.message_id + '>' === cur.in_reply_to; });
                    // eslint-disable-next-line
                    tmp = tmp.filter(i => { return i !== cur; });
                  }
                  depth++;
                }

                setFilteredThread(filterThread(null, thread.current, setActiveMsg));
              }
          },
          (e) => {
            thread.current = [];
            setFilteredThread([]);
            error.current = e;
          }
        );
    }
  }, [searchParams]);

  useEffect(() => {
    fetch(apiURL("api/tags/"))
      .then(res => res.json())
      .then((result) => {
        setAllTags(result);
      });
  }, []);

  const updateActiveDepth = (d) => {
    let msg = null;
    thread.current.forEach(function(m) {
      if(m.depth === d) msg = m;
    });
    setFilteredThread(filterThread(msg, thread.current, setActiveMsg));
  }

  useHotkeys('Home', () => setActiveMsg(0));
  useHotkeys('k', () => setActiveMsg(Math.max(0, activeMsg - 1)), [activeMsg]);
  useHotkeys('j', () => setActiveMsg(Math.min(filteredThread.length - 1, activeMsg + 1)), [filteredThread, activeMsg]);
  useHotkeys('End', () => setActiveMsg(filteredThread.length - 1), [filteredThread]);

  useHotkeys('h', () => updateActiveDepth(Math.max(1, filteredThread[activeMsg].depth - 1)), [filteredThread, activeMsg]);
  useHotkeys('l', () => updateActiveDepth(Math.min(filteredThread[activeMsg].depth + 1, maxDepth.current)), [filteredThread, activeMsg, maxDepth]);

  useHotkeys('c', () => document.getElementsByClassName("kukulkan-active-thread")[0].dispatchEvent(new CustomEvent('toggleContent')));
  useHotkeys('e,Enter', () => document.getElementsByClassName("kukulkan-active-thread")[0].dispatchEvent(new CustomEvent('toggleCollapse')));
  useHotkeys('p', () => document.getElementsByClassName("kukulkan-active-thread")[0].dispatchEvent(new CustomEvent('print')));
  useHotkeys('f', () => document.getElementsByClassName("kukulkan-active-thread")[0].dispatchEvent(new CustomEvent('forward')));
  useHotkeys('r', () => document.getElementsByClassName("kukulkan-active-thread")[0].dispatchEvent(new CustomEvent('reply')));
  useHotkeys('Shift+r', () => document.getElementsByClassName("kukulkan-active-thread")[0].dispatchEvent(new CustomEvent('replyOne')));
  useHotkeys('s', () => document.getElementsByClassName("kukulkan-active-thread")[0].dispatchEvent(new CustomEvent('security')));
  useHotkeys('w', () => document.getElementsByClassName("kukulkan-active-thread")[0].dispatchEvent(new CustomEvent('raw')));

  useHotkeys('t', (e) => {
    e.preventDefault();
    document.getElementsByClassName("kukulkan-active-thread")[0].getElementsByTagName("input")[0].focus();
  });

  useHotkeys('Del', () => {
    let el = document.getElementsByClassName("kukulkan-active-thread")[0];
    if(el && el.getElementsByClassName('MuiChip-root').length > 0) {
      el.getElementsByClassName("MuiAutocomplete-root")[0].dispatchEvent(new CustomEvent('delete'));
    }
  });

  return (
    <ThemeProvider theme={theme}>
      <Container component="main" maxWidth="100%">
        <CssBaseline />
        <center>
          { thread.current === null && <CircularProgress/> }
          { error.current && <Alert id="error" severity="error">Error querying backend: {error.current.message}</Alert> }
        </center>
        <Grid container direction="row" alignItems="flex-start">
          <Grid item xs="auto" style={{height: '100vh', overflowY: 'auto'}}>
            <ThreadNav thread={thread} filteredThread={filteredThread} setFilteredThread={setFilteredThread} setActiveMsg={setActiveMsg} activeMsg={activeMsg}/>
          </Grid>
          <Grid item xs style={{height: '100vh', overflowY: 'auto'}}>
            <MessageList allTags={allTags} filteredThread={filteredThread} activeMsg={activeMsg} setActiveMsg={setActiveMsg}/>
          </Grid>
        </Grid>
      </Container>
    </ThemeProvider>
  );
}

// vim: tabstop=2 shiftwidth=2 expandtab
