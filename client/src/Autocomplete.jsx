// based on https://stackoverflow.com/questions/75751029/how-to-create-an-autocomplete-element
import { createEffect, createSignal, For, on, Show } from 'solid-js';
import * as chrono from 'chrono-node';

import { ColorChip } from "./ColorChip.jsx";

import { apiURL, delayedDebouncedFetch } from "./utils.js";

export function Autocomplete(props) {
  const [showPopover, setShowPopover] = createSignal(false),
        [selected, setSelected] = createSignal(0),
        [inputRef, setInputRef] = createSignal(),
        [sortedOptions, setSortedOptions] = createSignal([]),
        optionsMap = new Map(),
        // eslint-disable-next-line solid/reactivity
        {text, setText, getOptions, handleKey, children, onBlur, onFocus, onInput, sort, ...spreadProps} = props;

  // sort options such that:
  // - options that start with the search text come first
  // - options that have the search text at the beginning of a word within the
  //   option are also ranked highly
  // - options that don't have the search text come last
  // - ties are broken such that shorter options are preferred
  function cmp(a, b) {
    let posa = getPos(a),
        posb = getPos(b);
    return posa === posb ? a.length - b.length : posa - posb;
  }

  function getPos(a) {
    let posa = a.toLowerCase().indexOf(text().toLowerCase()),
        lima = posa;
    if(posa === 0) {
      posa = -1;
    } else {
      if(posa < 0) {
        posa = a.length;
      } else {
        // check if we're at the beginning of a word within the string
        while(lima > 0 && "\"' <>@,.".indexOf(a[lima-1]) === -1) lima--;
        posa -= lima;
      }
    }
    return posa;
  }

  async function updateOptions() {
    let options = await getOptions(text());
    if(options.length === undefined) {
      // group completion where shown text and actual completion are not the
      // same
      options = Object.keys(options).map(k => {
        optionsMap.set(k, options[k]);
        return k;
      });
    } else {
      optionsMap.clear();
    }
    if(sort === false) {
      setSortedOptions(options);
    } else {
      setSortedOptions(options.sort(cmp));
    }
  }

  function handleKeydown(ev) {
    let wasVisible = isVisible();
    if(ev.code === 'ArrowUp' || ev.key === 'ArrowUp') {
      setSelected(prev => prev === 0 ? (sortedOptions().length - 1) : prev - 1);
      try {
        document.getElementsByClassName("autocomplete-popup")[0]?.getElementsByClassName("selected")[0]?.scrollIntoView({block: "nearest"});
      // eslint-disable-next-line no-unused-vars
      } catch(e) {;}
      ev.preventDefault();
    } else if(ev.code === 'ArrowDown' || ev.key === 'ArrowDown') {
      setSelected(prev => prev + 1 === sortedOptions().length ? 0 : prev + 1);
      try {
        document.getElementsByClassName("autocomplete-popup")[0]?.getElementsByClassName("selected")[0]?.scrollIntoView({block: "nearest"});
      // eslint-disable-next-line no-unused-vars
      } catch(e) {;}
      ev.preventDefault();
    } else if(ev.code === 'Enter' || ev.key === 'Enter') {
      select();
    } else if(ev.code === 'Escape' || ev.key === 'Escape') {
      if(showPopover()) {
        setShowPopover(false);
      } else {
        inputRef().blur();
      }
    } else if(ev.code === ' ' || ev.key === ' ') {
      setShowPopover(false);
    } else {
      setShowPopover(true);
    }

    if(!wasVisible && handleKey) handleKey(ev);
  }

  function select(i) {
    if(isVisible()) {
      if(i) setSelected(i);
      let sel = sortedOptions()[selected()];
      if(optionsMap.size > 0) sel = optionsMap.get(sel);
      setText(sel);
      setShowPopover(false);
      inputRef().focus();
      inputRef().setSelectionRange(text().length, text().length);
    }
  }

  function isVisible() {
    return showPopover() &&
           text() &&
           sortedOptions().length > 0;
  }

  createEffect(on(text, () => {
    setSelected(0);
  }));

  window.onclick = e => {
    if(!e.target.classList.contains("autocomplete-popup") &&
      !e.target.classList.contains("autocomplete-option")) {
      setShowPopover(false);
    }
  }

  return (
    <div {...spreadProps}>
      {children}
      <input
        type="text"
        ref={setInputRef}
        value={text() || ""}
        onBlur={onBlur}
        onFocus={onFocus}
        onInput={(ev) => {
          setText(ev.target.value);
          updateOptions();
          if(typeof onInput === 'function') onInput(ev);
        }}
        onKeyDown={handleKeydown}
        enterkeyhint="go"
        autoComplete="off"
        autoCapitalize="off"
      />
      <Show when={isVisible()}>
        <div class="autocomplete-popup paper" style={{
          'left': `${inputRef().getBoundingClientRect().left}px`,
          'top': `${inputRef().getBoundingClientRect().bottom}px`
        }}>
          <For each={sortedOptions()}>
            {(item, i) =>
              <div classList={{
                  'autocomplete-option': true,
                  'selected': selected() === i()
                }}
                onClick={() => select(i())}>
                {item}
              </div>
            }
          </For>
        </div>
      </Show>
    </div>
  );
}

export function ChipComplete(props) {
  const [toAdd, setToAdd] = createSignal();

  return (
    <Autocomplete
      class="input-wide chip-edit-autocomplete"
      text={toAdd}
      setText={setToAdd}
      // eslint-disable-next-line solid/reactivity
      handleKey={async (ev) => {
        if((ev.code === 'Enter' || ev.key === 'Enter') && toAdd()) {
          props.addChip(toAdd());
          setToAdd(null);
        } else if((ev.code === 'Backspace' || ev.key === 'Backspace') && !toAdd()) {
          const tmp = props.chips.slice(),
                chip = tmp.pop();
          props.removeChip(chip);
        }
      }}
      {...props}>
      <For each={props.chips}>
        {(chip, i) => <ColorChip data-testid={chip} key={props.keys ? props.keys[i()] : chip} value={chip} onClick={(e) => {
            props.removeChip(chip);
            e.stopPropagation();
          }}/>}
      </For>
    </Autocomplete>
  );
}

export async function getTagOptions(text, sp, returnGrpOpts = true) {
  let opts = data.allTags.filter((t) => t.toLowerCase().includes(text.toLowerCase()));
  if(text.startsWith("due:")) {
    const parsed = chrono.parseDate(text.split(':')[1])?.toISOString().split('T')[0];
    if(parsed) opts.unshift(`due:${parsed}`);
  } else if(text.startsWith("grp:") && returnGrpOpts) {
    opts = await delayedDebouncedFetch(apiURL(`api/group_complete/?query=${encodeURIComponent(text.split(':')[1])}`), 200, sp);
  }
  return opts;
}

export function TagComplete(props) {
  return (
    <ChipComplete
      chips={props.tags}
      addChip={props.addTag}
      removeChip={props.removeTag}
      getOptions={text => getTagOptions(text, props.sp)}
      {...props}
    />
  );
}

// vim: tabstop=2 shiftwidth=2 expandtab
