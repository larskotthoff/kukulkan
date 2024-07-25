import { render } from "solid-js/web";
import { Route, Router } from "@solidjs/router";

import { Kukulkan } from "./Kukulkan.jsx";
import { IndexThread } from "./IndexThread.jsx";

render(() => (
    <Router>
      <Route path="/" component={() => <Kukulkan Thread={IndexThread}/>}/>
    </Router>
  ), document.getElementById("root"));

// vim: tabstop=2 shiftwidth=2 expandtab
