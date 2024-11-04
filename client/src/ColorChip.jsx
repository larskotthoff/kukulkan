import { getColor } from "./utils.js";

export function ColorChip(props) {
  return (<span
        label={props.value}
        class="chip"
        style={{ '--bg-color': `${getColor(props.value)}` }}
        {...props}>
      {props.value}
    </span>);
}

// vim: tabstop=2 shiftwidth=2 expandtab
