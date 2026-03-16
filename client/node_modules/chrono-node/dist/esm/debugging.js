export class BufferedDebugHandler {
    buffer;
    constructor() {
        this.buffer = [];
    }
    debug(debugMsg) {
        this.buffer.push(debugMsg);
    }
    executeBufferedBlocks() {
        const logs = this.buffer.map((block) => block());
        this.buffer = [];
        return logs;
    }
}
//# sourceMappingURL=debugging.js.map