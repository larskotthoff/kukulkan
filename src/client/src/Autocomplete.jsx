// based on https://stackoverflow.com/questions/75751029/how-to-create-an-autocomplete-element

import { render } from 'solid-js/web';
import { createEffect, createMemo, createSignal, Index, on, onMount } from 'solid-js';

import { List, ListItemButton, ListItemText, Popover, TextField } from "@suid/material";

export function Autocomplete(props) {
  const [showPopover, setShowPopover] = createSignal(false),
        [selected, setSelected] = createSignal(0),
        [inputRef, setInputRef] = createSignal();

  const compareToText = (a, b) => {
    const re = new RegExp(props.text(), "i"),
          posa = a.search(re),
          posb = b.search(re);
    return posa === posb ?
           Math.abs(a.length - props.text().length) - Math.abs(b.length - props.text().length) :
           posa - posb;
  };

  const filteredOptions = () => {
    return props.getOptions(props.text()).sort(compareToText);
  };

  const isVisible = createMemo(() => {
    return showPopover() &&
           props.text() &&
           filteredOptions().length > 0;
  });

  createEffect(on(props.text, () => {
    setSelected(0);
  }));

  const handleKeydown = (event) => {
    if (event.code === 'ArrowUp') {
      setSelected(prev => prev === 0 ? (filteredOptions().length - 1) : prev - 1);
    } else if (event.code === 'ArrowDown') {
      setSelected(prev => prev + 1 === filteredOptions().length ? 0 : prev + 1);
    } else if (event.code === 'Enter') {
      select();
    } else if (event.code === 'Escape') {
      setShowPopover(false);
      inputRef().blur();
    } else {
      setShowPopover(true);
    }
  };

  const select = (i) => {
    if(isVisible()) {
      event.preventDefault();
      if(i) setSelected(i);
      props.setText(filteredOptions()[selected()]);
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
        onChange={(ev, value) => props.setText(value)}
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
          <Index each={filteredOptions()}>
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
