export function intersection(a, b) {
    const result = new Set();
    for (const item of a) {
        if (b.has(item))
            result.add(item);
    }
    return result;
}
export function difference(a, b) {
    const result = new Set();
    for (const item of a) {
        if (!b.has(item))
            result.add(item);
    }
    return result;
}
export function union(a, b) {
    const result = new Set(a);
    for (const item of b)
        result.add(item);
    return result;
}
