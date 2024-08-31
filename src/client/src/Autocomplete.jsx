// based on https://stackoverflow.com/questions/75751029/how-to-create-an-autocomplete-element
import { createEffect, createMemo, createSignal, For, Index, on } from 'solid-js';

import { InputAdornment, List, ListItemButton, ListItemText, Popover, TextField } from "@suid/material";
import { ColorChip } from "./ColorChip.jsx";

export const Autocomplete = (props) => {
  const [showPopover, setShowPopover] = createSignal(false),
        [selected, setSelected] = createSignal(0),
        [inputRef, setInputRef] = createSignal(),
        [sortedOptions, setSortedOptions] = createSignal([]);

  const compareToText = (a, b) => {
    let re = new RegExp(props.text(), "i"),
        posa = a.search(re),
        posb = b.search(re);
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

export const ChipComplete = (props) => {
  const [toAdd, setToAdd] = createSignal();

  return (
    <Autocomplete
      class="editAutoCompleteBox"
      variant="standard"
      fullWidth
      text={toAdd}
      setText={setToAdd}
      InputProps={{
        startAdornment: <InputAdornment>
          <For each={props.chips}>
            {(chip) => <ColorChip data-testid={chip} value={chip} onClick={(e) => {
                props.removeChip(chip);
                e.stopPropagation();
              }}/>}
          </For>
        </InputAdornment>
      }}
      handleKey={async (ev) => {
        if(ev.code === 'Enter' && toAdd()) {
          props.addChip(toAdd());
          setToAdd(null);
        } else if(ev.code === 'Backspace' && !toAdd()) {
          const tmp = JSON.parse(JSON.stringify(props.chips)),
                chip = tmp.pop();
          props.removeChip(chip);
        }
      }}
      {...props}
    />
  );
};

export const TagComplete = (props) => {
  return (
    <ChipComplete
      chips={props.tags}
      addChip={props.addTag}
      removeChip={props.removeTag}
      getOptions={(text) => {
        return props.allTags.filter((t) => t.startsWith(text));
      }}
      {...props}
    />
  );
};

// vim: tabstop=2 shiftwidth=2 expandtab
