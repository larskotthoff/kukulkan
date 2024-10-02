import { createSignal, For } from 'solid-js';
import { Grid } from "@suid/material";
import { ColorChip } from "./ColorChip.jsx";
import { Autocomplete } from "./Autocomplete.jsx";
import Create from "@suid/icons-material/Create";

import { renderDateNumThread } from "./utils.js";
import { simulateKeyPress } from "./UiUtils.jsx";

export const SearchThreads = (props) => {
  const [searchParams] = createSignal(window.location.search),
        [query] = createSignal((new URLSearchParams(searchParams())).get("query")),
        [searchText, setSearchText] = createSignal(query());

  props.setQuery(query());

  let opts = ["tag:unread", "tag:todo", "date:today"],
      qs = localStorage.getItem("queries");
  if(qs !== null) {
    qs = JSON.parse(qs);
    if(searchText()) {
      qs.unshift(searchText());
      qs = [...new Set(qs)];
      // store up to 20 most recent queries
      localStorage.setItem("queries", JSON.stringify(qs.slice(0, 20)));
    }
    opts = [...new Set(opts.concat(qs))];
  }
  
  const QueryBox = () => {
    return (
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
            return props.allTags().filter((t) => t.startsWith(last)).map((t) => [...pts, t].join(':'));
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
    );
  };

  return (
    <Grid container width="95%" class="centered">
      <Grid container item class="centered" width="80%" spacing={2}>
        <Grid item xs={11}><QueryBox/></Grid>
        <Grid item xs={1}>
          <a href="/write" target="_blank" rel="noreferrer">
            <Create/>
          </a>
        </Grid>
      </Grid>
      <Grid item xs={12} align="right">{props.threads().length} thread{props.threads().length === 1 ? "" : "s"}.</Grid>
        <For each={props.threads()}>
          {(thread, index) =>
            <Grid item container padding={.3} class={{
                'kukulkan-thread': true,
                'active': index() === props.activeThread(),
                'selected': props.selectedThreads().indexOf(index()) !== -1
              }}
              onClick={() => {
                props.setActiveThread(index());
                simulateKeyPress('Enter');
              }}
            >
              <Grid item xs={12} sm={2} lg={1}>
                {renderDateNumThread(thread)}
              </Grid>
              <Grid item xs={12} sm={10} lg={4}>
                <For each={thread.authors.split(/\s*[,|]\s*/)}>
                  {(author) => <ColorChip value={author}/>}
                </For>
              </Grid>
              <Grid item xs={12} sm={9} lg={5}>
                {thread.subject}
              </Grid>
              <Grid item xs={12} sm={2}>
                <For each={thread.tags.sort()}>
                  {(tag) => <ColorChip value={tag}/>}
                </For>
              </Grid>
            </Grid>
          }
      </For>
    </Grid>
  );
};

// vim: tabstop=2 shiftwidth=2 expandtab