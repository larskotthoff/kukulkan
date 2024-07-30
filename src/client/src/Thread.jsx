import { createEffect, createSignal, createResource, For, Show } from "solid-js";
import { Grid, LinearProgress } from "@suid/material";

import { Message } from "./Message.jsx";

import "./Kukulkan.css";
import { apiURL, fetchAllTags, mkShortcut } from "./utils.js";

async function fetchThread(id) {
  if(id === null) return null;
  const response = await fetch(apiURL(`api/thread/${encodeURIComponent(id)}`));
  if(!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
  return await response.json();
}

export const Thread = () => {
  const [searchParams] = createSignal(window.location.search),
        [threadId] = createSignal((new URLSearchParams(searchParams())).get("id")),
        [thread] = createResource(threadId(), fetchThread),
        [allTags] = createResource(fetchAllTags),
        [activeMessage, setActiveMessage] = createSignal();

  createEffect(() => {
    setActiveMessage(thread()?.length - 1);
  });

  mkShortcut(["Home"],
    () => setActiveMessage(0)
  );
  mkShortcut(["k"],
    () => setActiveMessage(Math.max(0, activeMessage() - 1))
  );
  mkShortcut(["Shift", "K"],
    () => setActiveMessage(Math.max(0, activeMessage() - 10))
  );
  mkShortcut(["j"],
    () => setActiveMessage(Math.min(thread().length - 1, activeMessage() + 1))
  );
  mkShortcut(["Shift", "J"],
    () => setActiveMessage(Math.min(thread().length - 1, activeMessage() + 10))
  );
  mkShortcut(["End"],
    () => setActiveMessage(thread().length - 1)
  );
  mkShortcut(["0"],
    () => setActiveMessage(thread().length - 1)
  );

  return (
    <>
      <Show when={allTags.state === "ready" && activeMessage() > -1} fallback={<LinearProgress/>}>
        <Grid container direction="column" class="centered">
          <For each={thread()}>
            {(m, i) => <Message msg={m} allTags={allTags()} active={i() === activeMessage()}/>}
          </For>
        </Grid>
      </Show>
    </>
  );
};

// vim: tabstop=2 shiftwidth=2 expandtab
