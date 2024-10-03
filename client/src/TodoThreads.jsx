import { For, Show } from 'solid-js';
import { Box, Grid, Stack } from "@suid/material";
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

export const TodoThreads = (props) => {
  props.setQuery("tag:todo");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const threads = props.threads().sort(sortThreadsByDueDate),
        dueMap = {};

  function processDueDate(thread, index) {
    const due = thread.tags.find((tag) => tag.startsWith("due:"));
    if(due) {
      const dueDate = dateFromDue(due);
      if(dueMap[dueDate] === undefined) {
        dueMap[dueDate] = [index];
      } else {
        dueMap[dueDate].push(index);
      }

      if(dueDate < today) return [ dueDate, "overdue!" ];
      else if(dueDate.getTime() === today.getTime()) return [ dueDate, "今日" ];
      else if(dueDate.getTime() === tomorrow.getTime()) return [ dueDate, "明日" ];
      else return [ dueDate, formatDuration(today, dueDate) ];
    } else {
      return [ null, "" ];
    }
  }

  // claude helped with this
  function getDaysBetweenDates(startDate, endDate) {
    const dates = [],
          currentDate = new Date(startDate);

    while(currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  }

  const dues = threads.map(processDueDate),
        dueDates = dues.map(d => d[0]).filter(x => x),
        earliest = new Date(Math.min(...(dueDates.concat(today)))),
        latest = new Date(Math.max(...dueDates));

  return (
    <Stack direction="row" class="centered" spacing={2}>
      <Show when={dueDates.length > 0}>
        <Grid container item class="calendar">
          <For each={getDaysBetweenDates(earliest, latest)}>
            {(day, index) =>
              <Grid data-testid={day.toDateString()} container item columnSpacing={1}>
                <Grid item xs={9} class={{
                      'today': JSON.stringify(day) === JSON.stringify(today),
                      'weekend': [0, 6].includes(day.getDay()),
                      'full-width-end': true
                    }}>
                  {((day.getDate() === 1 && day.getMonth() === 0) || index() === 0 ? day.getFullYear() : "") + " "}
                  {(day.getDate() === 1 || index() === 0 ? day.toLocaleString('default', { month: 'short' }) : "") + " "}
                  {day.getDate().toString().padStart(2, '0')}
                </Grid>
                <Grid item xs={3} style={{'text-align': 'left'}}>
                  <For each={dueMap[day]}>
                    {dueindex =>
                      <Box class="calendar-box" onClick={() => props.setActiveThread(dueindex)}/>
                    }
                  </For>
                </Grid>
              </Grid>
            }
          </For>
        </Grid>
      </Show>
      <Grid container item style={{'margin-bottom': 'auto'}}>
        <For each={threads}>
          {(thread, index) =>
            <Grid item container padding={.3} class={{
                'kukulkan-thread': true,
                'active': index() === props.activeThread(),
                'selected': props.selectedThreads().indexOf(index()) !== -1,
                'due': dues[index()][0] ? dues[index()][0] < tomorrow : false
              }}
              onClick={() => {
                props.setActiveThread(index());
                simulateKeyPress('Enter');
              }}
              onmouseenter={() => {
                document.getElementsByClassName("calendar-box")[index()]?.classList.add("highlight");
                document.getElementsByClassName("calendar-box")[index()]?.scrollIntoView({block: "nearest"});
              }}
              onmouseleave={() => {
                document.getElementsByClassName("calendar-box")[index()]?.classList.remove("highlight");
              }}
            >
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
              <Grid item xs={12} sm={2} lg={1}>
                {dues[index()][1]}
              </Grid>
            </Grid>
          }
        </For>
      </Grid>
    </Stack>
  );
};

// vim: tabstop=2 shiftwidth=2 expandtab
