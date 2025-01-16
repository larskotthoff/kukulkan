import { createShortcut } from "@solid-primitives/keyboard";

export function mkShortcut(keysList, func, preventDefault = false) {
  keysList.forEach((keys) => {
    createShortcut(keys, (e) => {
      if(["INPUT", "TEXTAREA"].includes(document.activeElement.tagName) === false) {
        func();
        if(preventDefault) e.preventDefault();
      }
    }, { preventDefault: false });
  });
}

function shouldTrigger(diff) {
  return Math.abs(diff.x) > 0.3 * window.screen.width && Math.abs(diff.x) > 1.5 * Math.abs(diff.y);
}

function shouldShow(diff) {
  return Math.abs(diff.x) > 0.1 * window.screen.width && Math.abs(diff.x) > 1.5 * Math.abs(diff.y);
}

export function handleSwipe(el, indicatorSelector, left, leftIcon, right, rightIcon) {
  const initialPos = { x: undefined, y: undefined },
        finalPos = { x: undefined, y: undefined };
  let triggerEl = null, indicator = null;

  function reset() {
    initialPos.x = undefined;
    initialPos.y = undefined;
    finalPos.x = undefined;
    finalPos.y = undefined;
    if(indicator) indicator.style.position = null;
    if(triggerEl && indicator) indicator.removeChild(triggerEl);
    triggerEl = null;
  }

  el.ontouchstart = (ev => {
    initialPos.x = ev.touches.item(0).clientX;
    initialPos.y = ev.touches.item(0).clientY;
  });

  el.ontouchcancel = reset;

  el.ontouchmove = (ev => {
    finalPos.x = ev.touches.item(0).clientX;
    finalPos.y = ev.touches.item(0).clientY;
    const diff = { x: finalPos.x - initialPos.x, y: finalPos.y - initialPos.y };
    if(shouldShow(diff)) {
      if(!indicator) indicator = typeof indicatorSelector === 'function' ? indicatorSelector(ev.target) : null;
      if(indicator) {
        indicator.style.position = "relative";
        indicator.style.left = diff.x + "px";
      }
    }

    if(shouldTrigger(diff) && triggerEl === null) {
      triggerEl = document.createElement("div");
      triggerEl.style.position = "absolute";
      triggerEl.style.top = "50%";
      triggerEl.style.transform = "translateY(-50%)";
      if(diff.x < 0 && leftIcon) {
        triggerEl.innerHTML = leftIcon;
      } else if(rightIcon) {
        triggerEl.innerHTML = rightIcon;
      }
      if(indicator) indicator.appendChild(triggerEl);
    }
    if(!shouldTrigger(diff) && triggerEl !== null) {
      if(indicator) indicator.removeChild(triggerEl);
      triggerEl = null;
    }
    if(triggerEl !== null) {
      if(diff.x < 0) {
        triggerEl.style.right = diff.x + "px";
      } else {
        triggerEl.style.left = -diff.x + "px";
      }
    }
  });

  el.ontouchend = (() => {
    const diff = { x: finalPos.x - initialPos.x, y: finalPos.y - initialPos.y };

    if(shouldTrigger(diff)) {
      if(diff.x < 0 && typeof left === 'function') {
        left();
      } else if(typeof right === 'function') {
        right();
      }
    }

    reset();
  });
}

export let wideNarrowObserver = null;
if(typeof ResizeObserver === 'function') {
  wideNarrowObserver = new ResizeObserver((entries) => {
    for(const entry of entries) {
      const wide = entry.target.querySelector(".wide"),
            narrow = entry.target.querySelector(".narrow");

      narrow.style.display = "none";
      wide.style.display = "block";
      if(wide.clientWidth < wide.scrollWidth) {
        narrow.style.display = "block";
        wide.style.display = "none";
      } else {
        narrow.style.display = "none";
        wide.style.display = "block";
      }
    }
  });
}

// Material UI icons
export const AttachFile = `<svg class="icon" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="AttachFileIcon"><path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6z"></path></svg>`;
export const Cancel = `<svg class="icon" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="CancelIcon"><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2m5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12z"></path></svg>`;
export const CheckCircle = `<svg class="icon" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="CheckCircleIcon"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8z"></path></svg>`;
export const Create = `<svg class="icon" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="CreateIcon"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75z"></path></svg>`;
export const ErrorOutline = `<svg class="icon" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="ErrorOutlineIcon"><path d="M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2M12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8"></path></svg>`;
export const Forward = `<svg class="icon" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="ForwardIcon"><path d="M12 8V4l8 8-8 8v-4H4V8z"></path></svg>`;
export const Help = `<svg class="icon" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="HelpIcon"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m1 17h-2v-2h2zm2.07-7.75-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25"></path></svg>`;
export const MarkUnread = `<svg class="icon" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="MarkAsUnreadIcon"><path d="M18.83 7h-2.6L10.5 4 4 7.4V17c-1.1 0-2-.9-2-2V7.17c0-.53.32-1.09.8-1.34L10.5 2l7.54 3.83c.43.23.73.7.79 1.17M20 8H7c-1.1 0-2 .9-2 2v9c0 1.1.9 2 2 2h13c1.1 0 2-.9 2-2v-9c0-1.1-.9-2-2-2m0 3.67L13.5 15 7 11.67V10l6.5 3.33L20 10z"></path></svg>`;
export const Print = `<svg class="icon" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="PrintIcon"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3m-3 11H8v-5h8zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1m-1-9H6v4h12z"></path></svg>`;
export const ReplyAll = `<svg class="icon" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="ReplyAllIcon"><path d="M7 8V5l-7 7 7 7v-3l-4-4zm6 1V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11"></path></svg>`;
export const Security = `<svg class="icon" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="SecurityIcon"><path d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11z"></path></svg>`;
export const Send = `<svg class="icon" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="SendIcon"><path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z"></path></svg>`;
export const Settings = `<svg class="icon" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="SettingsIcon"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6"></path></svg>`;
export const Tag = `<svg class="icon" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="TagIcon"><path d="M20 10V8h-4V4h-2v4h-4V4H8v4H4v2h4v4H4v2h4v4h2v-4h4v4h2v-4h4v-2h-4v-4zm-6 4h-4v-4h4z"></path></svg>`;
export const TaskAlt = `<svg class="icon" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="TaskAltIcon"><path d="M22 5.18 10.59 16.6l-4.24-4.24 1.41-1.41 2.83 2.83 10-10zm-2.21 5.04c.13.57.21 1.17.21 1.78 0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8c1.58 0 3.04.46 4.28 1.25l1.44-1.44C16.1 2.67 14.13 2 12 2 6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10c0-1.19-.22-2.33-.6-3.39z"></path></svg>`;
export const Trash = `<svg class="icon" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="DeleteIcon"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6zM19 4h-3.5l-1-1h-5l-1 1H5v2h14z"></path></svg>`;
export const WarningAmber = `<svg class="icon" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="WarningAmberIcon"><path d="M12 5.99 19.53 19H4.47zM12 2 1 21h22z"></path><path d="M13 16h-2v2h2zm0-6h-2v5h2z"></path></svg>`;

export function Icon(props) {
  // eslint-disable-next-line solid/no-innerhtml
  return (<div innerHTML={props.icon} class="icon-container" style={props.style}/>);
}

// vim: tabstop=2 shiftwidth=2 expandtab
