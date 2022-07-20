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
  render() {
    return (
      <React.Fragment>
        { this.props.filteredThread && this.props.filteredThread.map((msg, index) => (
            msg.tags.includes("deleted") && this.props.filteredThread.length > 1 ?
            <DeletedMessage key={msg.notmuch_id} msg={msg} updateActiveMsg={this.props.updateActiveMsg}/> :
            <Message key={msg.notmuch_id} index={index} msg={msg} tags={this.props.tags}
              open={index === this.props.open} updateActiveMsg={this.props.updateActiveMsg}/>
          ))
        }
      </React.Fragment>
    )
  }
}


function filterThread(msg, thread, activeDepth, activeMsg) {
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

  activeDepth.current = msg.depth;
  let res = prv.reverse().concat(nxt);

  let firstUnread = res.findIndex((msg) => {
    return msg.tags.includes("unread");
  });
  if(firstUnread > -1) {
    activeMsg.current = firstUnread;
  } else {
    activeMsg.current = res.length - 1;
  }

  return res;
}

export function Thread() {
  const [threadLoading, setThreadLoading] = useState(false);
  const [thread, setThread] = useState(null);
  const [tags, setTags] = useState(null);
  const [filteredThread, setFilteredThread] = useState(null);
  const [threadId, setThreadId] = useState(null);
  const [error, setError] = useState(null);

  const activeMsg = useRef(0);
  const activeDepth = useRef(1);
  const maxDepth = useRef(1);

  const [searchParams] = useSearchParams();
  useEffect(() => {
    setThreadId(searchParams.get("id"));
  }, [searchParams]);

  const clickEvent = new MouseEvent("click", {
    "view": window,
    "bubbles": true,
    "cancelable": false
  });

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

      setFilteredThread(filterThread(thread[thread.length - 1], thread, activeDepth, activeMsg));
    }
  }, [thread]);

  useEffect(() => {
    fetch(window.location.protocol + '//' + window.location.hostname + ':5000/api/tags/')
      .then(res => res.json())
      .then((result) => {
        setTags(result);
      });
  }, []);

  useEffect(() => {
    updateActiveMsg(activeMsg.current);
  // eslint-disable-next-line
  }, [filteredThread]);

  const theme = createTheme();

  function updateActiveMsg(at, open = false) {
    document.activeElement.blur();
    let els = Array.from(document.getElementsByClassName("kukulkan-keyboard-nav"));
    if(els[activeMsg.current]) {
      els[activeMsg.current].style.setProperty("box-shadow", "");
    }
    activeMsg.current = at;
    let elm = els[activeMsg.current];
    if(elm) {
      elm.style.setProperty("box-shadow", "0px 10px 13px -6px rgb(0 0 0 / 20%), 0px 20px 31px 3px rgb(0 0 0 / 14%), 0px 8px 38px 7px rgb(0 0 0 / 12%)")
      elm.scrollIntoView({block: "nearest"});
    }

    if(open) {
      // check if not already open
      if(elm && elm.getElementsByClassName('MuiChip-root').length === 0) {
        elm.getElementsByClassName("kukulkan-clickable")[0].click();
      }
    }

    // mark read if unread
    if(elm) {
      Array.from(elm.getElementsByClassName('MuiChip-label')).forEach(chip => {
        if(chip.textContent === "unread") {
          setTimeout(() => chip.nextElementSibling.dispatchEvent(clickEvent), 2000);
        }
      })
    }
  }

  const updateActiveDepth = (d) => {
    activeDepth.current = d;
    let msg = thread[thread.length - 1];
    thread.forEach(function(m) {
      if(m.depth === d) msg = m;
    });
    setFilteredThread(filterThread(msg, thread, activeDepth, activeMsg));
  }

  useHotkeys('k', () => updateActiveMsg(Math.max(0, activeMsg.current - 1)), [activeMsg]);
  useHotkeys('Shift+K', () => updateActiveMsg(Math.max(0, activeMsg.current - 1), true), [activeMsg]);
  useHotkeys('j', () => updateActiveMsg(Math.min(filteredThread.length - 1, activeMsg.current + 1)), [filteredThread, activeMsg]);
  useHotkeys('Shift+J', () => updateActiveMsg(Math.min(filteredThread.length - 1, activeMsg.current + 1), true), [filteredThread, activeMsg]);

  useHotkeys('h', () => updateActiveDepth(Math.max(1, activeDepth.current - 1)), [activeDepth, thread]);
  useHotkeys('l', () => updateActiveDepth(Math.min(activeDepth.current + 1, maxDepth.current)), [activeDepth, maxDepth, thread]);

  useHotkeys('c', () => {
    let els = Array.from(document.getElementsByClassName("kukulkan-keyboard-nav"));
    if(els[activeMsg.current]) {
      let toggle = els[activeMsg.current].getElementsByClassName('kukulkan-content');
      if(toggle.length > 0) {
        toggle[0].click();
      }
    }
  }, [activeMsg]);

  useHotkeys('p', () => {
    let els = Array.from(document.getElementsByClassName("kukulkan-keyboard-nav"));
    if(els[activeMsg.current]) {
      let print = els[activeMsg.current].getElementsByClassName('kukulkan-print');
      if(print.length > 0) {
        print[0].click();
      }
    }
  }, [activeMsg]);

  useHotkeys('t', (e) => {
    e.preventDefault();
    document.getElementsByClassName("kukulkan-keyboard-nav")[activeMsg.current].getElementsByTagName("input")[0].focus();
  }, [activeMsg]);

  useHotkeys('e,Enter', () => {
    // don't activate if we've tabbed to print/reply/attachment/etc
    if(["button", "a"].indexOf(document.activeElement.tagName.toLowerCase()) === -1) {
      let els = Array.from(document.getElementsByClassName("kukulkan-keyboard-nav"));
      let elm = els[activeMsg.current];
      if(elm) elm.getElementsByClassName("kukulkan-clickable")[0].click();
    }
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
                          onClick={() => {
                            if(filteredThread.find((i) => { return i.message_id === msg.message_id; })) {
                              updateActiveMsg(filteredThread.indexOf(msg), true);
                            } else {
                              setFilteredThread(filterThread(msg, thread, activeDepth, activeMsg));
                            }
                          }}
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
          <MessageList tags={tags} filteredThread={filteredThread} open={activeMsg.current} updateActiveMsg={updateActiveMsg}/>
        </Grid>
      </Container>
    </ThemeProvider>
  );
}

// vim: tabstop=2 shiftwidth=2 expandtab
