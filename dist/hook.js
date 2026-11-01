#!/usr/bin/env node
/**
 * Hook entry point. One event in on stdin, one line appended to the log, exit 0 no matter what.
 * A hook that fails would interrupt Claude; this one never does.
 */
import { readStdinJson } from "./hooks/input.js";
import { onPostToolUse, onSessionEnd, onSessionStart, onStop, onUserPromptSubmit } from "./hooks/handlers.js";
const event = process.argv[2] ?? "";
try {
    const input = readStdinJson();
    if (!input.session_id)
        process.exit(0); // not a Claude Code hook payload; never log garbage
    switch (event) {
        case "SessionStart": {
            const ctx = onSessionStart(input);
            if (ctx)
                process.stdout.write(ctx + "\n");
            break;
        }
        case "UserPromptSubmit":
            onUserPromptSubmit(input);
            break;
        case "PostToolUse":
            onPostToolUse(input);
            break;
        case "Stop":
            onStop(input);
            break;
        case "SessionEnd":
            onSessionEnd(input);
            break;
        default: break;
    }
}
catch (err) {
    if (process.env.TRAIL_DEBUG)
        process.stderr.write(`claude-trail hook ${event} failed: ${err.stack}\n`);
}
process.exit(0);
