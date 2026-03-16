import { getRequestEvent } from "solid-js/web";
import { createRouterComponent } from "./components.jsx";
function getPath(url) {
    const u = new URL(url);
    return u.pathname + u.search;
}
export function StaticRouter(props) {
    let e;
    const obj = {
        value: props.url || ((e = getRequestEvent()) && getPath(e.request.url)) || "",
    };
    return createRouterComponent({
        signal: [() => obj, next => Object.assign(obj, next)]
    })(props);
}
