import { render } from "solid-js/web";
import { Route, Router } from "@solidjs/router";

import { ErrorBoundary } from "solid-js";
import { Alert } from "@suid/material";

import { Kukulkan } from "./Kukulkan.jsx";
import { IndexThread } from "./IndexThread.jsx";
import { TodoThread, sortThreadsByDueDate } from "./TodoThread.jsx";
import { Thread } from "./Thread.jsx";
import { FetchedMessage } from "./Message.jsx";
import { Write } from "./Write.jsx";

render(() => (
  <ErrorBoundary fallback={(error) => <Alert severity="error">Error: {error}<pre>{error.stack}</pre></Alert>}>
    <Router>
      <Route path="/" component={() => <Kukulkan Thread={IndexThread}/>}/>
      <Route path="/todo" component={() => <Kukulkan Thread={TodoThread} todo={true} sort={sortThreadsByDueDate}/>}/>
      <Route path="/thread" component={Thread}/>
      <Route path="/message" component={FetchedMessage}/>
      <Route path="/write" component={Write}/>
    </Router>
  </ErrorBoundary>
  ), document.getElementById("root"));

// vim: tabstop=2 shiftwidth=2 expandtab
