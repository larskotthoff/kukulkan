import { createEffect, createSignal, For, on, Show } from "solid-js";

import { Autocomplete, getTagOptions } from "./Autocomplete.jsx";

import { getSetting } from "./Settings.jsx";

import { apiURL } from "./utils.js";
import { Group, Icon, mkShortcut, Tag, TaskAlt, Trash } from "./UiUtils.jsx";

export function ThreadGroup(props) {
  // eslint-disable-next-line solid/reactivity
  if(props.thread.length !== undefined) {
    // eslint-disable-next-line solid/reactivity
    if(props.thread[0].collapsed === undefined) props.thread[0].collapsed = true;
    // eslint-disable-next-line solid/reactivity
    let [collapsed, setCollapsed] = createSignal(props.thread[0].collapsed);

    createEffect(on(collapsed, () => {
      props.thread[0].collapsed = collapsed();
    }));

    function toggle() {
      setCollapsed(!collapsed());
      if(collapsed()) {
        props.setActiveThread(props.thread[0].thread_id);
      }
    }

    // eslint-disable-next-line solid/components-return-once
    return (
      <div classList={{
          'thread-group': true,
          'width-100': true,
          'collapsed': collapsed()
        }}
        onClick={toggle}>
        <For each={props.thread}>
          {(t) => <ThreadGroup thread={t} threadListElem={props.threadListElem} setActiveThread={props.setActiveThread}/>}
        </For>
      </div>
    );
  }

  // eslint-disable-next-line solid/reactivity
  return props.threadListElem(props);
}

