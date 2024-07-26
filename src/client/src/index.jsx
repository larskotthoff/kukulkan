import { render } from "solid-js/web";
import { Route, Router } from "@solidjs/router";

import { Kukulkan } from "./Kukulkan.jsx";
import { IndexThread } from "./IndexThread.jsx";
import { TodoThread, sortThreadsByDueDate } from "./TodoThread.jsx";

import { SingleMessage } from "./Message.jsx";

render(() => (
    <Router>
      <Route path="/" component={() => <Kukulkan Thread={IndexThread}/>}/>
      <Route path="/todo" component={() => <Kukulkan Thread={TodoThread} todo={true} sort={sortThreadsByDueDate}/>}/>
      <Route path="/message" component={SingleMessage}/>
    </Router>
  ), document.getElementById("root"));

// vim: tabstop=2 shiftwidth=2 expandtab
