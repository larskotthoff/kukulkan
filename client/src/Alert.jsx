import TaskAlt from "@suid/icons-material/TaskAlt";
import WarningAmber from "@suid/icons-material/WarningAmber";
import ErrorOutline from "@suid/icons-material/ErrorOutline";

export function Alert(props) {
  const cols = { 'success': 'green', 'warning': 'yellow', 'error': 'red' };
  return (<div
        class="alert"
        style={{ 'border': `3px solid ${cols[props.severity]}` }}
        {...props}>
      {props.severity === "success" && <TaskAlt/>}
      {props.severity === "warning" && <WarningAmber/>}
      {props.severity === "error" && <ErrorOutline/>}
      <span>{props.children}</span>
    </div>);
}

// vim: tabstop=2 shiftwidth=2 expandtab
