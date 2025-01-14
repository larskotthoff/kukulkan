import { createSignal } from 'solid-js';

export function getSetting(setting) {
  let val = null;
  switch(setting) {
    case "numQueries":
      return parseInt(localStorage.getItem("settings-numQueries"), 10) || 10;
    case "openInTab":
      return localStorage.getItem("settings-openInTab") || "_blank";
    case "showPreview":
      val = localStorage.getItem("settings-showPreview");
      if(val === null) {
        return true;
      } else {
        return val === "true";
      }
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
    case "showSerpent":
      val = localStorage.getItem("settings-showSerpent");
      if(val === null) {
        return false;
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
        [abbreviateQuoted, setAbbreviateQuoted] = createSignal(getSetting("abbreviateQuoted")),
        [showSerpent, setShowSerpent] = createSignal(getSetting("showSerpent")),
        [showPreview, setShowPreview] = createSignal(getSetting("showPreview"));

  document.title = "Kukulkan Settings";

  return (<center>
    <div class="margin">
      Save <input
        type="text"
        value={numQueries()}
        data-testid="numQueries"
        class="settings-box"
        onChange={(ev) => {
          setNumQueries(parseInt(ev.target.value, 10));
          localStorage.setItem("settings-numQueries", numQueries());
        }}/> most recent search queries for autocomplete.
    </div>
    <div class="margin">
      Open everything in <select
        data-testid="openInTab"
        value={openInTab()}
        onChange={(ev) => {
          setOpenInTab(ev.target.value);
          localStorage.setItem("settings-openInTab", openInTab());
        }}>
        <option value="_blank">
          new
        </option>
        <option value="_self">
          same
        </option>
      </select> tab.
    </div>
    <div class="margin">
      <select
        data-testid="showPreview"
        value={showPreview()}
        onChange={(ev) => {
          setShowPreview(ev.target.value);
          localStorage.setItem("settings-showPreview", showPreview());
        }}>
        <option value={true}>
          Do
        </option>
        <option value={false}>
          Do not
        </option>
      </select> show preview for first matching message in active thread on search overview.
    </div>
    <div class="margin">
      Show <select
        data-testid="showNestedThread"
        value={showNestedThread()}
        onChange={(ev) => {
          setShowNestedThread(ev.target.value);
          localStorage.setItem("settings-showNestedThread", showNestedThread());
        }}>
        <option value={true}>
          nested
        </option>
        <option value={false}>
          flattened
        </option>
      </select> thread on thread page.
    </div>
    <div class="margin">
      When composing, use <select
        data-testid="externalCompose"
        value={externalCompose()}
        onChange={(ev) => {
          setExternalCompose(ev.target.value);
          localStorage.setItem("settings-externalCompose", externalCompose());
        }}>
        <option value={-1}>
          backend configuration
        </option>
        <option value={false}>
          internal browser editor
        </option>
        <option value={true}>
          external editor on localhost
        </option>
      </select>.
    </div>
    <div class="margin">
      When replying, <select
        data-testid="abbreviateQuoted"
        value={abbreviateQuoted()}
        onChange={(ev) => {
          setAbbreviateQuoted(ev.target.value);
          localStorage.setItem("settings-abbreviateQuoted", abbreviateQuoted());
        }}>
        <option value={true}>
          abbreviate with [...]
        </option>
        <option value={false}>
          show in full
        </option>
      </select> quoted text beyond the first level.
    </div>
    <div class="margin">
      <select
        data-testid="showSerpent"
        value={showSerpent()}
        onChange={(ev) => {
          setShowSerpent(ev.target.value);
          localStorage.setItem("settings-showSerpent", showSerpent());
        }}>
        <option value={true}>
          Do
        </option>
        <option value={false}>
          Do not
        </option>
      </select> show Kukulkan background.
    </div>
  </center>);
}

// vim: tabstop=2 shiftwidth=2 expandtab
