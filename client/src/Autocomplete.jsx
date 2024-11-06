// based on https://stackoverflow.com/questions/75751029/how-to-create-an-autocomplete-element
import { createEffect, createSignal, For, Index, on, Show } from 'solid-js';

import { ColorChip } from "./ColorChip.jsx";

export function Autocomplete(props) {
  const [showPopover, setShowPopover] = createSignal(false),
        [selected, setSelected] = createSignal(0),
        [inputRef, setInputRef] = createSignal(),
        [sortedOptions, setSortedOptions] = createSignal([]);

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
    let posa = a.toLowerCase().indexOf(props.text().toLowerCase()),
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

  async function getSortedOptions() {
    const options = await props.getOptions(props.text());
    setSortedOptions(options.sort(cmp));
  }

  function handleKeydown(ev) {
    let wasVisible = isVisible();
    if (ev.code === 'ArrowUp') {
      setSelected(prev => prev === 0 ? (sortedOptions().length - 1) : prev - 1);
      ev.preventDefault();
    } else if (ev.code === 'ArrowDown') {
      setSelected(prev => prev + 1 === sortedOptions().length ? 0 : prev + 1);
      ev.preventDefault();
    } else if (ev.code === 'Enter' || ev.key === 'Enter') {
      select();
    } else if (ev.code === 'Escape') {
      setShowPopover(false);
      inputRef().blur();
    } else {
      setShowPopover(true);
    }

    if(!wasVisible && props.handleKey) props.handleKey(ev);
  }

  function select(i) {
    if(isVisible()) {
      if(i) setSelected(i);
      props.setText(sortedOptions()[selected()]);
      setShowPopover(false);
      inputRef().focus();
      inputRef().setSelectionRange(props.text().length, props.text().length);
    }
  }

  function isVisible() {
    return showPopover() &&
           props.text() &&
           sortedOptions().length > 0;
  }

  // eslint-disable-next-line solid/reactivity
  createEffect(on(props.text, () => {
    setSelected(0);
  }));

  return (
    <div {...props}>
      {props.children}
      <input
        type="text"
        ref={setInputRef}
        value={props.text() || ""}
        // eslint-disable-next-line solid/reactivity
        onBlur={props.onBlur}
        onInput={(ev) => {
          props.setText(ev.target.value);
          getSortedOptions();
        }}
        onKeyDown={handleKeydown}
        autoComplete="off"
      />
      <Show when={isVisible()}>
        <div class="autocomplete-popup paper" style={{
          'left': `${inputRef().getBoundingClientRect().left}px`,
          'top': `${inputRef().getBoundingClientRect().bottom}px`
        }}>
          <Index each={isVisible() ? sortedOptions() : []}>
            {(item, i) =>
              <div classList={{
                  'selected': selected() === i
                }}
                onClick={() => select(i) }>
                {item()}
              </div>
            }
          </Index>
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
          const tmp = JSON.parse(JSON.stringify(props.chips)),
                chip = tmp.pop();
          props.removeChip(chip);
        }
      }}
      {...props}>
      <For each={props.chips}>
        {(chip) => <ColorChip data-testid={chip} value={chip} onClick={(e) => {
            props.removeChip(chip);
            e.stopPropagation();
          }}/>}
      </For>
    </Autocomplete>
  );
}

export function TagComplete(props) {
  return (
    <ChipComplete
      chips={props.tags}
      addChip={props.addTag}
      removeChip={props.removeTag}
      getOptions={(text) => {
        return data.allTags.filter((t) => t.includes(text));
      }}
      {...props}
    />
  );
}

// vim: tabstop=2 shiftwidth=2 expandtab