export function Threads(props) {
  const [query, setQuery] = createSignal(),
        [selectedThreads, setSelectedThreads] = createSignal([]),
        [editingTags, setEditingTags] = createSignal(null),
        [showTagEditingBar, setShowTagEditingBar] = createSignal(false),
        [threads, setThreads] = createSignal(data.threads || []),
        // eslint-disable-next-line solid/reactivity
        [activeThread, setActiveThread] = createSignal(threads().length > 0 ? threads().flat()[0].thread_id : null);

  function getAffectedThreads() {
    if(threads().length > 0) {
      let tmp = selectedThreads(),
          retval = [];
      if(tmp.length === 0) tmp = [activeThread()];
      tmp.forEach(at => {
        let parent = document.querySelector(`[data-id='${at}']`).parentElement;
        if(parent.classList.contains("thread-group") && parent.classList.contains("collapsed")) {
          [...parent.querySelectorAll(".thread")].forEach(gt => retval.push(gt.dataset.id));
        } else {
          retval.push(at);
        }
      });
      return retval;
    } else {
      return [];
    }
  }

  async function makeTagEdits(edits) {
    let affectedThreads = getAffectedThreads();
    if(affectedThreads.length === 0) return;
    const url = apiURL(`api/tag_batch/thread/${encodeURIComponent(affectedThreads.join(' '))}/${encodeURIComponent(edits)}`);

    props.sp?.(0);
    const response = await fetch(url);
    props.sp?.(1);
    if(!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
    affectedThreads.forEach(affectedThread => {
      const thread = threads().flat().find(t => t.thread_id === affectedThread);
      edits.split(' ').map((edit) => {
        if(edit[0] === '-') {
          thread.tags = thread.tags.filter(t => t !== edit.substring(1));
        } else {
          if(thread.tags.indexOf(edit) === -1) thread.tags.push(edit);
        }
      });
    });
    setThreads(JSON.parse(JSON.stringify(threads())));
    setEditingTags("");
    setSelectedThreads([]);
  }

  createEffect(on(activeThread, () => {
    document.getElementsByClassName("thread active")[0]?.scrollIntoView({block: "nearest"});
  }));

  createEffect(on(query, () => {
    if(query()) {
      document.title = `${query()} (${threads().length})`;
    } else {
      document.title = "Kukulkan";
    }
  }));

  mkShortcut([["Home"]],
    // eslint-disable-next-line solid/reactivity
    () => threads().length > 0 && setActiveThread(threads().flat()[0].thread_id)
  );

  function threadUp() {
    if(threads().length > 0) {
      let prev = document.querySelector(".thread.active").previousElementSibling;
      if(prev === null) {
        prev = document.querySelector(".thread.active").parentElement.previousElementSibling;
      }
      if(prev === null) return;
      if(prev.classList.contains("thread-group")) {
        if(prev.classList.contains("collapsed")) {
          prev = prev.firstElementChild;
        } else {
          prev = prev.lastElementChild;
        }
      }
      if(prev.classList.contains("thread")) {
        setActiveThread(prev.dataset.id);
      }
    }
  }
  // eslint-disable-next-line solid/reactivity
  mkShortcut([["k"], ["ArrowUp"]], threadUp);

  function threadDown() {
    if(threads().length > 0) {
      let next = document.querySelector(".thread.active").nextElementSibling;
      if(next === null || next.parentElement.classList.contains("collapsed")) {
        next = document.querySelector(".thread.active").parentElement.nextElementSibling;
      }
      if(next === null) return;
      if(next.classList.contains("thread-group")) {
        next = next.firstElementChild;
      }
      if(next.classList.contains("thread")) {
        setActiveThread(next.dataset.id);
      }
    }
  }
  // eslint-disable-next-line solid/reactivity
  mkShortcut([["j"], ["ArrowDown"]], threadDown);

  document.addEventListener('wheel', ev => {
    if(ev.shiftKey) {
      if(ev.deltaY < 0) {
        threadDown();
      } else {
        threadUp();
      }
      ev.preventDefault();
    }
  }, {passive: false});

  mkShortcut([["End"], ["0"]],
    // eslint-disable-next-line solid/reactivity
    () => {
      if(threads().length > 0) {
        let ti = threads().flat().at(-1).thread_id,
            el = document.querySelector(`[data-id='${ti}']`);
        if(el.parentElement.classList.contains("thread-group") && el.parentElement.classList.contains("collapsed")) {
          ti = el.parentElement.firstElementChild.dataset.id;
        }
        setActiveThread(ti);
      }
    }
  );

  mkShortcut([["h"], ["ArrowLeft"], ["l"], ["ArrowRight"]],
    // eslint-disable-next-line solid/reactivity
    () => {
      if(threads().length > 0) {
        let parent = document.querySelector(".thread.active").parentElement;
        if(parent.classList.contains("thread-group")) {
          parent.click();
        }
      }
    }
  );

  function openActive() {
    window.open(`/thread?id=${encodeURIComponent(activeThread())}`, getSetting("openInTab"));
  }

  // eslint-disable-next-line solid/reactivity
  mkShortcut([["Enter"]], openActive);

  function activeSelection() {
    let curSelThreads = selectedThreads(),
        idx = curSelThreads.indexOf(activeThread());
    if(idx === -1) {
      setSelectedThreads([...curSelThreads, activeThread()]);
    } else {
      setSelectedThreads(curSelThreads.filter((item) => item !== activeThread()));
    }
  }
  document.addEventListener('keydown', ev => {
    if(document.activeElement.tagName.toLowerCase() !== 'input' && ev.code === 'Space') {
      ev.preventDefault();
      activeSelection();
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
    setShowTagEditingBar(threads().length > 0 && !showTagEditingBar());
  }

  // eslint-disable-next-line solid/reactivity
  mkShortcut([["t"]], tagActive, true);

  function deleteActive() {
    if(threads().length > 0) {
      makeTagEdits("deleted -unread");
    }
  }

  // eslint-disable-next-line solid/reactivity
  mkShortcut([["Delete"]], deleteActive, true);

  function doneActive() {
    let edits = "-todo",
        affectedThreads = getAffectedThreads();
    if(affectedThreads.length === 0) return;
    affectedThreads.forEach(affectedThread => {
      let due = threads().flat().find(t => t.thread_id === affectedThread)?.tags.find((tag) => tag.startsWith("due:"));
      if(due) edits += " -" + due;
    });
    makeTagEdits(edits);
  }

  // eslint-disable-next-line solid/reactivity
  mkShortcut([["d"]], doneActive, true);

  async function groupActive() {
    const affectedThreads = getAffectedThreads();
    if(affectedThreads.length === 0) return;

    const groupMap = new Map();
    affectedThreads.forEach((at) => {
      const thread = threads().flat().find(t => t.thread_id === at),
            groupTags = thread.tags.filter((t) => t.startsWith("grp:"));
      groupTags.forEach((gt) => {
        if(groupMap.has(gt)) {
          groupMap.get(gt).push(at);
        } else {
          groupMap.set(gt, [at]);
        }
      });
    });

    async function ungroup(gt) {
      const url = apiURL(`api/tag_batch/thread/${encodeURIComponent(groupMap.get(gt).join(' '))}/-${encodeURIComponent(gt)}`),
            response = await fetch(url);
      if(!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      groupMap.get(gt).forEach(at => {
        const thread = threads().flat().find(t => t.thread_id === at);
        thread.tags = thread.tags.filter(t => t !== gt);
      });
    }

    const firstGroup = groupMap.keys().next().value;
    props.sp?.(0);
    if(groupMap.size === 1 && groupMap.get(firstGroup).length === affectedThreads.length) {
      // ungroup
      await ungroup(firstGroup);
    } else {
      // more than one group selected, assume that we want to create a new group
      // from all threads after removing all exising groups
      if(groupMap.size > 1) {
        await groupMap.keys().forEach(ungroup);
      }

      // group all affected threads
      const url = apiURL(`api/group/${encodeURIComponent(affectedThreads.join(' '))}`),
            response = await fetch(url);
      if(!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      const grp = await response.text();
      affectedThreads.forEach(affectedThread => {
        const thread = threads().flat().find(t => t.thread_id === affectedThread);
        if(!thread.tags.includes(grp)) {
          thread.tags.push(grp);
        }
      });
    }
    props.sp?.(1);

    // create new hierarchical thread structure
    let old = JSON.parse(JSON.stringify(threads().flat())),
        newThreads = [];
    while(old.length > 0) {
      const next = old.shift(),
            // only take the first, ignore any other group tags
            grp = next.tags.find(t => t.startsWith("grp:"));
      if(grp === undefined) {
        newThreads.push(next);
      } else {
        newThreads = [...newThreads, [next, ...old.filter(t => t.tags.includes(grp))]];
        old = old.filter(t => !t.tags.includes(grp));
      }
    }

    setThreads(newThreads);
    setSelectedThreads([]);
  }

  // eslint-disable-next-line solid/reactivity
  mkShortcut([["g"]], groupActive, true);

  createEffect(on(showTagEditingBar, () => {
    if(showTagEditingBar()) document.querySelector("#edit-tag-box > input").focus();
  }));

  function TagEditingBar() {
    return (
      <Show when={showTagEditingBar()}>
        <Autocomplete
          id="edit-tag-box"
          name="editTags"
          class="centered edit-tag-box"
          text={editingTags}
          setText={setEditingTags}
          onBlur={() => {
            setShowTagEditingBar(false);
            setEditingTags("");
          }}
          // eslint-disable-next-line solid/reactivity
          getOptions={async (text) => {
            // claude helped with this
            let pts = text.match(/([^ -]+)|[ -]/g),
                last = pts?.pop();
            if(last && last.length > 0) {
              const opts = await getTagOptions(last, props.sp, false);
              return opts.map((t) => [...pts, t].join(''));
            } else {
              return [];
            }
          }}
          handleKey={(ev) => {
            if(ev.code === 'Enter' || ev.key === 'Enter') {
              setShowTagEditingBar(false);
              makeTagEdits(editingTags());
              ev.stopPropagation();
            }
          }}
        />
      </Show>
    );
  }

  return (
    <>
      <TagEditingBar/>
      <props.Threads threads={threads} activeThread={activeThread}
        setActiveThread={setActiveThread} selectedThreads={selectedThreads}
        setQuery={setQuery} sp={props.sp} openActive={openActive}
        deleteActive={deleteActive} doneActive={doneActive} activeSelection={activeSelection}/>
      <div classList={{
          'threads-action-icons': true,
          'hidden': selectedThreads().length === 0
        }}>
        <a id="tag" title="Tag" href="#" onClick={tagActive}>
          <Icon icon={Tag}/>
        </a>
        <a id="group" title="Group" href="#" onClick={groupActive}>
          <Icon icon={Group}/>
        </a>
        <a id="done" title="Mark done" href="#" onClick={doneActive}>
          <Icon icon={TaskAlt}/>
        </a>
        <a id="delete" title="Delete" href="#" onClick={deleteActive}>
          <Icon icon={Trash}/>
        </a>
      </div>
    </>
  );
}

// vim: tabstop=2 shiftwidth=2 expandtab
