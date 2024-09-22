import { For } from 'solid-js';
import { Grid } from "@suid/material";
import { ColorChip } from "./ColorChip.jsx";

import { renderDateNumThread } from "./utils.js";
import { simulateKeyPress } from "./UiUtils.jsx";

export const IndexThreads = (props) => {
  return (
    <For each={props.threads}>
      {(thread, index) =>
        <Grid item container padding={.3} class={{
            'kukulkan-thread': true,
            'active': index() === props.activeThread(),
            'selected': props.selectedThreads().indexOf(index()) !== -1
          }}
          onClick={() => {
            props.setActiveThread(index());
            simulateKeyPress('Enter');
          }}
        >
          <Grid item xs={12} sm={2} lg={1}>
            {renderDateNumThread(thread)}
          </Grid>
          <Grid item xs={12} sm={10} lg={4}>
            <For each={thread.authors.split(/\s*[,|]\s*/)}>
              {(author) => <ColorChip value={author}/>}
            </For>
          </Grid>
          <Grid item xs={12} sm={9} lg={5}>
            {thread.subject}
          </Grid>
          <Grid item xs={12} sm={2}>
            <For each={thread.tags.sort()}>
              {(tag) => <ColorChip value={tag}/>}
            </For>
          </Grid>
        </Grid>
      }
    </For>
  );
};

// vim: tabstop=2 shiftwidth=2 expandtab
