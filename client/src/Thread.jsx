import { createSignal, For, Show } from "solid-js";

import { Message } from "./Message.jsx";

import { getSetting } from "./Settings.jsx";

import { extractEmailsSort, filterSubjectColor, filterAdminTags, getColor } from "./utils.js";
import { handleSwipe, mkShortcut } from "./UiUtils.jsx";

// finds first message to show; unread or not deleted or last message
function getFirstToShow(thread) {
  let first = thread.findIndex((m) => {
    return m.tags.includes("unread");
  });
  if(first === -1) {
    first = thread.findLastIndex((m) => {
      return m.tags.includes("deleted") === false;
    });
  }
  return first > -1 ? first : thread.length - 1;
}

function filterThread(msg, thread) {
  if(msg === null) {
    msg = thread[getFirstToShow(thread)];
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
    let [ft, activeIdx] = filterThread(null, data.thread);
    setFilteredThread(ft);
    setActiveMessage(activeIdx);
  } else {
    setFilteredThread(data.thread);
    setActiveMessage(getFirstToShow(data.thread));
  }

  mkShortcut([["Home"], ["1"]],
    () => setActiveMessage(0)
  );
  mkShortcut([["k"], ["ArrowUp"]],
    // eslint-disable-next-line solid/reactivity
    () => setActiveMessage(Math.max(0, activeMessage() - 1))
  );
  mkShortcut([["Shift", "K"]],
    // eslint-disable-next-line solid/reactivity
    () => setActiveMessage(Math.max(0, activeMessage() - 10))
  );
  mkShortcut([["j"], ["ArrowDown"]],
    // eslint-disable-next-line solid/reactivity
    () => setActiveMessage(Math.min(filteredThread().length - 1, activeMessage() + 1))
  );
  mkShortcut([["Shift", "J"]],
    // eslint-disable-next-line solid/reactivity
    () => setActiveMessage(Math.min(filteredThread().length - 1, activeMessage() + 10))
  );
  mkShortcut([["End"], ["0"]],
    // eslint-disable-next-line solid/reactivity
    () => setActiveMessage(filteredThread().length - 1)
  );

  function updateActiveDepth(d) {
    let msg = null,
        unread = false;
    data.thread.forEach(function(m) {
      if(!unread && m.depth === d) {
        unread = m.tags.includes("unread");
        msg = m;
      }
    });
    let [ft, activeIdx] = filterThread(msg, data.thread);
    setFilteredThread(ft);
    setActiveMessage(activeIdx);
    document.querySelector(".threadnav-box.active")?.scrollIntoView({inline: "center"});
  }

  function decreaseActiveDepth() {
    updateActiveDepth(Math.max(0, filteredThread()[activeMessage()].depth - 1));
  }

  function increaseActiveDepth() {
    updateActiveDepth(Math.min(filteredThread()[activeMessage()].depth + 1,
                      Math.max(...data.thread.map(m => m.depth))));
  }

  // eslint-disable-next-line solid/reactivity
  mkShortcut([["h"], ["ArrowLeft"]], decreaseActiveDepth);
  // eslint-disable-next-line solid/reactivity
  mkShortcut([["l"], ["ArrowRight"]], increaseActiveDepth);
  // eslint-disable-next-line solid/reactivity
  handleSwipe(document.body, () => document.querySelector(".message-container"), increaseActiveDepth, null, decreaseActiveDepth, null);

  mkShortcut([["Shift", "F"]],
    // eslint-disable-next-line solid/reactivity
    () => {
      if(filteredThread() === data.thread) {
        let [ft, activeIdx] = filterThread(null, data.thread);
        setFilteredThread(ft);
        setActiveMessage(activeIdx);
      } else {
        setFilteredThread(data.thread);
        setActiveMessage(getFirstToShow(data.thread));
      }
    }
  );

  function ThreadNav() {
    return (
      <Show when={filteredThread() && filteredThread()[activeMessage()]}>
        <div class="threadnav-container">
          <div class="vertical-stack threadnav-inner">
            <For each={data.thread}>
              {(m, i) =>
                <div
                  onClick={() => {
                    if(filteredThread() === data.thread) {
                      setActiveMessage(i);
                    } else {
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
                    '--depth': (filteredThread() === data.thread ? 0 : m.depth),
                    'border-radius': m.tags.includes("unread") ? "1em" : "0em",
                    'background-color': getColor(filterSubjectColor(m.subject) + filterAdminTags(m.tags) + extractEmailsSort(m.from + m.to + m.cc))
                  }}
                />}
            </For>
          </div>
        </div>
      </Show>
    );
  }

  return (
    <>
      <Show when={activeMessage() > -1}>
        <div class="centered horizontal-stack">
          <ThreadNav/>
          <div class="message-container centered vertical-stack">
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
          </div>
        </div>
      </Show>
    </>
  );
}

// vim: tabstop=2 shiftwidth=2 expandtab
