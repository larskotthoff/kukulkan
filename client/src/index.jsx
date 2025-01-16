import { render } from "solid-js/web";
import { Route, Router } from "@solidjs/router";

import { createSignal, ErrorBoundary } from "solid-js";

import { Alert } from "./Alert.jsx";
import { FetchedMessage } from "./Message.jsx";
import { Kukulkan } from "./Kukulkan.jsx";
import { SearchThreads } from "./SearchThreads.jsx";
import { Settings } from "./Settings.jsx";
import { Thread } from "./Thread.jsx";
import { TodoThreads } from "./TodoThreads.jsx";
import { Write } from "./Write.jsx";
import { getSetting } from "./Settings.jsx";

render(() => {
  const [progress, setProgress] = createSignal(1);

  if(getSetting("showSerpent")) {
    document.getElementsByTagName("body")[0].classList.add("serpent");
  }

  return (
  <>
    <div style={{
      "width": "100%",
      "height": "8px",
      "position": "sticky",
      "top": "0",
      "background": progress() === 1 ? "var(--primary-background)" : `linear-gradient(to right, var(--primary-background-darker) ${Math.max(progress(), 0.01) * 100}%, var(--primary-background) 0%)`
    }}/>
    <ErrorBoundary fallback={(error) => <Alert severity="error">Error: {error}<pre>{error.stack}</pre></Alert>}>
      <Router>
        <Route path="/" component={() => <Kukulkan Threads={SearchThreads} sp={setProgress}/>}/>
        <Route path="/todo" component={() => <Kukulkan Threads={TodoThreads} sp={setProgress}/>}/>
        <Route path="/thread" component={() => <Thread sp={setProgress}/>}/>
        <Route path="/message" component={() => <FetchedMessage sp={setProgress}/>}/>
        <Route path="/write" component={() => <Write sp={setProgress}/>}/>
        <Route path="/settings" component={() => <Settings/>}/>
      </Router>
    </ErrorBoundary>
  </>
  );
}, document.getElementById("root"));

// vim: tabstop=2 shiftwidth=2 expandtab
