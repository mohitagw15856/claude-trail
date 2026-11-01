/**
 * Correction detection: did the user just steer Claude? Works in English and 中文.
 * Strong = the prompt opens with a steering phrase. Weak = it appears somewhere inside.
 */
export type Lang = "en" | "zh";
export interface Correction { strength: "strong" | "weak"; lang: Lang; text: string }

const EN_OPEN = /^(no[,.!]?\s|nope|don'?t\b|do not\b|never\b|stop\b|please (don'?t|stop|never|always)\b|always\b|from now on\b|not like that|that'?s (wrong|not right)|wrong[,.!]|instead[,]? |avoid\b|prefer\b|use .{1,40}\binstead|rather than|you should(n'?t)?\b|make sure (you )?(always|never)\b|remember to\b|next time\b)/i;
const EN_INSIDE = /\b(don'?t|do not|never|stop doing|always|from now on|instead of|avoid|please don'?t|next time|remember to)\b/i;
const ZH_OPEN = /^(不要|别|不准|不用|不可以|请不要|请别|永远不|以后(都|不|请)?|总是|每次(都)?|请用|改用|换成|不是这样|错了|不对|应该|必须|记得|下次|停止|别再)/;
const ZH_INSIDE = /(不要|别再|不准|永远不|以后(都|不)|总是|每次都|请用|改用|换成|不是这样|错了|不对|应该|必须|记得|下次)/;

export function detectCorrection(prompt: string): Correction | null {
  const p = prompt.trim();
  if (!p || p.length > 600) return null;         // long prompts are briefs, not corrections
  if (p.startsWith("/")) return null;             // slash commands
  const hasZh = /[一-鿿]/.test(p);
  const text = p.replace(/\s+/g, " ").slice(0, 200);
  if (hasZh) {
    if (ZH_OPEN.test(p)) return { strength: "strong", lang: "zh", text };
    if (ZH_INSIDE.test(p)) return { strength: "weak", lang: "zh", text };
  }
  if (EN_OPEN.test(p)) return { strength: "strong", lang: "en", text };
  if (EN_INSIDE.test(p)) return { strength: "weak", lang: "en", text };
  return null;
}

/** Normalise a correction so repeats cluster: lower-case, strip punctuation and filler. */
export function normalizeCorrection(text: string): string {
  return text
    .toLowerCase()
    .replace(/^(no[,.!]?\s*|nope[,.!]?\s*|please\s+|hey[,]?\s*)/, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\b(the|a|an|to|of|and|it|that|this|just|really|again)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}
