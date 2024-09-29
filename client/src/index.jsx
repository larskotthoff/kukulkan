import { render } from "solid-js/web";
import { Route, Router } from "@solidjs/router";

import { createSignal, ErrorBoundary, Show } from "solid-js";
import { Alert, LinearProgress } from "@suid/material";

import { Kukulkan } from "./Kukulkan.jsx";
import { SearchThreads } from "./SearchThreads.jsx";
import { TodoThreads } from "./TodoThreads.jsx";
import { Thread } from "./Thread.jsx";
import { FetchedMessage } from "./Message.jsx";
import { Write } from "./Write.jsx";

render(() => {
  const [progress, setProgress] = createSignal(100);

  return (
  <>
    <Show when={progress() < 100}>
      <LinearProgress variant="determinate" value={progress()} spacing={1}/>
    </Show>
    <ErrorBoundary fallback={(error) => <Alert severity="error">Error: {error}<pre>{error.stack}</pre></Alert>}>
      <Router>
        <Route path="/" component={() => <Kukulkan Threads={SearchThreads} sp={setProgress}/>}/>
        <Route path="/todo" component={() => <Kukulkan Threads={TodoThreads} sp={setProgress}/>}/>
        <Route path="/thread" component={() => <Thread sp={setProgress}/>}/>
        <Route path="/message" component={() => <FetchedMessage sp={setProgress}/>}/>
        <Route path="/write" component={() => <Write sp={setProgress}/>}/>
      </Router>
    </ErrorBoundary>
  </>
  );
}, document.getElementById("root"));

// vim: tabstop=2 shiftwidth=2 expandtab
