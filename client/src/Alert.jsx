import { Icon, ErrorOutline, TaskAlt, WarningAmber } from "./UiUtils.jsx";

export function Alert(props) {
  const cols = { 'success': 'green', 'warning': 'yellow', 'error': 'red' },
        // eslint-disable-next-line solid/reactivity
        {['class']: clss, severity, children, ...spreadProps} = props;
  return (<div
        class={`alert ${clss ? clss : ""}`}
        style={{ 'border': `3px ridge ${cols[severity]}` }}
        {...spreadProps}>
      {severity === "success" && <Icon icon={TaskAlt}/>}
      {severity === "warning" && <Icon icon={WarningAmber}/>}
      {severity === "error" && <Icon icon={ErrorOutline}/>}
      <span>{children}</span>
    </div>);
}

// vim: tabstop=2 shiftwidth=2 expandtab
