import TaskAlt from "@suid/icons-material/TaskAlt";
import WarningAmber from "@suid/icons-material/WarningAmber";
import ErrorOutline from "@suid/icons-material/ErrorOutline";

export function Alert(props) {
  const cols = { 'success': 'green', 'warning': 'yellow', 'error': 'red' },
        {['class']: clss, severity, children, ...spreadProps} = props;
  return (<div
        class={`alert ${clss}`}
        style={{ 'border': `3px solid ${cols[severity]}` }}
        {...spreadProps}>
      {severity === "success" && <TaskAlt/>}
      {severity === "warning" && <WarningAmber/>}
      {severity === "error" && <ErrorOutline/>}
      <span>{children}</span>
    </div>);
}

// vim: tabstop=2 shiftwidth=2 expandtab
