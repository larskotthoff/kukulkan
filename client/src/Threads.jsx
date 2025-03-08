import { createEffect, createSignal, on, Show } from "solid-js";
import * as chrono from 'chrono-node';

import { Autocomplete } from "./Autocomplete.jsx";

import { getSetting } from "./Settings.jsx";

import { apiURL } from "./utils.js";
import { mkShortcut } from "./UiUtils.jsx";

export function ThreadGroup(tprops) {
  if(Object.prototype.toString.call(tprops.thread) === '[object Array]') {
    if(tprops.thread[0].collapsed === undefined) tprops.thread[0].collapsed = true;
    let [collapsed, setCollapsed] = createSignal(tprops.thread[0].collapsed);

    createEffect(on(collapsed, () => {
      tprops.thread[0].collapsed = collapsed();
    }));

    function toggle() {
      setCollapsed(!collapsed());
      if(collapsed()) {
        tprops.setActiveThread(tprops.thread[0].thread_id);
      }
    }

    return (
      <div classList={{
          'thread-group': true,
          'width-100': true,
          'collapsed': collapsed()
        }}
        onToggle={toggle}>
        <For each={tprops.thread}>
          {(t) => <ThreadGroup thread={t} threadListElem={tprops.threadListElem} setActiveThread={tprops.setActiveThread}/>}
        </For>
        <div class="thread-group-expander" onClick={toggle}>
          {collapsed() ? "🞃" : "🞁"}
        </div>
      </div>
    );
  }

  return tprops.threadListElem(tprops);
}

export function Threads(props) {
  const [query, setQuery] = createSignal(),
        [selectedThreads, setSelectedThreads] = createSignal([]),
        [editingTags, setEditingTags] = createSignal(null),
        [showEditingTagModal, setShowEditingTagModal] = createSignal(false),
        [threads, setThreads] = createSignal(data.threads || []),
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

  function makeTagEdits() {
    let affectedThreads = getAffectedThreads();
    if(affectedThreads.length === 0) return;
    const url = apiURL(`api/tag_batch/thread/${encodeURIComponent(affectedThreads.join(' '))}/${encodeURIComponent(editingTags())}`);
    props.sp?.(0);

    fetch(url).then((response) => {
      if(!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      affectedThreads.forEach(affectedThread => {
        const thread = threads().flat().find(t => t.thread_id === affectedThread);
        editingTags().split(' ').map((edit) => {
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
    // eslint-disable-next-line solid/reactivity
    }).finally(() => props.sp?.(1));
  }

  createEffect(on(activeThread, () => {
    document.getElementsByClassName("thread active")[0]?.scrollIntoView({block: "nearest"});
  }));

  createEffect(on(query, () => {
    document.title = query() || "Kukulkan";
  }));

  mkShortcut([["Home"]],
    () => threads().length > 0 && setActiveThread(threads().flat()[0].thread_id)
  );
  mkShortcut([["k"], ["ArrowUp"]],
    () => {
      if(threads().length > 0) {
        let prev = document.querySelector(".thread.active").previousElementSibling;
        if(prev === null) {
          prev = document.querySelector(".thread.active").parentElement.previousElementSibling;
        }
        if(prev.classList.contains("thread-group")) {
          if(prev.classList.contains("collapsed")) {
            prev = prev.firstElementChild;
          } else {
            prev = prev.lastElementChild.previousElementSibling;
          }
        }
        if(prev.classList.contains("thread")) {
          setActiveThread(prev.dataset.id);
        }
      }
    }
  );
  mkShortcut([["j"], ["ArrowDown"]],
    () => {
      if(threads().length > 0) {
        let next = document.querySelector(".thread.active").nextElementSibling;
        if(next === null || next.classList.contains("thread-group-expander") || next.parentElement.classList.contains("collapsed")) {
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
  );
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
    () => {
      if(threads().length > 0) {
        let parent = document.querySelector(".thread.active").parentElement;
        if(parent.classList.contains("thread-group")) {
          parent.dispatchEvent(new CustomEvent("toggle"));
        }
      }
    }
  );

  function openActive() {
    window.open(`/thread?id=${encodeURIComponent(activeThread())}`, getSetting("openInTab"));
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
        setSelectedThreads(curSelThreads.filter((item) => item !== activeThread()));
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
    if(threads().length > 0) {
      setEditingTags("deleted -unread");
      makeTagEdits();
    }
  }

  // eslint-disable-next-line solid/reactivity
  mkShortcut([["Delete"]], deleteActive, true);

  function doneActive() {
    let edits = "-todo",
        affectedThreads = getAffectedThreads();
    if(affectedThreads.length === 0) return;
    affectedThreads.forEach(affectedThread => {
      let due = threads().find(t => t.thread_id === affectedThread)?.tags.find((tag) => tag.startsWith("due:"));
      if(due) edits += " -" + due;
    });
    setEditingTags(edits);
    makeTagEdits();
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

    const firstGroup = groupMap.keys().next().value;
    if(groupMap.size === 1 && groupMap.get(firstGroup).length === affectedThreads.length) {
      // ungroup
      const url = apiURL(`api/tag_batch/thread/${encodeURIComponent(groupMap.get(firstGroup).join(' '))}/-${encodeURIComponent(firstGroup)}`),
            response = await fetch(url);
      if(!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      groupMap.get(firstGroup).forEach(at => {
        const thread = threads().flat().find(t => t.thread_id === at);
        thread.tags = thread.tags.filter(t => t !== firstGroup);
      });
    } else {
      // more than one group selected, assume that we want to create a new group
      // from all threads after removing all exising groups
      if(groupMap.size > 1) {
        groupMap.keys().forEach(async (gt) => {
          const url = apiURL(`api/tag_batch/thread/${encodeURIComponent(groupMap.get(gt).join(' '))}/-${encodeURIComponent(gt)}`),
                response = await fetch(url);
          if(!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
          groupMap.get(gt).forEach(at => {
            const thread = threads().flat().find(t => t.thread_id === at);
            thread.tags = thread.tags.filter(t => t !== gt);
          });
        });
      }

      // group all affected threads
      const url = apiURL(`api/group/${encodeURIComponent(affectedThreads.join(' '))}`);
      props.sp?.(0);

      const response = await fetch(url);
      props.sp?.(1);
      if(!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      const grp = await response.text();
      affectedThreads.forEach(affectedThread => {
        const thread = threads().flat().find(t => t.thread_id === affectedThread);
        thread.tags.push(grp);
      });
    }
    setThreads(JSON.parse(JSON.stringify(threads())));
    setSelectedThreads([]);
  }

  // eslint-disable-next-line solid/reactivity
  mkShortcut([["g"]], groupActive, true);

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
      <props.Threads threads={threads} ThreadGroup={ThreadGroup}
        activeThread={activeThread} setActiveThread={setActiveThread}
        selectedThreads={selectedThreads} setQuery={setQuery} sp={props.sp}
        openActive={openActive} deleteActive={deleteActive} doneActive={doneActive}
        tagActive={tagActive}/>
    </>
  );
}

// vim: tabstop=2 shiftwidth=2 expandtab
