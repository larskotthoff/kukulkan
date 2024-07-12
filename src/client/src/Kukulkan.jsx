import { createEffect, createSignal, createResource, ErrorBoundary, For, Show, Suspense, onMount, onCleanup } from "solid-js";

import { Alert, Box, Chip, Divider, Grid, LinearProgress, Modal, Stack, Typography } from "@suid/material";
import { Autocomplete } from "./Autocomplete.jsx";
import { ThemeProvider } from "@suid/material/styles";
import Create from "@suid/icons-material/Create";

import invert from 'invert-color';

import "./Kukulkan.css";
import { apiURL, getColor, mkShortcut, renderDateNum, simulateKeyPress, theme } from "./utils.js";

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
        [threads, { mutate }] = createResource(query, fetchThreads),
        [activeThread, setActiveThread] = createSignal(0),
        [selectedThreads, setSelectedThreads] = createSignal([]),
        [editingTags, setEditingTags] = createSignal(null),
        [showEditingTagModal, setShowEditingTagModal] = createSignal(false),
        [allTags] = createResource(fetchAllTags);

  createEffect(() => {
    activeThread();
    if(document.getElementsByClassName("kukulkan-thread active")[0])
      document.getElementsByClassName("kukulkan-thread active")[0].scrollIntoView({block: "nearest"});
  });

  createEffect(() => {
    if(showEditingTagModal()) {
      document.getElementById("kukulkan-editTagBox").focus();
    }
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
      let thread = JSON.parse(JSON.stringify(threads()[affectedThread]));
      editingTags().split(' ').forEach(edit => {
        let tags = thread.tags;
        if(edit[0] === '-') {
          fetch(apiURL(`api/tag/remove/thread/${thread.thread_id}/${edit.substring(1)}`))
            .catch((error) => console.warn(error));
            thread.tags = tags.filter(t => t !== edit.substring(1));
        } else {
          fetch(apiURL(`api/tag/add/thread/${thread.thread_id}/${edit}`))
            .catch((error) => console.warn(error));
            tags.push(edit);
        }
        threads()[affectedThread].tags = tags;
      });
      mutate([...threads().slice(0, affectedThread), thread, ...threads().slice(affectedThread + 1)]);
    });
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
    () => { if(threads()[activeThread()]) window.open('/thread?id=' + threads()[activeThread()].thread_id, '_blank') }
  );

  document.addEventListener('keydown', function(event) {
    if(event.code === 'Space') {
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
    () => document.getElementById("kukulkan-queryBox").focus(),
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
              id="kukulkan-queryBox"
              name="search"
              variant="outlined"
              fullWidth
              margin="normal"
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
            />
          </Box>
          <a href="/write" target="_blank" rel="noreferrer">
            <Create/>
          </a>
        </Stack>
        <Suspense fallback={<LinearProgress/>}>
          <ErrorBoundary fallback={threads.error && <Alert severity="error">Error querying backend: {threads.error.message}</Alert>}>
            <Show when={threads()}>
              <Typography align="right">{threads().length}  threads.</Typography>
              <Grid container width="95%" class="centered">
                <For each={threads()}>
                  {(thread, index) => (
                    <Grid item container padding={.3} class={{
                        'kukulkan-thread': true,
                        'active': index() === activeThread(),
                        'selected': selectedThreads().indexOf(index()) !== -1
                      }}
                      onClick={(e) => {
                        setActiveThread(index());
                        simulateKeyPress('Enter');
                      }}
                    >
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
                    </Grid>
                  )}
                </For>
              </Grid>
              <Modal open={showEditingTagModal()} onClose={() => { setShowEditingTagModal(false); setEditingTags(""); }} BackdropProps={{timeout: 0}}>
                <Autocomplete
                  id="kukulkan-editTagBox"
                  name="editTags"
                  variant="outlined"
                  fullWidth
                  margin="normal"
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
                  onKeyPress={(ev) => {
                    if(ev.code === 'Enter') {
                      setShowEditingTagModal(false);
                      // sad, but true
                      makeTagEdits();
                    }
                  }}
                />
              </Modal>
            </Show>
          </ErrorBoundary>
        </Suspense>
      </ThemeProvider>
    </>
  );
}

// vim: tabstop=2 shiftwidth=2 expandtab
