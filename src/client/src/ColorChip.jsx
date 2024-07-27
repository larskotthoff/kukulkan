import { Chip } from "@suid/material";
import { getColor } from "./utils.js";

export const ColorChip = (props) => {
  return (<Chip
    label={props.value}
    class="chip"
    style={{ '--bg-color': `${getColor(props.value)}` }}
    {...props}
    />);
};

// vim: tabstop=2 shiftwidth=2 expandtab
