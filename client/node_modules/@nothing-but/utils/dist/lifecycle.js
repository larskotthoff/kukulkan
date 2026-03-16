export let onCleanup = () => {
    throw new Error("Cleanup handler not set. Call setCleanupHandler() first.");
};
export function setCleanupHandler(handler) {
    onCleanup = handler;
}
