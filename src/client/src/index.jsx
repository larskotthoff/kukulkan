import { createEffect, createSignal, createResource, ErrorBoundary, For, Show, Suspense, onMount, onCleanup } from "solid-js";
import { render } from "solid-js/web";
import { Route, Router } from "@solidjs/router";

import { Alert, Box, Chip, Grid, LinearProgress, TextField, Typography } from "@suid/material";
import AttachFile from "@suid/icons-material/AttachFile";
import Create from "@suid/icons-material/Create";
import Forward from "@suid/icons-material/Forward";
import Gesture from "@suid/icons-material/Gesture";
import Reply from "@suid/icons-material/Reply";

import invert from 'invert-color';

import "./Kukulkan.css";

import { createTheme, ThemeProvider } from "@suid/material/styles";
const theme = createTheme({
  palette: {
    primary: {
      main: '#558b2f',
    },
    secondary: {
      main: '#ffecb3',
    },
  },
});

const hiddenTags = ["attachment", "replied", "sent", "passed", "signed"];

// https://stackoverflow.com/questions/36721830/convert-hsl-to-rgb-and-hex
function hslToHex(h, s, l) {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');   // convert to Hex and prefix "0" if needed
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// https://stackoverflow.com/questions/3426404/create-a-hexadecimal-colour-based-on-a-string-with-javascript
function getColor(stringInput) {
  let stringUniqueHash = [...stringInput].reduce((acc, char) => {
    return char.charCodeAt(0) + acc;
  }, 0);
  return hslToHex(stringUniqueHash % 360, 95, 40);
}

// https://stackoverflow.com/questions/822452/strip-html-from-text-javascript
function strip(html) {
  let doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || "";
}

function extractEmailsSort(string) {
  return string.match(/([^ <>]+@[^ >]+)/g).join('').split('').sort().join('');
}

function filterTagsColor(tags) {
  return tags.filter(i => { return i !== "replied" && i !== "sent" && i !== "signed" && i !== "passed" && i !== "attachment"; });
}

function filterSubjectColor(subject) {
  return subject.replace(new RegExp('^( *(RE|FWD|FW|AW) *: *)+', "igm"), "");
}

function padZ(number) {
  return ("" + number).padStart(2, "0");
}

function formatDate(date) {
  let now = new Date(),
      time = padZ(date.getHours()) + ":" + padZ(date.getMinutes());
  if(date.setHours(0, 0, 0, 0) === now.setHours(0, 0, 0, 0)) { // today
    return time;
  } else if((now - date) / (7 * 24 * 60 * 60 * 1000) < 1) { // less than one week ago
    return date.toLocaleDateString([], { weekday: 'short' }) + " " + time;
  } else if(date.getFullYear() === now.getFullYear()) { // this year
    return padZ(date.getDate()) + "/" + padZ(date.getMonth() + 1) + " " + time;
  } else {
    return date.toLocaleDateString() + " " + time;
  }
}

function formatDuration(from, to) {
  let diff = to - from;
  if(diff < (91 * 60 * 1000)) {
    return (Math.round(diff / (60 * 1000))) + "分";
  } if(diff < (48 * 60 * 60 * 1000)) {
    return (Math.round(diff / (60 * 60 * 1000))) + "時";
  } if(diff < (14 * 24 * 60 * 60 * 1000)) {
    return (Math.round(diff / (24 * 60 * 60 * 1000))) + "日";
  } if(diff < (12 * 7 * 24 * 60 * 60 * 1000)) {
    return (Math.round(diff / (7 * 24 * 60 * 60 * 1000))) + "週";
  } if(diff < (500 * 24 * 60 * 60 * 1000)) {
    return (Math.round(diff / (30 * 24 * 60 * 60 * 1000))) + "月";
  } else {
    return (Math.round(diff / (365.25 * 24 * 60 * 60 * 1000))) + "年";
  }
}

function renderDateNum(thread) {
    let res = formatDate(new Date(thread.newest_date * 1000));
    if(thread.total_messages > 1) {
      res += " (" + thread.total_messages + "/" +
        formatDuration(new Date(thread.oldest_date * 1000), new Date(thread.newest_date * 1000)) + ")";
    }
    return res;
}

function apiURL(suffix) {
    return window.location.protocol + "//" + window.location.hostname + ":5000/" + suffix;
}

const fetchThreads = async (query) => {
  if(query === null) return [];
  const response = await fetch(apiURL(`api/query/${query}`));
  return await response.json();
}

const Kukulkan = () => {
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
              <Grid container spacing={.5}>
                <For each={threads()}>
                  {(thread) => (
                    <>
                    <Grid item container xs={1} justifyContent="space-between">
                      <Grid item>
                        {renderDateNum(thread)}
                      </Grid>
                      <Grid item>
                        {thread.tags.includes("attachment") && <AttachFile/>}
                        {thread.tags.includes("signed") && <Gesture/>}
                        {thread.tags.includes("replied") && <Reply/>}
                        {thread.tags.includes("passed") && <Forward/>}
                      </Grid>
                    </Grid>
                    <Grid item xs={3}>
                      <For each={thread.tags.filter(tag => !hiddenTags.includes(tag)).sort()}>
                        {(tag) => (
                          <Chip label={tag}
                            class="chip"
                            style={{ 'background-color': `${getColor(tag)}`, color: `${invert(getColor(tag), true)}` }}/>
                        )}
                      </For>
                    </Grid>
                    <Grid item xs={5}>
                      {thread.subject}
                    </Grid>
                    <Grid item xs={3}>
                      <For each={thread.authors.split(/\s*[,|]\s*/)}>
                        {(author) => (
                          <Chip label={author}
                            class="chip"
                            style={{ 'background-color': `${getColor(author)}`, color: `${invert(getColor(author), true)}` }}/>
                        )}
                      </For>
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
};

render(
    () => (
        <Router>
            <Route path="/" component={Kukulkan} />
        </Router>
    ),
    document.getElementById("root"));

// vim: tabstop=2 shiftwidth=2 expandtab
