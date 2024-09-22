import { render } from "solid-js/web";
import { Route, Router } from "@solidjs/router";

import { createSignal, ErrorBoundary, Show } from "solid-js";
import { Alert, LinearProgress } from "@suid/material";

import { Kukulkan } from "./Kukulkan.jsx";
import { IndexThreads } from "./IndexThreads.jsx";
import { TodoThreads } from "./TodoThreads.jsx";
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
        <Route path="/" component={() => <Kukulkan Threads={IndexThreads} sl={setLoading}/>}/>
        <Route path="/todo" component={() => <Kukulkan Threads={TodoThreads} todo={true} sl={setLoading}/>}/>
        <Route path="/thread" component={() => <Thread sl={setLoading}/>}/>
        <Route path="/message" component={() => <FetchedMessage sl={setLoading}/>}/>
        <Route path="/write" component={() => <Write sl={setLoading}/>}/>
      </Router>
    </ErrorBoundary>
  </>
  );
}, document.getElementById("root"));

// vim: tabstop=2 shiftwidth=2 expandtab
