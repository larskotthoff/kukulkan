import { For } from 'solid-js';
import { Grid } from "@suid/material";
import { ColorChip } from "./ColorChip.jsx";

import { renderDateNumThread } from "./utils.js";
import { simulateKeyPress } from "./UiUtils.jsx";

export const IndexThread = (props) => {
  return (
    <Grid item container padding={.3} class={{
        'kukulkan-thread': true,
        'active': props.index() === props.activeThread(),
        'selected': props.selectedThreads().indexOf(props.index()) !== -1
      }}
      onClick={() => {
        props.setActiveThread(props.index());
        simulateKeyPress('Enter');
      }}
    >
      <Grid item xs={12} sm={2} lg={1}>
        {renderDateNumThread(props.thread)}
      </Grid>
      <Grid item xs={12} sm={10} lg={4}>
        <For each={props.thread.authors.split(/\s*[,|]\s*/)}>
          {(author) => <ColorChip value={author}/>}
        </For>
      </Grid>
      <Grid item xs={12} sm={9} lg={5}>
        {props.thread.subject}
      </Grid>
      <Grid item xs={12} sm={2}>
        <For each={props.thread.tags.sort()}>
          {(tag) => <ColorChip value={tag}/>}
        </For>
      </Grid>
    </Grid>
  );
};

// vim: tabstop=2 shiftwidth=2 expandtab
