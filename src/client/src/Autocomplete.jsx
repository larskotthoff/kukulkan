// based on https://stackoverflow.com/questions/75751029/how-to-create-an-autocomplete-element

import { render } from 'solid-js/web';
import { createEffect, createMemo, createSignal, Index, on, onMount } from 'solid-js';

import { List, ListItemButton, ListItemText, Popover, TextField } from "@suid/material";

export const Autocomplete = (props) => {
  const [showPopover, setShowPopover] = createSignal(false),
        [selected, setSelected] = createSignal(0),
        [inputRef, setInputRef] = createSignal(),
        [sortedOptions, setSortedOptions] = createSignal([]);

  const compareToText = (a, b) => {
    let re = new RegExp(props.text(), "i"),
        posa = a.search(re),
        posb = b.search(re);
    if(posa === -1) posa = 999;
    if(posb === -1) posb = 999;
    return posa === posb ?
           Math.abs(a.length - props.text().length) - Math.abs(b.length - props.text().length) :
           posa - posb;
  };

  async function getSortedOptions() {
    const options = await props.getOptions(props.text());
    setSortedOptions(options.sort(compareToText));
  }

  const isVisible = createMemo(() => {
    return showPopover() &&
           props.text() &&
           sortedOptions().length > 0;
  });

  createEffect(on(props.text, () => {
    setSelected(0);
  }));

  const handleKeydown = (ev) => {
    if (ev.code === 'ArrowUp') {
      setSelected(prev => prev === 0 ? (sortedOptions().length - 1) : prev - 1);
    } else if (ev.code === 'ArrowDown') {
      setSelected(prev => prev + 1 === sortedOptions().length ? 0 : prev + 1);
    } else if (ev.code === 'Enter') {
      select();
    } else if (ev.code === 'Escape') {
      setShowPopover(false);
      inputRef().blur();
    } else {
      setShowPopover(true);
    }

    if(props.handleKey) props.handleKey(ev);
  };

  const select = (i) => {
    if(isVisible()) {
      if(i) setSelected(i);
      props.setText(sortedOptions()[selected()]);
      setShowPopover(false);
      inputRef().focus();
      inputRef().setSelectionRange(props.text().length, props.text().length);
    }
  };

  return (
    <>
      <TextField
        inputRef={setInputRef}
        value={props.text() || ""}
        onChange={(ev, value) => {
          props.setText(value);
          getSortedOptions();
        }}
        onKeyDown={handleKeydown}
        autoComplete="off"
        {...props}
      />
      <Popover
        open={isVisible()}
        anchorEl={inputRef()}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}>
        <List class="autocomplete-popup">
          <Index each={sortedOptions()}>
            {(item, i) =>
              <ListItemButton
                  selected={selected() === i}
                  onClick={() => { select(i) }}>
                <ListItemText primary={item()}/>
              </ListItemButton>
            }
          </Index>
        </List>
      </Popover>
    </>
  );
};

// vim: tabstop=2 shiftwidth=2 expandtab
