import { render } from "solid-js/web";
import { Route, Router } from "@solidjs/router";

import { createSignal, ErrorBoundary, Show } from "solid-js";
import { Alert, LinearProgress } from "@suid/material";

import { Kukulkan } from "./Kukulkan.jsx";
import { IndexThread } from "./IndexThread.jsx";
import { TodoThread, sortThreadsByDueDate } from "./TodoThread.jsx";
import { Thread } from "./Thread.jsx";
import { FetchedMessage } from "./Message.jsx";
import { Write } from "./Write.jsx";

render(() => {
  const [loading, setLoading] = createSignal(false);

  return (
  <>
    <Show when={loading()}>
      <LinearProgress spacing={1}/>
    </Show>
    <ErrorBoundary fallback={(error) => <Alert severity="error">Error: {error}<pre>{error.stack}</pre></Alert>}>
      <Router>
        <Route path="/" component={() => <Kukulkan Thread={IndexThread} sl={setLoading}/>}/>
        <Route path="/todo" component={() => <Kukulkan Thread={TodoThread} todo={true} sort={sortThreadsByDueDate} sl={setLoading}/>}/>
        <Route path="/thread" component={() => <Thread sl={setLoading}/>}/>
        <Route path="/message" component={() => <FetchedMessage sl={setLoading}/>}/>
        <Route path="/write" component={() => <Write sl={setLoading}/>}/>
      </Router>
    </ErrorBoundary>
  </>
  );
}, document.getElementById("root"));

// vim: tabstop=2 shiftwidth=2 expandtab
