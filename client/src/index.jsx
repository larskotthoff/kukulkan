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

// claude wrote this
function setCacheHeaders() {
  const tomorrow = new Date();
  tomorrow.setHours(24, 0, 0, 0);

  const headers = [
    { httpEquiv: 'Expires', content: tomorrow.toUTCString() },
    { httpEquiv: 'Cache-Control', content: `public, max-age=${Math.floor((tomorrow - Date.now()) / 1000)}` },
    { httpEquiv: 'Last-Modified', content: (new Date()).toUTCString() }
  ];

  // Remove any existing cache control meta tags
  document.head.querySelectorAll('meta[http-equiv]').forEach(tag => {
    if (['Expires', 'Cache-Control', 'Last-Modified'].includes(tag.getAttribute('http-equiv'))) {
      tag.remove();
    }
  });

  // Add new meta tags
  headers.forEach(({ httpEquiv, content }) => {
    const meta = document.createElement('meta');
    meta.setAttribute('http-equiv', httpEquiv);
    meta.setAttribute('content', content);
    document.head.appendChild(meta);
  });
}


render(() => {
  const [progress, setProgress] = createSignal(1);

  setCacheHeaders();

  return (
  <>
    <div style={{
      "width": "100%",
      "height": "5px",
      "background": `linear-gradient(to right, rgba(85, 139, 47, 0.7) ${progress() * 100}%, #fff8e1 ${(1 - progress()) * 100}%)`
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
