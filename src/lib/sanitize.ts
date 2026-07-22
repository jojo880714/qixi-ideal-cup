/**
 * Strict nickname sanitizer. Nicknames are the only user-supplied text in
 * this product and are stored + rendered publicly (result card, OG image,
 * share text) with no login and no moderation queue, so this is the entire
 * XSS/abuse surface — sanitize defensively rather than just trust React's
 * default escaping downstream.
 */

export const NICKNAME_MAX_LENGTH = 12;
export const DEFAULT_NICKNAME = "神秘單身選手";

// C0/C1 control chars, zero-width chars, and bidi override chars (used to
// visually spoof text direction/content). Built from a string of \uXXXX
// escapes rather than a literal character class, so no raw control/bidi
// bytes are ever embedded in this source file.
const CONTROL_CHARS = new RegExp(
  "[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\uFEFF]",
  "g",
);


// URLs with an explicit scheme or "www." prefix.
const EXPLICIT_URL = /(?:https?:\/\/|www\.)\S+/gi;

// Bare domains without a scheme, e.g. "example.com" or "t.me/xxx".
const BARE_DOMAIN =
  /\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|net|org|io|co|me|tw|cc|xyz|link|gg|app|dev)(?:\/\S*)?\b/gi;

// Characters with no legitimate place in a display nickname.
const DISALLOWED_SYMBOLS = /[<>`${}\\]/g;

function stripUrls(input: string): string {
  return input.replace(EXPLICIT_URL, "").replace(BARE_DOMAIN, "");
}

/**
 * Sanitizes a raw nickname string: removes control/bidi characters, strips
 * URLs and HTML/template-injection-prone symbols, collapses whitespace, and
 * truncates to NICKNAME_MAX_LENGTH Unicode code points (grapheme-unaware but
 * safe for CJK text, which is the primary expected input). Falls back to
 * DEFAULT_NICKNAME if nothing usable remains.
 */
export function sanitizeNickname(raw: unknown): string {
  if (typeof raw !== "string") return DEFAULT_NICKNAME;

  let s = raw.normalize("NFKC");
  s = s.replace(CONTROL_CHARS, "");
  s = stripUrls(s);
  s = s.replace(DISALLOWED_SYMBOLS, "");
  s = s.trim().replace(/\s+/g, " ");

  const codePoints = Array.from(s);
  if (codePoints.length > NICKNAME_MAX_LENGTH) {
    s = codePoints.slice(0, NICKNAME_MAX_LENGTH).join("");
  }

  return s.length > 0 ? s : DEFAULT_NICKNAME;
}
