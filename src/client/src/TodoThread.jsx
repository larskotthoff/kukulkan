import { For } from 'solid-js';
import { Grid } from "@suid/material";
import { ColorChip } from "./ColorChip.jsx";

import { formatDuration } from "./utils.js";
import { simulateKeyPress } from "./UiUtils.jsx";

function dateFromDue(due) {
  const dateComponents = due.split(':')[1].split('-'),
        year = parseInt(dateComponents[0]),
        month = parseInt(dateComponents[1]) - 1,
        day = parseInt(dateComponents[2]);
  return new Date(year, month, day);
}

export const sortThreadsByDueDate = (a, b) => {
  const dueA = a.tags.find((tag) => tag.startsWith("due:")),
        dueB = b.tags.find((tag) => tag.startsWith("due:"));

  if(dueA === undefined && dueB === undefined) return 0;
  if(dueA === undefined && dueB !== undefined) return 1;
  if(dueA !== undefined && dueB === undefined) return -1;

  const dueDateA = dateFromDue(dueA),
        dueDateB = dateFromDue(dueB);

  return dueDateA - dueDateB;
};

function processDueDate(thread) {
  const due = thread.tags.find((tag) => tag.startsWith("due:"));
  if(due) {
    const dueDate = dateFromDue(due);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if(dueDate < today) return [ true, "overdue!" ];
    else if(dueDate.getTime() === today.getTime()) return [ true, "今日" ];
    else if(dueDate.getTime() === tomorrow.getTime()) return [ false, "明日" ];
    else return [ false, formatDuration(today, dueDate) ];
  } else {
    return [ false, "" ];
  }
}

export const TodoThread = (props) => {
  const [ isDue, dueDuration ] = processDueDate(props.thread);

  return (
    <Grid item container padding={.3} class={{
        'kukulkan-thread': true,
        'active': props.index() === props.activeThread(),
        'selected': props.selectedThreads().indexOf(props.index()) !== -1,
        'due': isDue
      }}
      onClick={() => {
        props.setActiveThread(props.index());
        simulateKeyPress('Enter');
      }}
    >
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
      <Grid item xs={12} sm={2} lg={1}>
        {dueDuration}
      </Grid>
    </Grid>
  );
};

// vim: tabstop=2 shiftwidth=2 expandtab
