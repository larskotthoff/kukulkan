import { createEffect, createSignal, For, on, onMount, Show } from 'solid-js';

import { ColorChip } from "./ColorChip.jsx";
import { ThreadGroup } from "./Threads.jsx";

import { formatDuration, splitAddressHeader } from "./utils.js";
import { handleSwipe, Selection, TaskAlt, wideNarrowObserver } from "./UiUtils.jsx";

function dateFromDue(due) {
  const dateComponents = due.split(':')[1].split('-'),
        year = parseInt(dateComponents[0], 10),
        month = parseInt(dateComponents[1], 10) - 1,
        day = parseInt(dateComponents[2], 10);
  return new Date(year, month, day);
}

function findEarliestDue(threadGroup) {
  let dues = [];
  if(threadGroup.length !== undefined) {
    dues = threadGroup.map(findEarliestDue);
  } else {
    dues = threadGroup.tags.filter((tag) => tag.startsWith("due:"));
  }
  if(dues.length > 0) {
    return dues.sort()[0];
  } else {
    return undefined;
  }
}

export function sortThreadsByDueDate(a, b) {
  const dueA = findEarliestDue(a),
        dueB = findEarliestDue(b);

  if(dueA === undefined && dueB === undefined) return 0;
  if(dueA === undefined && dueB !== undefined) return 1;
  if(dueA !== undefined && dueB === undefined) return -1;

  const dueDateA = dateFromDue(dueA),
        dueDateB = dateFromDue(dueB);

  return dueDateA - dueDateB;
}

