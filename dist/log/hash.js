/** FNV-1a 32-bit hash of a string, as 8 hex chars. Fast, dependency-free, good enough for line identity. */
export function fnv1a(input) {
    let h = 0x811c9dc5;
    for (let i = 0; i < input.length; i++) {
        h ^= input.charCodeAt(i);
        h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h.toString(16).padStart(8, "0");
}
/** Hash a source line for blame. Blank or trivially short lines return null so they never attribute. */
export function lineKey(line) {
    const t = line.trim();
    if (t.length < 4)
        return null;
    if (/^[{}()\[\];,]+$/.test(t))
        return null;
    return fnv1a(t);
}
export function shortId(id) {
    return (id ?? "unknown").replace(/-/g, "").slice(0, 6);
}
