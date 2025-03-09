import { createSignal, For } from 'solid-js';

import { ColorChip } from "./ColorChip.jsx";
import { Autocomplete } from "./Autocomplete.jsx";

import { getSetting } from "./Settings.jsx";

import { apiURL, delayedDebouncedFetch, renderDateNumThread, splitAddressHeader } from "./utils.js";
import { handleSwipe, Icon, Create, Settings, Tag, Trash, wideNarrowObserver } from "./UiUtils.jsx";

export function SearchThreads(props) {
  const searchParams = window.location.search,
        query = (new URLSearchParams(searchParams)).get("query"),
        [searchText, setSearchText] = createSignal(query);

  // eslint-disable-next-line solid/reactivity
  props.setQuery(query);

  let opts = ["tag:unread", "tag:todo", "date:today"],
      qs = localStorage.getItem("queries");

  if(qs !== null) {
    qs = JSON.parse(qs);
  } else {
    qs = [];
  }

  // eslint-disable-next-line solid/reactivity
  if(searchText()) {
    // eslint-disable-next-line solid/reactivity
    qs.unshift(searchText());
    qs = [...new Set(qs)];
    localStorage.setItem("queries", JSON.stringify(qs.slice(0, getSetting("numQueries"))));
  }

  opts = [...new Set(opts.concat(qs))];
  
  function QueryBox() {
    return (
      <Autocomplete
        id="query-box"
        name="search"
        class="input-wide margin"
        text={searchText}
        setText={setSearchText}
        onFocus={(e) => e.target.select()}
        // eslint-disable-next-line solid/reactivity
        getOptions={async (text) => {
          let pts = text.split(':'),
              last = pts.pop();
          if(pts.length > 0 && pts[pts.length - 1].endsWith("tag") && last.length > 0) {
            // autocomplete possible tag
            return data.allTags.filter((t) => t.startsWith(last)).map((t) => [...pts, t].join(':'));
          } else if(pts.length > 0 &&
                      (pts[pts.length - 1].endsWith("from") || pts[pts.length - 1].endsWith("to")) &&
                      last.length > 2) {
            const opts = await delayedDebouncedFetch(apiURL(`api/email/${encodeURIComponent(last)}`), 1000, props.sp);
            return opts.map((t) => [...pts, t].join(':'));
          } else {
            return opts.filter((t) => t.includes(text));
          }
        }}
        handleKey={(ev) => {
          if(ev.code === 'Enter' || ev.key === 'Enter') {
            const sp = new URLSearchParams(searchParams);
            sp.set("query", searchText());
            window.location.search = sp.toString();
          }
        }}
      />
    );
  }

  // eslint-disable-next-line solid/reactivity
  handleSwipe(document.body, (el) => el.closest(".thread"), props.deleteActive, Trash, props.tagActive, Tag);

  function threadListElem(tprops) {
    // eslint-disable-next-line solid/reactivity
    const authors = tprops.thread.authors.map(splitAddressHeader),
          // eslint-disable-next-line solid/reactivity
          dateNum = renderDateNumThread(tprops.thread);
    return (
      <div classList={{
          'thread': true,
          'width-100': true,
          'active': tprops.thread.thread_id === props.activeThread(),
          'selected': props.selectedThreads().indexOf(tprops.thread.thread_id) !== -1
        }}
        data-id={tprops.thread.thread_id}
        onClick={() => {
          props.setActiveThread(tprops.thread.thread_id);
          props.openActive();
        }}
        onTouchStart={() => {
          props.setActiveThread(tprops.thread.thread_id);
        }}
      >
        <div ref={e => wideNarrowObserver?.observe(e)}>
          <div class="narrow">
            {dateNum[0]}
          </div>
          <div class="wide">
            {dateNum.join(" ")}
          </div>
        </div>
        <div class="grid-authors" ref={e => wideNarrowObserver?.observe(e)}>
          <div class="narrow">
            <For each={authors}>
              {(author) => <ColorChip key={author[0]} value={author[2]}/>}
            </For>
          </div>
          <div class="wide">
            <For each={authors}>
              {(author) => <ColorChip key={author[0]} value={author[1]}/>}
            </For>
          </div>
        </div>
        <div class="grid-subject">
          {tprops.thread.subject}
        </div>
        <div>
          <For each={tprops.thread.tags.sort()}>
            {(tag) => <ColorChip class={tag.startsWith("grp:") ? "hide-if-narrow" : ""} value={tag}/>}
          </For>
        </div>
      </div>
    );
  }

  return (
    <div class="centered clipped vertical-stack" style={{ 'width': "95%" }}>
      <div class="centered horizontal-stack" style={{ 'width': "80%" }}>
        <QueryBox/>
        <a href="/write" target={getSetting("openInTab")} rel="noreferrer">
          <Icon icon={Create}/>
        </a>
      </div>
      <a href="/settings" class="top-right" target={getSetting("openInTab")} rel="noreferrer">
        <Icon icon={Settings}/>
      </a>
      <div class="horizontal-stack justify-end width-100">{props.threads().length} thread group{props.threads().length === 1 ? "" : "s"}.</div>
      <For each={props.threads()}>
        {(thread) => <props.ThreadGroup thread={thread} threadListElem={threadListElem} setActiveThread={props.setActiveThread}/>}
      </For>
    </div>
  );
}

// vim: tabstop=2 shiftwidth=2 expandtab
