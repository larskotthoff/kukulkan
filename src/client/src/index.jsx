import { render } from "solid-js/web";
import { Route, Router } from "@solidjs/router";

import { Kukulkan } from "./Kukulkan";

render(() => (
    <Router>
      <Route path="/" component={Kukulkan}/>
    </Router>
  ), document.getElementById("root"));

// vim: tabstop=2 shiftwidth=2 expandtab
