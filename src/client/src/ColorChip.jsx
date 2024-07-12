import { Chip } from "@suid/material";
import { getColor } from "./utils.js";
import invert from 'invert-color';

export function ColorChip(props) {
  return (<Chip
    label={props.value}
    class="chip"
    style={{ 'background-color': `${getColor(props.value)}`, color: `${invert(getColor(props.value), true)}` }}
    {...props}
    />);
}

// vim: tabstop=2 shiftwidth=2 expandtab
