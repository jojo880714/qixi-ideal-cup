import { describe, expect, it } from "vitest";
import { getClientIp } from "./rateLimit";

describe("getClientIp", () => {
  it("reads the first IP from x-forwarded-for", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.5, 10.0.0.1" });
    expect(getClientIp(headers)).toBe("203.0.113.5");
  });

  it("falls back to x-real-ip", () => {
    const headers = new Headers({ "x-real-ip": "198.51.100.7" });
    expect(getClientIp(headers)).toBe("198.51.100.7");
  });

  it("falls back to 'unknown' when no IP header is present", () => {
    expect(getClientIp(new Headers())).toBe("unknown");
  });
});
