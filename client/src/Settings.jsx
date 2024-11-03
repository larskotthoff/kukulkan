import { createSignal } from 'solid-js';

import MenuItem from "@suid/material/MenuItem";
import Select from "@suid/material/Select";
import TextField from "@suid/material/TextField";

export function getSetting(setting) {
  let val = null;
  switch(setting) {
    case "numQueries":
      return parseInt(localStorage.getItem("settings-numQueries"), 10) || 10;
    case "openInTab":
      return localStorage.getItem("settings-openInTab") || "_blank";
    case "showNestedThread":
      val = localStorage.getItem("settings-showNestedThread");
      if(val === null) {
        return true;
      } else {
        return val === "true";
      }
    case "externalCompose":
      val = localStorage.getItem("settings-externalCompose");
      if(val === null) {
        return -1;
      } else if(val === "-1") {
        return -1;
      } else {
        return val === "true";
      }
    case "abbreviateQuoted":
      val = localStorage.getItem("settings-abbreviateQuoted");
      if(val === null) {
        return true;
      } else {
        return val === "true";
      }
  }
}

export function Settings() {
  const [numQueries, setNumQueries] = createSignal(getSetting("numQueries")),
        [openInTab, setOpenInTab] = createSignal(getSetting("openInTab")),
        [showNestedThread, setShowNestedThread] = createSignal(getSetting("showNestedThread")),
        [externalCompose, setExternalCompose] = createSignal(getSetting("externalCompose")),
        [abbreviateQuoted, setAbbreviateQuoted] = createSignal(getSetting("abbreviateQuoted"));

  document.title = "Kukulkan Settings";

  return (<center>
    <div class="margin">
      Save <TextField
        variant="standard"
        value={numQueries()}
        data-testid="numQueries"
        class="settings-box"
        onChange={(ev) => {
          setNumQueries(parseInt(ev.target.value, 10));
          localStorage.setItem("settings-numQueries", numQueries());
        }}/> most recent search queries for autocomplete.
    </div>
    <div class="margin">
      Open everything in <Select
        class="select-margin"
        data-testid="openInTab"
        value={openInTab()}
        onChange={(ev) => {
          setOpenInTab(ev.target.value);
          localStorage.setItem("settings-openInTab", openInTab());
        }}>
        <MenuItem value="_blank">
          new
        </MenuItem>
        <MenuItem value="_self">
          same
        </MenuItem>
      </Select> tab.
    </div>
    <div class="margin">
      Show <Select
        class="select-margin"
        data-testid="showNestedThread"
        value={showNestedThread()}
        onChange={(ev) => {
          setShowNestedThread(ev.target.value);
          localStorage.setItem("settings-showNestedThread", showNestedThread());
        }}>
        <MenuItem value={true}>
          nested
        </MenuItem>
        <MenuItem value={false}>
          flattened
        </MenuItem>
      </Select> thread on thread page.
    </div>
    <div class="margin">
      When composing, use <Select
        class="select-margin"
        data-testid="externalCompose"
        value={externalCompose()}
        onChange={(ev) => {
          setExternalCompose(ev.target.value);
          localStorage.setItem("settings-externalCompose", externalCompose());
        }}>
        <MenuItem value={-1}>
          backend configuration
        </MenuItem>
        <MenuItem value={false}>
          internal browser editor
        </MenuItem>
        <MenuItem value={true}>
          external editor on localhost
        </MenuItem>
      </Select>.
    </div>
    <div class="margin">
      When replying, <Select
        class="select-margin"
        data-testid="abbreviateQuoted"
        value={abbreviateQuoted()}
        onChange={(ev) => {
          setAbbreviateQuoted(ev.target.value);
          localStorage.setItem("settings-abbreviateQuoted", abbreviateQuoted());
        }}>
        <MenuItem value={true}>
          abbreviate with [...]
        </MenuItem>
        <MenuItem value={false}>
          show in full
        </MenuItem>
      </Select> quoted text beyond the first level.
    </div>
  </center>);
}

// vim: tabstop=2 shiftwidth=2 expandtab
