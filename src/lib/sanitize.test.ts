import { describe, expect, it } from "vitest";
import { DEFAULT_NICKNAME, NICKNAME_MAX_LENGTH, sanitizeNickname } from "./sanitize";

describe("sanitizeNickname", () => {
  it("passes through a normal Chinese nickname unchanged", () => {
    expect(sanitizeNickname("週五夜的孤獨美食家")).toBe("週五夜的孤獨美食家");
  });

  it("strips HTML/script-like payloads", () => {
    // Angle brackets are stripped; the remaining text is then truncated to
    // NICKNAME_MAX_LENGTH like any other input.
    expect(sanitizeNickname("<script>alert(1)</script>")).toBe("scriptalert(");
    expect(sanitizeNickname("<img src=x onerror=alert(1)>")).not.toMatch(/[<>]/);
  });

  it("strips explicit URLs", () => {
    expect(sanitizeNickname("hi https://evil.example.com/path 你好")).toBe("hi 你好");
  });

  it("strips bare domains without a scheme", () => {
    expect(sanitizeNickname("找我 t.me/abc 聊")).toBe("找我 聊");
  });

  it("removes control and bidi-override characters", () => {
    // Built from code points rather than typed literally — these are
    // invisible/reordering characters that must never appear as raw bytes
    // in source.
    const rtlOverride = String.fromCodePoint(0x202e);
    const withControls = `abc ${rtlOverride}123`;
    expect(sanitizeNickname(withControls)).toBe("abc 123");
  });

  it("removes zero-width characters", () => {
    const zwsp = String.fromCodePoint(0x200b);
    const zwnj = String.fromCodePoint(0x200c);
    expect(sanitizeNickname(`a${zwsp}b${zwnj}c`)).toBe("abc");
  });

  it("strips template/shell-injection-prone symbols", () => {
    expect(sanitizeNickname("${evil}`cmd`\\path")).toBe("evilcmdpath");
  });

  it("truncates to the max length in Unicode code points", () => {
    const long = "一二三四五六七八九十十一十二十三十四十五";
    const result = sanitizeNickname(long);
    expect(Array.from(result)).toHaveLength(NICKNAME_MAX_LENGTH);
    expect(result).toBe("一二三四五六七八九十十一");
  });

  it("collapses internal whitespace and trims", () => {
    expect(sanitizeNickname("  hi   there  ")).toBe("hi there");
  });

  it("falls back to the default nickname for empty or whitespace-only input", () => {
    expect(sanitizeNickname("")).toBe(DEFAULT_NICKNAME);
    expect(sanitizeNickname("   ")).toBe(DEFAULT_NICKNAME);
  });

  it("falls back to the default nickname when input becomes empty after sanitizing", () => {
    expect(sanitizeNickname("https://example.com")).toBe(DEFAULT_NICKNAME);
    expect(sanitizeNickname("<<<>>>")).toBe(DEFAULT_NICKNAME);
  });

  it("falls back to the default nickname for non-string input", () => {
    expect(sanitizeNickname(null)).toBe(DEFAULT_NICKNAME);
    expect(sanitizeNickname(undefined)).toBe(DEFAULT_NICKNAME);
    expect(sanitizeNickname(123)).toBe(DEFAULT_NICKNAME);
  });
});