export function TodoThreads(props) {
  const [years, setYears] = createSignal([]),
        [latest, setLatest] = createSignal(null),
        dueMap = new Map();

  // eslint-disable-next-line solid/reactivity
  props.setQuery("tag:todo");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // claude helped with this
  function getIntervalBetweenDates(startDate, endDate, interval) {
    const dates = [],
          currentDate = new Date(startDate);

    while(currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate[`set${interval}`](currentDate[`get${interval}`]() + 1);
      // if we're past the end date, but less than the length of an interval,
        // include the date
      if(currentDate > endDate && currentDate - endDate < currentDate - dates.at(-1)) {
        dates.push(new Date(currentDate));
      }
    }

    return dates;
  }

  function startOfYear(date) {
    const retval = new Date(date);
    retval.setMonth(0);
    retval.setDate(1);
    return retval;
  }

  function endOfYear(date) {
    const retval = new Date(date);
    retval.setMonth(11);
    return retval;
  }

  function startOfMonth(date) {
    const retval = new Date(date);
    retval.setDate(1);
    return retval;
  }

  function endOfMonth(date) {
    const retval = new Date(date);
    retval.setMonth(date.getMonth() + 1);
    retval.setDate(0);
    return retval;
  }

  onMount(() => {
    const ts = props.threads().sort(sortThreadsByDueDate).flat();
    if(ts.length > 0) props.setActiveThread(ts[0].thread_id);
  });

  function processDueDate(thread) {
    if(thread.length !== undefined) {
      thread.forEach(processDueDate);
    } else {
      const due = findEarliestDue(thread);
      if(due !== undefined) {
        const dueDate = dateFromDue(due).toString();
        if(dueMap.has(dueDate)) {
          dueMap.get(dueDate).push(thread.thread_id);
        } else {
          dueMap.set(dueDate, [thread.thread_id]);
        }
      }
    }
  }

  // eslint-disable-next-line solid/reactivity
  createEffect(on(props.threads, () => {
    dueMap.clear();
    props.threads().forEach(processDueDate);
    if(dueMap.size > 0) {
      const dues = Array.from(dueMap.keys()).map(d => new Date(d)),
            earliest = new Date(Math.min(...dues, today));
      setLatest(new Date(Math.max(...dues)));
      setYears(getIntervalBetweenDates(earliest, endOfYear(latest()), "FullYear"));
    } else {
      setYears([]);
    }
  }));

  let prevScrollPos = undefined;

  function Calendar() {
    return (
      <Show when={years().length > 0}>
        <div class="calendar">
          <For each={years()}>
            {(year, yi) =>
              <div class="horizontal-stack">
                <div class="sticky" style={{ 'width': "3em" }}>{year.getFullYear()}</div>
                <div>
                  <For each={getIntervalBetweenDates(yi() === 0 ? year : startOfYear(year), new Date(Math.min(endOfYear(year), latest())), "Month")}>
                    {(month, mi) =>
                      <div class="horizontal-stack">
                        <div class="sticky" style={{ 'width': "2em" }}>{month.toLocaleString('default', { month: 'short' })}</div>
                        <div>
                          <For each={getIntervalBetweenDates(mi() === 0 ? month : startOfMonth(month), new Date(Math.min(endOfMonth(month), latest())), "Date")}>
                            {(day) =>
                              <div class="horizontal-stack">
                                <div data-testid={day.toDateString()} classList={{
                                      'today': JSON.stringify(day) === JSON.stringify(today),
                                      'weekend': [0, 6].includes(day.getDay())
                                    }} style={{ 'width': "2em" }}>
                                  {day.getDate().toString().padStart(2, '0')}
                                </div>
                                <div data-testid={`${day.toDateString()}-boxes`} class="boxes">
                                  <For each={dueMap.get(day.toString())}>
                                    {id =>
                                      <div class="calendar-box"
                                        data-id={id}
                                        onMouseOver={() => {
                                          props.setActiveThread(id);
                                          let el = document.querySelector(".thread.active");
                                          if(el.parentElement.classList.contains("thread-group") && el.parentElement.classList.contains("collapsed")) {
                                            el.parentElement.click();
                                          }
                                        }}/>
                                    }
                                  </For>
                                </div>
                              </div>
                            }
                          </For>
                        </div>
                      </div>
                    }
                  </For>
                </div>
              </div>
            }
          </For>
        </div>
      </Show>
    );
  }

  // eslint-disable-next-line solid/reactivity
  handleSwipe(document.body, (el) => el.closest(".thread"), props.doneActive, TaskAlt, props.activeSelection, Selection);

  // reload at midnight for correct due dates for new date
  const loadDate = new Date();
  function checkDate() {
    const currentDate = new Date();
    if(loadDate.getDate() !== currentDate.getDate()) {
      location.reload();
    }
  }
  document.addEventListener('visibilitychange', checkDate);
  setTimeout(checkDate, (new Date().setHours(24, 0, 0, 0) - loadDate));

  function threadListElem(tprops) {
    // eslint-disable-next-line solid/reactivity
    const authors = tprops.thread.authors.map(splitAddressHeader),
          // eslint-disable-next-line solid/reactivity
          due = findEarliestDue(tprops.thread),
          dueDate = due !== undefined ? dateFromDue(due) : null;

    let when = "";
    if(due !== undefined) {
      when = formatDuration(today, dueDate);
      if(dueDate < today) when = "overdue!";
      else if(dueDate.getTime() === today.getTime()) when = "今日";
      else if(dueDate.getTime() === tomorrow.getTime()) when = "明日";
      else if(dueDate - today < 1000 * 60 * 60 * 24 * 7) when = dueDate.toLocaleDateString([], { weekday: 'short' });
    }

    return (
      <div classList={{
          'thread': true,
          'todo': true,
          'active': tprops.thread.thread_id === props.activeThread(),
          'selected': props.selectedThreads().indexOf(tprops.thread.thread_id) !== -1,
          'due': dueDate !== null ? dueDate < tomorrow : false
        }}
        data-id={tprops.thread.thread_id}
        onClick={(ev) => {
          props.setActiveThread(tprops.thread.thread_id);
          props.openActive();
          ev.stopPropagation();
        }}
        onTouchStart={() => {
          props.setActiveThread(tprops.thread.thread_id);
        }}
        onMouseEnter={() => {
          const calElem = document.getElementsByClassName("calendar")[0],
                boxElem = document.querySelector(`.calendar-box[data-id='${tprops.thread.thread_id}']`);
          prevScrollPos = { left: calElem?.scrollLeft, top: calElem?.scrollTop };
          boxElem?.classList.add("highlight");
          boxElem?.scrollIntoView({block: "nearest"});
        }}
        onMouseLeave={() => {
          if(prevScrollPos) document.getElementsByClassName("calendar")[0].scrollTo(prevScrollPos);
          document.querySelector(`.calendar-box[data-id='${tprops.thread.thread_id}']`)?.classList.remove("highlight");
        }}
      >
        <div>
          {when}
        </div>
        <div class="grid-authors" ref={e => wideNarrowObserver?.observe(e)}>
          <div class="narrow">
            <For each={authors}>
              {(author) => <ColorChip key={author[0]} value={author[2]}/>}
            </For>
          </div>
          <div class="wide">
            <For each={authors}>
              {(author) => <ColorChip key={author[0]} value={author[1]}/>}
            </For>
          </div>
        </div>
        <div class="grid-subject">
          {tprops.thread.subject}
        </div>
        <div>
          <For each={tprops.thread.tags.sort()}>
            {(tag) => <ColorChip class={tag === "todo" || tag.startsWith("due:") || tag.startsWith("grp:") ? "hide-if-narrow" : ""} value={tag}/>}
          </For>
        </div>
      </div>
    );
  }

  return (
    <div class="centered horizontal-stack">
      <Calendar/>
      <div class="vertical-stack clipped todo-threads">
        <For each={props.threads().sort(sortThreadsByDueDate)}>
          {(thread) => <ThreadGroup thread={thread} threadListElem={threadListElem} setActiveThread={props.setActiveThread}/>}
        </For>
      </div>
    </div>
  );
}

// vim: tabstop=2 shiftwidth=2 expandtab
