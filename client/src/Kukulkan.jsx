import { createEffect, createSignal, createResource, Show } from "solid-js";

import Modal from "@suid/material/Modal";
import { Autocomplete } from "./Autocomplete.jsx";

import { getSetting } from "./Settings.jsx";

import "./Kukulkan.css";
import { apiURL, fetchAllTags } from "./utils.js";
import { mkShortcut } from "./UiUtils.jsx";

async function fetchThreads(query) {
  if(query === null) return [];
  const response = await fetch(apiURL(`api/query/${encodeURIComponent(query)}`));
  if(!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
  return await response.json();
}

export function Kukulkan(props) {
  const [query, setQuery] = createSignal(),
        [threads, { mutate }] = createResource(query, fetchThreads, { initialValue: [] }),
        [activeThread, setActiveThread] = createSignal(0),
        [selectedThreads, setSelectedThreads] = createSignal([]),
        [editingTags, setEditingTags] = createSignal(null),
        [showEditingTagModal, setShowEditingTagModal] = createSignal(false),
        [allTags] = createResource(fetchAllTags);

  function makeTagEdits() {
    let affectedThreads = selectedThreads();
    if(affectedThreads.length === 0) affectedThreads = [activeThread()];
    affectedThreads.forEach(affectedThread => {
      let thread = JSON.parse(JSON.stringify(threads()[affectedThread])),
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
        props.sp?.(100 * done / urls.length);
        if(!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      }))).then(() => mutate([...threads().slice(0, affectedThread), thread, ...threads().slice(affectedThread + 1)]))
      // eslint-disable-next-line solid/reactivity
      .finally(() => props.sp?.(100));
    });
    setEditingTags("");
  }

  createEffect(() => {
    props.sp?.(100 * (1 - (allTags.loading + threads.loading) / 2));
  });

  createEffect(() => {
    activeThread();
    document.getElementsByClassName("thread active")[0]?.scrollIntoView({block: "nearest"});
  });

  createEffect(() => {
    if(showEditingTagModal()) document.getElementById("edit-tag-box").focus();
  });

  createEffect(() => {
    document.title = query() || "Kukulkan";
  });

  mkShortcut(["Home"],
    () => setActiveThread(0)
  );
  mkShortcut(["k"],
    // eslint-disable-next-line solid/reactivity
    () => setActiveThread(Math.max(0, activeThread() - 1))
  );
  mkShortcut(["Shift", "K"],
    // eslint-disable-next-line solid/reactivity
    () => setActiveThread(Math.max(0, activeThread() - 10))
  );
  mkShortcut(["j"],
    // eslint-disable-next-line solid/reactivity
    () => setActiveThread(Math.min(threads().length - 1, activeThread() + 1))
  );
  mkShortcut(["Shift", "J"],
    // eslint-disable-next-line solid/reactivity
    () => setActiveThread(Math.min(threads().length - 1, activeThread() + 10))
  );
  mkShortcut(["End"],
    // eslint-disable-next-line solid/reactivity
    () => setActiveThread(threads().length - 1)
  );
  mkShortcut(["0"],
    // eslint-disable-next-line solid/reactivity
    () => setActiveThread(threads().length - 1)
  );

  mkShortcut(["Enter"],
    // eslint-disable-next-line solid/reactivity
    () => { if(threads()[activeThread()]) window.open(`/thread?id=${encodeURIComponent(threads()[activeThread()].thread_id)}`, getSetting("openInTab")) }
  );

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

  mkShortcut(["c"],
    () => window.open('/write', getSetting("openInTab"))
  );

  mkShortcut(["s"],
    () => window.open('/settings', getSetting("openInTab"))
  );

  mkShortcut(["/"],
    () => {
      document.getElementById("query-box")?.focus();
      document.getElementById("query-box")?.select();
    },
    true
  );

  mkShortcut(["t"],
    // eslint-disable-next-line solid/reactivity
    () => setShowEditingTagModal(!showEditingTagModal()),
    true
  );

  mkShortcut(["Delete"],
    // eslint-disable-next-line solid/reactivity
    () => {
      setEditingTags("deleted -unread");
      makeTagEdits();
      setEditingTags("");
    },
    true
  );

  mkShortcut(["d"],
    // eslint-disable-next-line solid/reactivity
    () => {
      let affectedThreads = selectedThreads(),
          edits = "-todo";
      if(affectedThreads.length === 0) affectedThreads = [activeThread()];
      affectedThreads.forEach(affectedThread => {
        let due = threads()[affectedThread].tags.find((tag) => tag.startsWith("due:"));
        if(due) edits += " -" + due;
      });
      setEditingTags(edits);
      makeTagEdits();
      setEditingTags("");
    },
    true
  );

  function TagEditingModal() {
    return (
      <Modal open={showEditingTagModal()} onClose={() => { setShowEditingTagModal(false); setEditingTags(""); }} BackdropProps={{timeout: 0}}>
        <Autocomplete
          id="edit-tag-box"
          name="editTags"
          variant="standard"
          fullWidth
          text={editingTags}
          setText={setEditingTags}
          getOptions={(text) => {
            // claude helped with this
            let pts = text.match(/([^ -]+)|[ -]/g),
                last = pts.pop();
            if(last.length > 0)
              return allTags().filter((t) => t.startsWith(last)).map((t) => [...pts, t].join(''));
            else
              return [];
          }}
          handleKey={(ev) => {
            if(ev.code === 'Enter') {
              setShowEditingTagModal(false);
              // sad, but true
              makeTagEdits();
              ev.stopPropagation();
            }
          }}
        />
      </Modal>
    );
  }

  return (
    <Show when={!allTags.loading && !threads.loading}>
      <props.Threads threads={threads} activeThread={activeThread} setActiveThread={setActiveThread}
        selectedThreads={selectedThreads} setQuery={setQuery} allTags={allTags}/>
      <TagEditingModal/>
    </Show>
  );
}

// vim: tabstop=2 shiftwidth=2 expandtab
