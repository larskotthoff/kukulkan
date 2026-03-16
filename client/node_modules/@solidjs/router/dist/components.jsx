import { createMemo, mergeProps, splitProps } from "solid-js";
import { useHref, useLocation, useNavigate, useResolvedPath } from "./routing.js";
import { normalizePath } from "./utils.js";
export function A(props) {
    props = mergeProps({ inactiveClass: "inactive", activeClass: "active" }, props);
    const [, rest] = splitProps(props, [
        "href",
        "state",
        "class",
        "activeClass",
        "inactiveClass",
        "end"
    ]);
    const to = useResolvedPath(() => props.href);
    const href = useHref(to);
    const location = useLocation();
    const isActive = createMemo(() => {
        const to_ = to();
        if (to_ === undefined)
            return [false, false];
        const path = normalizePath(to_.split(/[?#]/, 1)[0]).toLowerCase();
        const loc = decodeURI(normalizePath(location.pathname).toLowerCase());
        return [props.end ? path === loc : loc.startsWith(path + "/") || loc === path, path === loc];
    });
    return (<a {...rest} href={href() || props.href} state={JSON.stringify(props.state)} classList={{
            ...(props.class && { [props.class]: true }),
            [props.inactiveClass]: !isActive()[0],
            [props.activeClass]: isActive()[0],
            ...rest.classList
        }} link aria-current={isActive()[1] ? "page" : undefined}/>);
}
export function Navigate(props) {
    const navigate = useNavigate();
    const location = useLocation();
    const { href, state } = props;
    const path = typeof href === "function" ? href({ navigate, location }) : href;
    navigate(path, { replace: true, state });
    return null;
}
