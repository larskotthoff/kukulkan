import { createEffect, createSignal, createResource, For, Show } from "solid-js";
import { Box, Grid, LinearProgress } from "@suid/material";

import { Message } from "./Message.jsx";

import "./Kukulkan.css";
import { apiURL, extractEmailsSort, fetchAllTags, filterSubjectColor, filterTagsColor, getColor, mkShortcut } from "./utils.js";

async function fetchThread(id) {
  if(id === null) return null;
  const response = await fetch(apiURL(`api/thread/${encodeURIComponent(id)}`));
  if(!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
  return await response.json();
}

const getFirstUnread = (thread) => {
  let firstUnread = thread.findIndex((m) => {
    return m.tags.includes("unread");
  });
  return firstUnread > -1 ? firstUnread : thread.length - 1;
}

const filterThread = (msg, thread) => {
  if(msg === null) {
    msg = thread[getFirstUnread(thread)];
  }

  let prv = [];
  let tmp = msg;
  while(tmp.in_reply_to) {
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
    tmp = thread.find(i => { return '<' + tmp.message_id + '>' === i.in_reply_to; });
  }

  let res = prv.reverse().concat(nxt),
      activeIdx = res.findIndex(m => m === msg);

  return [res, activeIdx];
};

export const Thread = () => {
  const [searchParams] = createSignal(window.location.search),
        [threadId] = createSignal((new URLSearchParams(searchParams())).get("id")),
        [thread] = createResource(threadId(), fetchThread),
        [filteredThread, setFilteredThread] = createSignal(),
        [allTags] = createResource(fetchAllTags),
        [activeMessage, setActiveMessage] = createSignal();

  createEffect(() => {
    if(thread()) {
      let tmp = thread().slice();

      let depth = 0;
      while(tmp.length > 0) {
        let cur = tmp.pop();
        while(cur) {
          cur.depth = depth;
          cur = tmp.find(i => { return '<' + i.message_id + '>' === cur.in_reply_to; });
          tmp = tmp.filter(i => { return i !== cur; });
        }
        depth++;
      }

      let [ft, activeIdx] = filterThread(null, thread());
      setFilteredThread(ft);
      setActiveMessage(activeIdx);
    }
  });

  mkShortcut(["Home"],
    () => setActiveMessage(0)
  );
  mkShortcut(["1"],
    () => setActiveMessage(0)
  );
  mkShortcut(["k"],
    () => setActiveMessage(Math.max(0, activeMessage() - 1))
  );
  mkShortcut(["Shift", "K"],
    () => setActiveMessage(Math.max(0, activeMessage() - 10))
  );
  mkShortcut(["j"],
    () => setActiveMessage(Math.min(filteredThread().length - 1, activeMessage() + 1))
  );
  mkShortcut(["Shift", "J"],
    () => setActiveMessage(Math.min(filteredThread().length - 1, activeMessage() + 10))
  );
  mkShortcut(["End"],
    () => setActiveMessage(filteredThread().length - 1)
  );
  mkShortcut(["0"],
    () => setActiveMessage(filteredThread().length - 1)
  );

  const updateActiveDepth = (d) => {
    let msg = null,
        unread = false;
    thread().forEach(function(m) {
      if(!unread && m.depth === d) {
        unread = m.tags.includes("unread");
        msg = m;
      }
    });
    let [ft, activeIdx] = filterThread(msg, thread());
    setFilteredThread(ft);
    setActiveMessage(activeIdx);
  };

  mkShortcut(["h"],
    () => updateActiveDepth(Math.max(0, filteredThread()[activeMessage()].depth - 1))
  );
  mkShortcut(["l"],
    () => updateActiveDepth(Math.min(filteredThread()[activeMessage()].depth + 1,
                                  Math.max(...thread().map(m => m.depth))))
  );

  mkShortcut(["Shift", "F"],
    () => {
      if(filteredThread() === thread()) {
        let [ft, activeIdx] = filterThread(null, thread());
        setFilteredThread(ft);
        setActiveMessage(activeIdx);
      } else {
        setFilteredThread(thread());
        setActiveMessage(getFirstUnread(thread()));
      }
    }
  );

  const ThreadNav = () => {
    return (
      <Show when={filteredThread() && filteredThread()[activeMessage()]}>
        <Grid container direction="column" marginTop="1em">
          <For each={thread()}>
            {(m, i) =>
              <Box
                onClick={() => {
                  if(filteredThread() === thread()) {
                    setActiveMessage(i);
                  } else {
                    let [ft, activeIdx] = filterThread(m, thread());
                    setFilteredThread(ft);
                    setActiveMessage(activeIdx);
                  }
                }}
                class="threadnav-box"
                style={{
                  left: (filteredThread() === thread() ? 0 : m.depth) + "em",
                  opacity: filteredThread()?.find((mp) => { return mp.message_id === m.message_id; }) ? 1 : .3,
                  'border-radius': m.tags.includes("unread") ? "1em" : "0em",
                  'border-color': filteredThread()[activeMessage()].message_id === m.message_id ? "black" : "white",
                  'background-color': getColor(filterSubjectColor(m.subject) + filterTagsColor(m.tags) + extractEmailsSort(m.from + m.to + m.cc))
                }}
              />}
          </For>
        </Grid>
      </Show>
    );
  };

  return (
    <>
      <Show when={allTags.state === "ready" && activeMessage() > -1} fallback={<LinearProgress/>}>
        <Grid container direction="row" alignItems="flex-start">
          <Grid item xs="auto" style={{height: '100vh'}}>
            <ThreadNav/>
          </Grid>
          <Grid item xs style={{height: '100vh', 'overflow-y': 'auto'}}>
            <Grid container direction="column" class="centered">
              <For each={filteredThread()}>
                {(m, i) => <Message msg={m} allTags={allTags()} active={i() === activeMessage()}
                  onClick={(e) => {
                      if(e.target.tagName.toLowerCase() !== 'a' &&
                          e.target.tagName.toLowerCase() !== 'input' &&
                          window.getSelection().toString().length === 0) {
                        setActiveMessage(i());
                      }
                    }}
                  />}
              </For>
            </Grid>
          </Grid>
        </Grid>
      </Show>
    </>
  );
};

// vim: tabstop=2 shiftwidth=2 expandtab
