import { createEffect, createSignal, For, on, Show } from 'solid-js';

import { ColorChip } from "./ColorChip.jsx";

import { formatDuration, splitAddressHeader } from "./utils.js";
import { handleSwipe, Tag, TaskAlt, wideNarrowObserver } from "./UiUtils.jsx";

function dateFromDue(due) {
  const dateComponents = due.split(':')[1].split('-'),
        year = parseInt(dateComponents[0], 10),
        month = parseInt(dateComponents[1], 10) - 1,
        day = parseInt(dateComponents[2], 10);
  return new Date(year, month, day);
}

function findEarliestDue(threadGroup) {
  let dues = [];
  if(Object.prototype.toString.call(threadGroup) === '[object Array]') {
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
  const [latest, setLatest] = createSignal(),
        [years, setYears] = createSignal(),
        dueMap = new Map();

  // eslint-disable-next-line solid/reactivity
  props.setQuery("tag:todo");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  function processDueDate(thread) {
    if(Object.prototype.toString.call(thread) === '[object Array]') {
      thread.forEach(processDueDate);
    } else {
      const due = findEarliestDue(thread);
      if(due !== undefined) {
        const dueDate = dateFromDue(due);
        if(dueMap.has(dueDate)) {
          dueMap.get(dueDate).push(thread.thread_id);
        } else {
          dueMap.set(dueDate, [thread.thread_id]);
        }

        let dur = formatDuration(today, dueDate);
        if(dueDate < today) dur = "overdue!";
        else if(dueDate.getTime() === today.getTime()) dur = "今日";
        else if(dueDate.getTime() === tomorrow.getTime()) dur = "明日";
        else if(dueDate - today < 1000 * 60 * 60 * 24 * 7) dur = dueDate.toLocaleDateString([], { weekday: 'short' });
        dueMap.set(thread.thread_id, dur);
      }
    }
  }

  // claude helped with this
  function getIntervalBetweenDates(startDate, endDate, interval) {
    const dates = [],
          currentDate = new Date(startDate);

    while(currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate[`set${interval}`](currentDate[`get${interval}`]() + 1);
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

  function updateDuesEtc() {
    dueMap.clear();
    props.threads().forEach(processDueDate);
    const dues = Array.from(dueMap.keys()),
          earliest = new Date(Math.min(dues.concat(today)));
    setLatest(new Date(Math.max(dues)));
    setYears(getIntervalBetweenDates(earliest, endOfYear(latest()), "FullYear"));
    const ts = props.threads().sort(sortThreadsByDueDate).flat();
    if(ts.length > 0) props.setActiveThread(ts[0].thread_id);
  }

  // eslint-disable-next-line solid/reactivity
  updateDuesEtc();
  // eslint-disable-next-line solid/reactivity
  createEffect(on(props.threads, updateDuesEtc));

  let prevScrollPos = undefined;

  function Calendar() {
    return (
      <Show when={dueMap.size > 0}>
        <div class="calendar">
          <For each={years()}>
            {(year, yi) =>
              <div class="horizontal-stack">
                <div class="sticky" style={{ 'width': "3em" }}>{year.getFullYear()}</div>
                <div>
                  <For each={getIntervalBetweenDates(yi() === 0 ? year : startOfYear(year), Math.min(endOfYear(year), latest()), "Month")}>
                    {(month, mi) =>
                      <div class="horizontal-stack">
                        <div class="sticky" style={{ 'width': "2em" }}>{month.toLocaleString('default', { month: 'short' })}</div>
                        <div>
                          <For each={getIntervalBetweenDates(mi() === 0 ? month : startOfMonth(month), Math.min(endOfMonth(month), latest()), "Date")}>
                            {(day) =>
                              <div class="horizontal-stack">
                                <div data-testid={day.toDateString()} classList={{
                                      'today': JSON.stringify(day) === JSON.stringify(today),
                                      'weekend': [0, 6].includes(day.getDay())
                                    }} style={{ 'width': "2em" }}>
                                  {day.getDate().toString().padStart(2, '0')}
                                </div>
                                <div data-testid={`${day.toDateString()}-boxes`} class="boxes">
                                  <For each={dueMap.get(day)}>
                                    {id =>
                                      <div class="calendar-box" onMouseOver={() => props.setActiveThread(id)}/>
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
  handleSwipe(document.body, (el) => el.closest(".thread"), props.doneActive, TaskAlt, props.tagActive, Tag);

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
    const authors = tprops.thread.authors.map(splitAddressHeader),
          due = findEarliestDue(tprops.thread),
          dueDate = due !== undefined ? dateFromDue(due) : null;
    return (
      <div classList={{
          'thread': true,
          'todo': true,
          'active': tprops.thread.thread_id === props.activeThread(),
          'selected': props.selectedThreads().indexOf(tprops.thread.thread_id) !== -1,
          'due': dueDate !== null ? dueDate < tomorrow : false
        }}
        data-id={tprops.thread.thread_id}
        onClick={() => {
          props.setActiveThread(tprops.thread.thread_id);
          props.openActive();
        }}
        onTouchStart={() => {
          props.setActiveThread(tprops.thread.thread_id);
        }}
        onMouseEnter={() => {
          const calElem = document.getElementsByClassName("calendar")[0];
          prevScrollPos = { left: calElem?.scrollLeft, top: calElem?.scrollTop };
          document.getElementsByClassName("calendar-box")[index()]?.classList.add("highlight");
          document.getElementsByClassName("calendar-box")[index()]?.scrollIntoView({block: "nearest"});
        }}
        onMouseLeave={() => {
          if(prevScrollPos) document.getElementsByClassName("calendar")[0].scrollTo(prevScrollPos);
          document.getElementsByClassName("calendar-box")[index()]?.classList.remove("highlight");
        }}
      >
        <div>
          {dueMap.get(tprops.thread.thread_id) || ""}
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
            {(tag) => <ColorChip class={tag === "todo" || tag.startsWith("due:") ? "hide-if-narrow" : ""} value={tag}/>}
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
          {(thread) => <props.ThreadGroup thread={thread} threadListElem={threadListElem}/>}
        </For>
      </div>
    </div>
  );
}

// vim: tabstop=2 shiftwidth=2 expandtab
