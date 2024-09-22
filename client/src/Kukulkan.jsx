import { createEffect, createSignal, createResource, Show } from "solid-js";

import { Box, Grid, Modal, Stack } from "@suid/material";
import { Autocomplete } from "./Autocomplete.jsx";
import Create from "@suid/icons-material/Create";

import "./Kukulkan.css";
import { apiURL, fetchAllTags } from "./utils.js";
import { mkShortcut } from "./UiUtils.jsx";

async function fetchThreads(query) {
  if(query === null) return [];
  const response = await fetch(apiURL(`api/query/${encodeURIComponent(query)}`));
  if(!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
  return await response.json();
}

export const Kukulkan = (props) => {
  const [searchParams] = createSignal(window.location.search),
        [query] = createSignal(props.Threads.name.match(/todo/i) !== null ? "tag:todo" : (new URLSearchParams(searchParams())).get("query")),
        [searchText, setSearchText] = createSignal(query()),
        [threads, { mutate }] = createResource(query, fetchThreads, { initialValue: [] }),
        [activeThread, setActiveThread] = createSignal(0),
        [selectedThreads, setSelectedThreads] = createSignal([]),
        [editingTags, setEditingTags] = createSignal(null),
        [showEditingTagModal, setShowEditingTagModal] = createSignal(false),
        [allTags] = createResource(fetchAllTags);

  createEffect(() => {
    props.sl?.(allTags.loading || threads.loading);
  });

  createEffect(() => {
    activeThread();
    document.getElementsByClassName("kukulkan-thread active")[0]?.scrollIntoView({block: "nearest"});
  });

  createEffect(() => {
    if(showEditingTagModal()) document.getElementById("kukulkan-editTagBox").focus();
  });

  let opts = ["tag:unread", "tag:todo", "date:today"],
      qs = localStorage.getItem("queries");
  if(qs !== null) {
    qs = JSON.parse(qs);
    if(query()) {
      qs.unshift(query());
      qs = [...new Set(qs)];
      // store up to 20 most recent queries
      localStorage.setItem("queries", JSON.stringify(qs.slice(0, 20)));
    }
    opts = [...new Set(opts.concat(qs))];
  }
  
  document.title = query() || "Kukulkan";

  const makeTagEdits = () => {
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
      props.sl?.(true);
      Promise.all(urls.map((u) => fetch(u).then((response) => {
        if(!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      }))).then(() => mutate([...threads().slice(0, affectedThread), thread, ...threads().slice(affectedThread + 1)]))
      .finally(() => props.sl?.(false));
    });
    setEditingTags("");
  };

  mkShortcut(["Home"],
    () => setActiveThread(0)
  );
  mkShortcut(["k"],
    () => setActiveThread(Math.max(0, activeThread() - 1))
  );
  mkShortcut(["Shift", "K"],
    () => setActiveThread(Math.max(0, activeThread() - 10))
  );
  mkShortcut(["j"],
    () => setActiveThread(Math.min(threads().length - 1, activeThread() + 1))
  );
  mkShortcut(["Shift", "J"],
    () => setActiveThread(Math.min(threads().length - 1, activeThread() + 10))
  );
  mkShortcut(["End"],
    () => setActiveThread(threads().length - 1)
  );
  mkShortcut(["0"],
    () => setActiveThread(threads().length - 1)
  );

  mkShortcut(["Enter"],
    () => { if(threads()[activeThread()]) window.open(`/thread?id=${encodeURIComponent(threads()[activeThread()].thread_id)}`, '_blank') }
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
    () => window.open('/write', '_blank')
  );

  mkShortcut(["/"],
    () => {
      document.getElementById("kukulkan-queryBox")?.focus();
      document.getElementById("kukulkan-queryBox")?.select();
    },
    true
  );

  mkShortcut(["t"],
    () => setShowEditingTagModal(!showEditingTagModal()),
    true
  );

  mkShortcut(["Delete"],
    () => {
      setEditingTags("deleted -unread");
      makeTagEdits();
      setEditingTags("");
    },
    true
  );

  mkShortcut(["d"],
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

  const QueryBox = () => {
    return (
      <Box width="100%" noValidate>
        <Autocomplete
          id="kukulkan-queryBox"
          name="search"
          variant="standard"
          fullWidth
          text={searchText}
          setText={setSearchText}
          getOptions={(text) => {
            let pts = text.split(':'),
                last = pts.pop();
            if(pts.length > 0 && pts[pts.length - 1].endsWith("tag") && last.length > 0) {
              // autocomplete possible tag
              return allTags().filter((t) => t.startsWith(last)).map((t) => [...pts, t].join(':'));
            } else {
              return opts.filter((t) => t.includes(text));
            }
          }}
          handleKey={(ev) => {
            if(ev.code === 'Enter') {
              const sp = new URLSearchParams(searchParams());
              sp.set("query", searchText());
              window.location.search = sp.toString();
            }
          }}
        />
      </Box>
    );
  };

  const TagEditingModal = () => {
    return (
      <Modal open={showEditingTagModal()} onClose={() => { setShowEditingTagModal(false); setEditingTags(""); }} BackdropProps={{timeout: 0}}>
        <Autocomplete
          id="kukulkan-editTagBox"
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
  };

  return (
    <>
      <Show when={props.Threads.name.match(/todo/i) === null}>
        <Stack direction="row" class="centered" width="80%" spacing={2}>
          <QueryBox/>
          <a href="/write" target="_blank" rel="noreferrer">
            <Create/>
          </a>
        </Stack>
      </Show>
      <Show when={!allTags.loading && !threads.loading}>
        <div align="right">{threads().length} thread{threads().length === 1 ? "" : "s"}.</div>
        <Grid container width="95%" class="centered">
          <props.Threads threads={threads()} activeThread={activeThread} setActiveThread={setActiveThread} selectedThreads={selectedThreads}/>
        </Grid>
        <TagEditingModal/>
      </Show>
    </>
  );
};

// vim: tabstop=2 shiftwidth=2 expandtab