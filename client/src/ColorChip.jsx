import { getColor } from "./utils.js";

export function ColorChip(props) {
  // eslint-disable-next-line solid/reactivity
  const {['class']: clss, ...spreadProps} = props;
  return (<span
        label={props.value}
        class={`chip ${clss ? clss : ""}`}
        style={{ '--bg-color': `${getColor(props.value)}` }}
        {...spreadProps}>
      {props.value}
    </span>);
}

// vim: tabstop=2 shiftwidth=2 expandtab
