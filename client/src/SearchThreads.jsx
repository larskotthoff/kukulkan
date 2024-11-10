import { createSignal, For } from 'solid-js';

import { ColorChip } from "./ColorChip.jsx";
import { Autocomplete } from "./Autocomplete.jsx";

import { getSetting } from "./Settings.jsx";

import { apiURL, delayedDebouncedFetch, renderDateNumThread } from "./utils.js";
import { simulateKeyPress, Icon, Create, Settings } from "./UiUtils.jsx";

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
            const opts = await delayedDebouncedFetch(apiURL(`api/email/${encodeURIComponent(last)}`), 200, props.sp);
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

  return (
    <div class="centered vertical-stack" style={{ 'width': "95%" }}>
      <div class="centered horizontal-stack" style={{ 'width': "80%" }}>
        <QueryBox/>
        <a href="/write" target={getSetting("openInTab")} rel="noreferrer">
          <Icon icon={Create}/>
        </a>
      </div>
      <a href="/settings" class="top-right" target={getSetting("openInTab")} rel="noreferrer">
        <Icon icon={Settings}/>
      </a>
      <div class="horizontal-stack justify-end width-100">{props.threads().length} thread{props.threads().length === 1 ? "" : "s"}.</div>
      <For each={props.threads()}>
        {(thread, index) =>
          <div classList={{
              'thread': true,
              'width-100': true,
              'active': index() === props.activeThread(),
              'selected': props.selectedThreads().indexOf(index()) !== -1
            }}
            onClick={() => {
              props.setActiveThread(index());
              simulateKeyPress('Enter');
            }}
          >
            <div class="small">
              {renderDateNumThread(thread, false)}
            </div>
            <div class="large">
              {renderDateNumThread(thread)}
            </div>
            <div class="small">
              <For each={thread.authors}>
                {(author) => <ColorChip value={author.split(/\s/)[0]}/>}
              </For>
            </div>
            <div class="large">
              <For each={thread.authors}>
                {(author) => <ColorChip value={author}/>}
              </For>
            </div>
            <div style={{ 'grid-column': "span 2" }}>
              {thread.subject}
            </div>
            <div class="large">
              <For each={thread.tags.sort()}>
                {(tag) => <ColorChip value={tag}/>}
              </For>
            </div>
          </div>
        }
      </For>
    </div>
  );
}

// vim: tabstop=2 shiftwidth=2 expandtab
