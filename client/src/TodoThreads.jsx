import { createEffect, createSignal, For, on, Show } from 'solid-js';

import { ColorChip } from "./ColorChip.jsx";

import { formatDuration } from "./utils.js";
import { handleSwipe, Tag, TaskAlt, wideNarrowObserver } from "./UiUtils.jsx";

function dateFromDue(due) {
  const dateComponents = due.split(':')[1].split('-'),
        year = parseInt(dateComponents[0], 10),
        month = parseInt(dateComponents[1], 10) - 1,
        day = parseInt(dateComponents[2], 10);
  return new Date(year, month, day);
}

export function sortThreadsByDueDate(a, b) {
  const dueA = a.tags.find((tag) => tag.startsWith("due:")),
        dueB = b.tags.find((tag) => tag.startsWith("due:"));

  if(dueA === undefined && dueB === undefined) return 0;
  if(dueA === undefined && dueB !== undefined) return 1;
  if(dueA !== undefined && dueB === undefined) return -1;

  const dueDateA = dateFromDue(dueA),
        dueDateB = dateFromDue(dueB);

  return dueDateA - dueDateB;
}

export function TodoThreads(props) {
  const [dues, setDues] = createSignal(),
        [dueDates, setDueDates] = createSignal(),
        [latest, setLatest] = createSignal(),
        [years, setYears] = createSignal();

  // eslint-disable-next-line solid/reactivity
  props.setQuery("tag:todo");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  let dueMap = {};

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
      else if(dueDate - today < 1000 * 60 * 60 * 24 * 7) return [ dueDate, dueDate.toLocaleDateString([], { weekday: 'short' }) ];
      else return [ dueDate, formatDuration(today, dueDate) ];
    } else {
      return [ null, "" ];
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
    dueMap = {};
    setDues(props.threads().sort(sortThreadsByDueDate).map(processDueDate));
    setDueDates(dues().map(d => d[0]).filter(x => x));
    let earliest = new Date(Math.min(...(dueDates().concat(today))));
    setLatest(new Date(Math.max(...dueDates())));
    setYears(getIntervalBetweenDates(earliest, endOfYear(latest()), "FullYear"));
  }

  // eslint-disable-next-line solid/reactivity
  updateDuesEtc();
  // eslint-disable-next-line solid/reactivity
  createEffect(on(props.threads, updateDuesEtc));

  let prevScrollPos = undefined;

  function Calendar() {
    return (
      <Show when={dueDates().length > 0}>
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
                                  <For each={dueMap[day]}>
                                    {dueindex =>
                                      <div class="calendar-box" onMouseOver={() => props.setActiveThread(dueindex)}/>
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
  handleSwipe(document.body, props.doneActive, TaskAlt, props.tagActive, Tag);

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

  return (
    <div class="centered horizontal-stack">
      <Calendar/>
      <div class="vertical-stack clipped todo-threads">
        <For each={props.threads().sort(sortThreadsByDueDate)}>
          {(thread, index) =>
            <div classList={{
                'thread': true,
                'todo': true,
                'active': index() === props.activeThread(),
                'selected': props.selectedThreads().indexOf(index()) !== -1,
                'due': dues()[index()][0] ? dues()[index()][0] < tomorrow : false
              }}
              onClick={() => {
                props.setActiveThread(index());
                props.openActive();
              }}
              onTouchStart={() => {
                props.setActiveThread(index());
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
                {dues()[index()][1]}
              </div>
              <div class="grid-authors" ref={e => wideNarrowObserver?.observe(e)}>
                <div class="wide">
                  <For each={thread.authors}>
                    {(author) => <ColorChip value={author}/>}
                  </For>
                </div>
                <div class="narrow">
                  <For each={thread.authors}>
                    {(author) => <ColorChip value={author.split(/\s|,/)[0]}/>}
                  </For>
                </div>
              </div>
              <div class="grid-subject">
                {thread.subject}
              </div>
              <div>
                <For each={thread.tags.sort()}>
                  {(tag) => <ColorChip class={tag === "todo" || tag.startsWith("due:") ? "hide-if-narrow" : ""} value={tag}/>}
                </For>
              </div>
            </div>
          }
        </For>
      </div>
    </div>
  );
}

// vim: tabstop=2 shiftwidth=2 expandtab
