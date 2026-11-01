/**
 * Redaction runs at write time. Nothing secret-shaped ever reaches the log.
 * Users can also wrap anything in <private>...</private> to drop it entirely.
 */
const PATTERNS: Array<[RegExp, string]> = [
  [/<private>[\s\S]*?<\/private>/gi, "[private]"],
  [/sk-ant-[A-Za-z0-9_-]{10,}/g, "[redacted:anthropic-key]"],
  [/sk-[A-Za-z0-9]{20,}/g, "[redacted:api-key]"],
  [/gh[pousr]_[A-Za-z0-9]{20,}/g, "[redacted:github-token]"],
  [/github_pat_[A-Za-z0-9_]{20,}/g, "[redacted:github-token]"],
  [/xox[baprs]-[A-Za-z0-9-]{10,}/g, "[redacted:slack-token]"],
  [/AKIA[0-9A-Z]{16}/g, "[redacted:aws-key]"],
  [/\b\d{6,}:[A-Za-z0-9_-]{30,}\b/g, "[redacted:telegram-token]"],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, "[redacted:private-key]"],
  [/\b(eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,})\b/g, "[redacted:jwt]"],
  [/\b(password|passwd|secret|token|api[_-]?key)\s*[=:]\s*['"]?[^\s'"]{6,}/gi, "$1=[redacted]"],
  [/(https?:\/\/)[^\s/@:]+:[^\s/@]+@/g, "$1[redacted]@"],
];

export function redact(text: string): string {
  let out = text;
  for (const [re, rep] of PATTERNS) out = out.replace(re, rep);
  return out;
}

export function containsPrivateTag(text: string): boolean {
  return /<private>/i.test(text);
}
