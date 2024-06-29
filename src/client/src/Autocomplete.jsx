// based on https://stackoverflow.com/questions/75751029/how-to-create-an-autocomplete-element

import { render } from 'solid-js/web';
import { createEffect, createMemo, createSignal, Index, on } from 'solid-js';

import { List, ListItemButton, ListItemText, Popover, TextField } from "@suid/material";

export function Autocomplete(props) {
  const [showPopover, setShowPopover] = createSignal(false);
  const [selected, setSelected] = createSignal(0);

  let inputRef = undefined;

  const compareToText = (a) => {
    const pos = a.search(new RegExp(props.text(), "i"));
    return pos === 0 ? pos : Math.abs(a.length - props.text().length);
  };

  const filteredOptions = () => {
    return props.getOptions(props.text()).filter(el => el.includes(props.text()))
            .sort((a, b) => compareToText(a) - compareToText(b));
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
      inputRef.querySelector("input").focus();
      inputRef.querySelector("input").setSelectionRange(props.text().length, props.text().length);
    }
  };

  return (
    <div style="width: 100%">
      <TextField
        ref={inputRef}
        value={props.text() || ""}
        onChange={ (ev, value) => props.setText(value) }
        onKeyDown={handleKeydown}
        autoComplete="off"
        {...props}
      />
      <Popover open={isVisible()} anchorEl={inputRef} anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}>
        <List>
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
    </div>
  );
};

// vim: tabstop=2 shiftwidth=2 expandtab
