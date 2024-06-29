import { createEffect, createSignal, createResource, ErrorBoundary, For, Show, Suspense, onMount, onCleanup } from "solid-js";

import { Alert, Box, Chip, Divider, Grid, LinearProgress, Stack, Typography } from "@suid/material";
import { Autocomplete } from "./Autocomplete.jsx";
import { ThemeProvider } from "@suid/material/styles";
import Create from "@suid/icons-material/Create";

import invert from 'invert-color';

import "./Kukulkan.css";
import { apiURL, getColor, renderDateNum, theme } from "./utils.js";

async function fetchThreads(query) {
  if(query === null) return [];
  const response = await fetch(apiURL(`api/query/${query}`));
  return await response.json();
}

async function fetchAllTags() {
  const response = await fetch(apiURL(`api/tags/`));
  return await response.json();
}

export function Kukulkan() {
  const [searchParams] = createSignal(window.location.search),
        [query] = createSignal((new URLSearchParams(searchParams())).get("query")),
        [searchText, setSearchText] = createSignal(query()),
        [threads] = createResource(query, fetchThreads),
        [allTags] = createResource(fetchAllTags);

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

  return (
    <>
      <ThemeProvider theme={theme}>
        <Stack direction="row" class="centered" width="80%" spacing={2}>
          <Box component="form" width="100%" noValidate onSubmit={(e) => {
            e.preventDefault();
            const sp = new URLSearchParams(searchParams());
            sp.set("query", searchText());
            window.location.search = sp.toString();
          }}>
            <Autocomplete
              className="kukulkan-queryBox"
              name="search"
              variant="outlined"
              fullWidth
              autoFocus
              margin="normal"
              text={searchText}
              setText={setSearchText}
              getOptions={(text) => {
                let pts = text.split(':'),
                    last = pts.pop();
                if(pts.length > 0 && pts[pts.length - 1].endsWith("tag") && last.length > 0) {
                  // autocomplete possible tag
                  return allTags().filter((t) => t.startsWith(last)).map((t) => pts.join(':') + ":" + t );
                } else {
                  return opts;
                }
              }}
            />
          </Box>
          <a href="/write" target="_blank" rel="noreferrer">
            <Create/>
          </a>
        </Stack>
        <Suspense fallback={<LinearProgress/>}>
          <ErrorBoundary fallback={<Alert severity="error">Error querying backend: {threads.error.message}</Alert>}>
            <Show when={threads()}>
              <Typography align="right">{threads().length}  threads.</Typography>
              <Grid container spacing={.5} width="95%" class="centered">
                <For each={threads()}>
                  {(thread) => (
                    <>
                    <Grid item xs={12} sm={2} lg={1}>
                      {renderDateNum(thread)}
                    </Grid>
                    <Grid item xs={12} sm={10} lg={4}>
                      <For each={thread.authors.split(/\s*[,|]\s*/)}>
                        {(author) => (
                          <Chip label={author}
                            class="chip"
                            style={{ 'background-color': `${getColor(author)}`, color: `${invert(getColor(author), true)}` }}/>
                        )}
                      </For>
                    </Grid>
                    <Grid item xs={12} sm={9} lg={5}>
                      {thread.subject}
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <For each={thread.tags.sort()}>
                        {(tag) => (
                          <Chip label={tag}
                            class="chip"
                            style={{ 'background-color': `${getColor(tag)}`, color: `${invert(getColor(tag), true)}` }}/>
                        )}
                      </For>
                    </Grid>
                    <Grid item xs={12}>
                      <Divider/>
                    </Grid>
                    </>
                  )}
                </For>
              </Grid>
            </Show>
          </ErrorBoundary>
        </Suspense>
      </ThemeProvider>
    </>
  );
}

// vim: tabstop=2 shiftwidth=2 expandtab
