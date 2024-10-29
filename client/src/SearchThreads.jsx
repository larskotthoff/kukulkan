import { createSignal, For } from 'solid-js';

import Grid from "@suid/material/Grid";
import Create from "@suid/icons-material/Create";
import Settings from "@suid/icons-material/Settings";

import { ColorChip } from "./ColorChip.jsx";
import { Autocomplete } from "./Autocomplete.jsx";

import { getSetting } from "./Settings.jsx";

import { renderDateNumThread } from "./utils.js";
import { simulateKeyPress } from "./UiUtils.jsx";

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
        variant="standard"
        fullWidth
        text={searchText}
        setText={setSearchText}
        getOptions={(text) => {
          let pts = text.split(':'),
              last = pts.pop();
          if(pts.length > 0 && pts[pts.length - 1].endsWith("tag") && last.length > 0) {
            // autocomplete possible tag
            return props.allTags().filter((t) => t.startsWith(last)).map((t) => [...pts, t].join(':'));
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
    <Grid container width="95%" class="centered">
      <Grid container item class="centered" width="80%" spacing={2}>
        <Grid item xs={11}><QueryBox/></Grid>
        <Grid item xs={1}>
          <a href="/write" target={getSetting("openInTab")} rel="noreferrer">
            <Create/>
          </a>
        </Grid>
      </Grid>
      <a href="/settings" class="top-right" target={getSetting("openInTab")} rel="noreferrer">
        <Settings/>
      </a>
      <Grid item xs={12} align="right">{props.threads().length} thread{props.threads().length === 1 ? "" : "s"}.</Grid>
        <For each={props.threads()}>
          {(thread, index) =>
            <Grid item container class={{
                'thread': true,
                'active': index() === props.activeThread(),
                'selected': props.selectedThreads().indexOf(index()) !== -1
              }}
              onClick={() => {
                props.setActiveThread(index());
                simulateKeyPress('Enter');
              }}
              padding={{xs: 1, sm: 0.5}}
            >
              <Grid item sx={{ display: {xs: 'block', xl: 'none'} }} xs={2} sm={1}>
                {renderDateNumThread(thread, false)}
              </Grid>
              <Grid item sx={{ display: {xs: 'none', xl: 'block'} }} xl={1}>
                {renderDateNumThread(thread)}
              </Grid>
              <Grid item sx={{ display: {xs: 'none', lg: 'block'} }} sm={5} xl={3}>
                <For each={thread.authors.split(/\s*[,|]\s*/)}>
                  {(author) => <ColorChip value={author}/>}
                </For>
              </Grid>
              <Grid item sx={{ display: {xs: 'block', lg: 'none'} }} xs={10} sm={5}>
                <For each={thread.authors.split(/\s*[,|]\s*/)}>
                  {(author) => <ColorChip value={author.split(/\s/)[0]}/>}
                </For>
              </Grid>
              <Grid item xs={12} sm={6} xl={5}>
                {thread.subject}
              </Grid>
              <Grid item sx={{ display: {xs: 'none', xl: 'block'} }} xl={3}>
                <For each={thread.tags.sort()}>
                  {(tag) => <ColorChip value={tag}/>}
                </For>
              </Grid>
            </Grid>
          }
      </For>
    </Grid>
  );
}

// vim: tabstop=2 shiftwidth=2 expandtab
