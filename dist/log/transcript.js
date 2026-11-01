import { readFileSync, existsSync } from "node:fs";
import { usd } from "./pricing.js";
function textOf(content) {
    if (typeof content === "string")
        return content;
    if (Array.isArray(content)) {
        return content
            .filter((b) => b && b.type === "text" && typeof b.text === "string")
            .map((b) => b.text)
            .join("\n");
    }
    return "";
}
/** Parse a Claude Code transcript (JSONL). Tolerates partial lines and unknown record types. */
export function summarizeTranscript(path, overrides) {
    const out = {
        costUsd: 0, exact: false,
        usage: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        models: {}, primaryModel: "", linesAdded: 0, linesRemoved: 0, turns: 0, lastAssistantText: "",
    };
    if (!path || !existsSync(path))
        return out;
    let raw = "";
    try {
        raw = readFileSync(path, "utf8");
    }
    catch {
        return out;
    }
    let costState = null;
    for (const line of raw.split("\n")) {
        if (!line.trim())
            continue;
        let o;
        try {
            o = JSON.parse(line);
        }
        catch {
            continue;
        }
        if (o.type === "cost-state") {
            costState = o;
            continue;
        }
        if (o.type === "assistant" && o.message) {
            const model = o.message.model ?? "unknown";
            const u = o.message.usage ?? {};
            const add = {
                input: u.input_tokens ?? 0, output: u.output_tokens ?? 0,
                cacheRead: u.cache_read_input_tokens ?? 0, cacheWrite: u.cache_creation_input_tokens ?? 0,
            };
            const m = (out.models[model] ??= { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, usd: 0 });
            m.input += add.input;
            m.output += add.output;
            m.cacheRead += add.cacheRead;
            m.cacheWrite += add.cacheWrite;
            out.usage.input += add.input;
            out.usage.output += add.output;
            out.usage.cacheRead += add.cacheRead;
            out.usage.cacheWrite += add.cacheWrite;
            out.turns++;
            const t = textOf(o.message.content);
            if (t.trim())
                out.lastAssistantText = t;
            if (o.timestamp) {
                out.firstTs ??= o.timestamp;
                out.lastTs = o.timestamp;
            }
        }
    }
    for (const [model, m] of Object.entries(out.models))
        m.usd = usd(model, m, overrides);
    out.costUsd = Object.values(out.models).reduce((a, m) => a + m.usd, 0);
    if (costState) {
        out.exact = typeof costState.totalCostUSD === "number";
        if (out.exact)
            out.costUsd = costState.totalCostUSD;
        out.linesAdded = costState.totalLinesAdded ?? 0;
        out.linesRemoved = costState.totalLinesRemoved ?? 0;
        if (costState.modelUsage) {
            for (const [model, mu] of Object.entries(costState.modelUsage)) {
                out.models[model] = {
                    input: mu.inputTokens ?? 0, output: mu.outputTokens ?? 0,
                    cacheRead: mu.cacheReadInputTokens ?? 0, cacheWrite: mu.cacheCreationInputTokens ?? 0,
                    usd: mu.costUSD ?? usd(model, { input: mu.inputTokens ?? 0, output: mu.outputTokens ?? 0, cacheRead: mu.cacheReadInputTokens ?? 0, cacheWrite: mu.cacheCreationInputTokens ?? 0 }, overrides),
                };
            }
        }
    }
    let best = 0;
    for (const [model, m] of Object.entries(out.models)) {
        const w = m.output + m.input;
        if (w >= best) {
            best = w;
            out.primaryModel = model;
        }
    }
    return out;
}
