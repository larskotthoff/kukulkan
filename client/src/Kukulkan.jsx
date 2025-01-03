import { createEffect, createSignal, on, Show } from "solid-js";
import * as chrono from 'chrono-node';

import { Autocomplete } from "./Autocomplete.jsx";

import { getSetting } from "./Settings.jsx";

import "./Kukulkan.css";
import { apiURL } from "./utils.js";
import { mkShortcut } from "./UiUtils.jsx";

export function Kukulkan(props) {
  const [query, setQuery] = createSignal(),
        [activeThread, setActiveThread] = createSignal(0),
        [selectedThreads, setSelectedThreads] = createSignal([]),
        [editingTags, setEditingTags] = createSignal(null),
        [showEditingTagModal, setShowEditingTagModal] = createSignal(false),
        [threads, setThreads] = createSignal(data.threads || []);

  function makeTagEdits() {
    let affectedThreads = selectedThreads();
    if(affectedThreads.length === 0) affectedThreads = [activeThread()];
    affectedThreads.forEach(affectedThread => {
      const thread = JSON.parse(JSON.stringify(threads()[affectedThread])),
            urls = editingTags().split(' ').map((edit) => {
              if(edit[0] === '-') {
                thread.tags = thread.tags.filter(t => t !== edit.substring(1));
                return apiURL(`api/tag/remove/thread/${encodeURIComponent(thread.thread_id)}/${encodeURIComponent(edit.substring(1))}`);
              } else {
                if(thread.tags.indexOf(edit) === -1) thread.tags.push(edit);
                return apiURL(`api/tag/add/thread/${encodeURIComponent(thread.thread_id)}/${encodeURIComponent(edit)}`);
              }
            });
      let done = 0;
      props.sp?.(0);
      // eslint-disable-next-line solid/reactivity
      Promise.all(urls.map((u) => fetch(u).then((response) => {
        done += 1;
        props.sp?.(done / urls.length);
        if(!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      // eslint-disable-next-line solid/reactivity
      }))).then(() => setThreads([...threads().slice(0, affectedThread), thread, ...threads().slice(affectedThread + 1)]))
      // eslint-disable-next-line solid/reactivity
      .finally(() => props.sp?.(1));
    });
    setEditingTags("");
    setSelectedThreads([]);
  }

  createEffect(on(activeThread, () => {
    document.getElementsByClassName("thread active")[0]?.scrollIntoView({block: "nearest"});
  }));

  createEffect(on(query, () => {
    document.title = query() || "Kukulkan";
  }));

  mkShortcut([["Home"]],
    () => setActiveThread(0)
  );
  mkShortcut([["k"], ["ArrowUp"]],
    // eslint-disable-next-line solid/reactivity
    () => setActiveThread(Math.max(0, activeThread() - 1))
  );
  mkShortcut([["Shift", "K"]],
    // eslint-disable-next-line solid/reactivity
    () => setActiveThread(Math.max(0, activeThread() - 10))
  );
  mkShortcut([["j"], ["ArrowDown"]],
    // eslint-disable-next-line solid/reactivity
    () => setActiveThread(Math.min(threads().length - 1, activeThread() + 1))
  );
  mkShortcut([["Shift", "J"]],
    // eslint-disable-next-line solid/reactivity
    () => setActiveThread(Math.min(threads().length - 1, activeThread() + 10))
  );
  mkShortcut([["End"], ["0"]],
    // eslint-disable-next-line solid/reactivity
    () => setActiveThread(threads().length - 1)
  );

  function openActive() {
    if(threads()[activeThread()]) {
      window.open(`/thread?id=${encodeURIComponent(threads()[activeThread()].thread_id)}`, getSetting("openInTab"));
    }
  }

  // eslint-disable-next-line solid/reactivity
  mkShortcut([["Enter"]], openActive);

  document.addEventListener('keydown', function(event) {
    if(document.activeElement.tagName.toLowerCase() !== 'input' && event.code === 'Space') {
      event.preventDefault();

      let curSelThreads = selectedThreads(),
          idx = curSelThreads.indexOf(activeThread());
      if(idx === -1) {
        setSelectedThreads([...curSelThreads, activeThread()]);
      } else {
        setSelectedThreads(curSelThreads.filter((item, index) => index !== idx));
      }
    }
  });

  mkShortcut([["c"]],
    () => window.open('/write', getSetting("openInTab"))
  );

  mkShortcut([["s"]],
    () => window.open('/settings', getSetting("openInTab"))
  );

  mkShortcut([["/"]],
    () => {
      document.querySelector("#query-box > input")?.focus();
    },
    true
  );

  function tagActive() {
    setShowEditingTagModal(threads().length > 0 && !showEditingTagModal());
  }

  // eslint-disable-next-line solid/reactivity
  mkShortcut([["t"]], tagActive, true);

  function deleteActive() {
    setEditingTags("deleted -unread");
    makeTagEdits();
    setEditingTags("");
  }

  // eslint-disable-next-line solid/reactivity
  mkShortcut([["Delete"]], deleteActive, true);

  function doneActive() {
    let edits = "-todo",
        affectedThreads = selectedThreads();
    if(affectedThreads.length === 0) affectedThreads = [activeThread()];
    affectedThreads.forEach(affectedThread => {
      let due = threads()[affectedThread].tags.find((tag) => tag.startsWith("due:"));
      if(due) edits += " -" + due;
    });
    setEditingTags(edits);
    makeTagEdits();
  }

  // eslint-disable-next-line solid/reactivity
  mkShortcut([["d"]], doneActive, true);

  createEffect(on(showEditingTagModal, () => {
    if(showEditingTagModal()) document.querySelector("#edit-tag-box > input").focus();
  }));

  function TagEditingModal() {
    return (
      <Show when={showEditingTagModal()}>
        <Autocomplete
          id="edit-tag-box"
          name="editTags"
          class="centered edit-tag-box"
          text={editingTags}
          setText={setEditingTags}
          onBlur={() => {
            setShowEditingTagModal(false);
            setEditingTags("");
          }}
          getOptions={(text) => {
            // claude helped with this
            let pts = text.match(/([^ -]+)|[ -]/g),
                last = pts?.pop();
            if(last && last.length > 0) {
              const opts = data.allTags.filter((t) => t.startsWith(last));
              if(last.startsWith("due:")) {
                const parsed = chrono.parseDate(text.split(':')[1])?.toISOString().split('T')[0];
                if(parsed) opts.unshift(`due:${parsed}`);
              }
              return opts.map((t) => [...pts, t].join(''));
            } else {
              return [];
            }
          }}
          handleKey={(ev) => {
            if(ev.code === 'Enter' || ev.key === 'Enter') {
              setShowEditingTagModal(false);
              // sad, but true
              makeTagEdits();
              ev.stopPropagation();
            }
          }}
        />
      </Show>
    );
  }

  return (
    <>
      <TagEditingModal/>
      <props.Threads threads={threads} activeThread={activeThread} setActiveThread={setActiveThread}
        selectedThreads={selectedThreads} setQuery={setQuery} sp={props.sp}
        openActive={openActive} deleteActive={deleteActive} doneActive={doneActive} tagActive={tagActive}/>
    </>
  );
}

// vim: tabstop=2 shiftwidth=2 expandtab
