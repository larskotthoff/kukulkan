import { createSignal, For, Show } from "solid-js";

import Grid from "@suid/material/Grid";
import Stack from "@suid/material/Stack";

import { Message } from "./Message.jsx";

import { getSetting } from "./Settings.jsx";

import "./Kukulkan.css";
import { extractEmailsSort, filterSubjectColor, filterAdminTags, getColor } from "./utils.js";
import { mkShortcut } from "./UiUtils.jsx";

function getFirstUnread(thread) {
  let firstUnread = thread.findIndex((m) => {
    return m.tags.includes("unread");
  });
  return firstUnread > -1 ? firstUnread : thread.length - 1;
}

function filterThread(msg, thread) {
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
}

export function Thread(props) {
  const [filteredThread, setFilteredThread] = createSignal(),
        [activeMessage, setActiveMessage] = createSignal();

  // eslint-disable-next-line no-undef
  let tmp = data.thread.slice();

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

  if(getSetting("showNestedThread")) {
    // eslint-disable-next-line no-undef
    let [ft, activeIdx] = filterThread(null, data.thread);
    setFilteredThread(ft);
    setActiveMessage(activeIdx);
  } else {
    // eslint-disable-next-line no-undef
    setFilteredThread(data.thread);
    // eslint-disable-next-line no-undef
    setActiveMessage(getFirstUnread(data.thread));
  }

  mkShortcut(["Home"],
    () => setActiveMessage(0)
  );
  mkShortcut(["1"],
    () => setActiveMessage(0)
  );
  mkShortcut(["k"],
    // eslint-disable-next-line solid/reactivity
    () => setActiveMessage(Math.max(0, activeMessage() - 1))
  );
  mkShortcut(["ArrowUp"],
    // eslint-disable-next-line solid/reactivity
    () => setActiveMessage(Math.max(0, activeMessage() - 1))
  );
  mkShortcut(["Shift", "K"],
    // eslint-disable-next-line solid/reactivity
    () => setActiveMessage(Math.max(0, activeMessage() - 10))
  );
  mkShortcut(["j"],
    // eslint-disable-next-line solid/reactivity
    () => setActiveMessage(Math.min(filteredThread().length - 1, activeMessage() + 1))
  );
  mkShortcut(["ArrowDown"],
    // eslint-disable-next-line solid/reactivity
    () => setActiveMessage(Math.min(filteredThread().length - 1, activeMessage() + 1))
  );
  mkShortcut(["Shift", "J"],
    // eslint-disable-next-line solid/reactivity
    () => setActiveMessage(Math.min(filteredThread().length - 1, activeMessage() + 10))
  );
  mkShortcut(["End"],
    // eslint-disable-next-line solid/reactivity
    () => setActiveMessage(filteredThread().length - 1)
  );
  mkShortcut(["0"],
    // eslint-disable-next-line solid/reactivity
    () => setActiveMessage(filteredThread().length - 1)
  );

  function updateActiveDepth(d) {
    let msg = null,
        unread = false;
    // eslint-disable-next-line no-undef
    data.thread.forEach(function(m) {
      if(!unread && m.depth === d) {
        unread = m.tags.includes("unread");
        msg = m;
      }
    });
    // eslint-disable-next-line no-undef
    let [ft, activeIdx] = filterThread(msg, data.thread);
    setFilteredThread(ft);
    setActiveMessage(activeIdx);
    document.querySelector(".threadnav-box.active")?.scrollIntoView({inline: "center"});
  }

  mkShortcut(["h"],
    // eslint-disable-next-line solid/reactivity
    () => updateActiveDepth(Math.max(0, filteredThread()[activeMessage()].depth - 1))
  );
  mkShortcut(["ArrowLeft"],
    // eslint-disable-next-line solid/reactivity
    () => updateActiveDepth(Math.max(0, filteredThread()[activeMessage()].depth - 1))
  );
  mkShortcut(["l"],
    // eslint-disable-next-line solid/reactivity
    () => updateActiveDepth(Math.min(filteredThread()[activeMessage()].depth + 1,
      // eslint-disable-next-line no-undef
                                  Math.max(...data.thread.map(m => m.depth))))
  );
  mkShortcut(["ArrowRight"],
    // eslint-disable-next-line solid/reactivity
    () => updateActiveDepth(Math.min(filteredThread()[activeMessage()].depth + 1,
      // eslint-disable-next-line no-undef
                                  Math.max(...data.thread.map(m => m.depth))))
  );

  mkShortcut(["Shift", "F"],
    // eslint-disable-next-line solid/reactivity
    () => {
      // eslint-disable-next-line no-undef
      if(filteredThread() === data.thread) {
        // eslint-disable-next-line no-undef
        let [ft, activeIdx] = filterThread(null, data.thread);
        setFilteredThread(ft);
        setActiveMessage(activeIdx);
      } else {
        // eslint-disable-next-line no-undef
        setFilteredThread(data.thread);
        // eslint-disable-next-line no-undef
        setActiveMessage(getFirstUnread(data.thread));
      }
    }
  );

  function ThreadNav() {
    return (
      <Show when={filteredThread() && filteredThread()[activeMessage()]}>
        <Grid container direction="column" class="threadnav-container sticky">
          { /* eslint-disable-next-line no-undef */ }
          <For each={data.thread}>
            {(m, i) =>
              <div
                onClick={() => {
                  // eslint-disable-next-line no-undef
                  if(filteredThread() === data.thread) {
                    setActiveMessage(i);
                  } else {
                    // eslint-disable-next-line no-undef
                    let [ft, activeIdx] = filterThread(m, data.thread);
                    setFilteredThread(ft);
                    setActiveMessage(activeIdx);
                  }
                }}
                classList={{
                  'threadnav-box': true,
                  'active': filteredThread()[activeMessage()].message_id === m.message_id,
                  'active-thread': filteredThread()?.find((mp) => { return mp.message_id === m.message_id; })
                }}
                style={{
                  // eslint-disable-next-line no-undef
                  'margin-left': (filteredThread() === data.thread ? 0 : m.depth) + "em",
                  'border-radius': m.tags.includes("unread") ? "1em" : "0em",
                  'background-color': getColor(filterSubjectColor(m.subject) + filterAdminTags(m.tags) + extractEmailsSort(m.from + m.to + m.cc))
                }}
              />}
          </For>
        </Grid>
      </Show>
    );
  }

  return (
    <>
      <Show when={activeMessage() > -1}>
        <Stack direction="row" class="centered" alignItems="stretch" justifyContent="space-around" spacing={1}>
          <ThreadNav/>
          <Grid container class="centered" direction="column">
            <For each={filteredThread()}>
              {(m, i) => <Message msg={m} active={i() === activeMessage()} sp={props.sp}
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
        </Stack>
      </Show>
    </>
  );
}

// vim: tabstop=2 shiftwidth=2 expandtab
