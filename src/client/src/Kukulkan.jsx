import { createEffect, createSignal, createResource, ErrorBoundary, For, Show, Suspense, onMount, onCleanup } from "solid-js";

import { Alert, Box, Chip, Divider, Grid, LinearProgress, TextField, Typography } from "@suid/material";
import { ThemeProvider } from "@suid/material/styles";
import AttachFile from "@suid/icons-material/AttachFile";
import Create from "@suid/icons-material/Create";
import Forward from "@suid/icons-material/Forward";
import Gesture from "@suid/icons-material/Gesture";
import Reply from "@suid/icons-material/Reply";

import invert from 'invert-color';

import "./Kukulkan.css";
import { apiURL, getColor, hiddenTags, renderDateNum, theme } from "./utils.js";

async function fetchThreads(query) {
  if(query === null) return [];
  const response = await fetch(apiURL(`api/query/${query}`));
  return await response.json();
}

export function Kukulkan() {
  const [searchParams] = createSignal(window.location.search),
        [query] = createSignal((new URLSearchParams(searchParams())).get("query")),
        [searchText, setSearchText] = createSignal(query()),
        [threads] = createResource(query, fetchThreads);
  
  document.title = query() || "Kukulkan";

  return (
    <>
      <ThemeProvider theme={theme}>
        <Grid container spacing={2} justifyContent="space-around" alignItems="center">
          <Grid item width="80%">
            <TextField
              className="kukulkan-queryBox"
              name="search"
              variant="standard"
              fullWidth
              autoFocus
              margin="normal"
              value={searchText() || ""}
              onChange={(ev, value) => setSearchText(value) }
              onKeyPress={(ev) => {
                if(ev.key === 'Enter') {
                  const sp = new URLSearchParams(searchParams());
                  sp.set("query", searchText());
                  window.location.search = sp.toString();
                }
              }}
            />
          </Grid>
          <Grid item>
            <a href="/write" target="_blank" rel="noreferrer">
              <Create/>
            </a>
          </Grid>
        </Grid>
        <Suspense fallback={<LinearProgress/>}>
          <ErrorBoundary fallback={<Alert severity="error">Error querying backend: {threads.error.message}</Alert>}>
            <Show when={threads()}>
              <Typography align="right">{threads().length}  threads.</Typography>
              <Grid container spacing={.5} width="95%" class="centered">
                <For each={threads()}>
                  {(thread) => (
                    <>
                    <Grid item container xs={12} sm={3} lg={2} justifyContent="space-between">
                      <Grid item>
                        {renderDateNum(thread)}
                      </Grid>
                      <Grid item class="centered">
                        {thread.tags.includes("attachment") && <AttachFile/>}
                        {thread.tags.includes("signed") && <Gesture/>}
                        {thread.tags.includes("replied") && <Reply/>}
                        {thread.tags.includes("passed") && <Forward/>}
                      </Grid>
                    </Grid>
                    <Grid item xs={12} sm={9} lg={3}>
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
                      <For each={thread.tags.filter(tag => !hiddenTags.includes(tag)).sort()}>
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
