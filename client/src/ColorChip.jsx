import Chip from "@suid/material/Chip";

import { getColor } from "./utils.js";

export function ColorChip(props) {
  const { ['class']: clss, ...newProps } = props;
  return (<Chip
    label={props.value}
    class={(clss ? clss + " " : "") + "chip"}
    style={{ '--bg-color': `${getColor(props.value)}` }}
    {...newProps}
    />);
}

// vim: tabstop=2 shiftwidth=2 expandtab
