import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { checkRateLimitN, getClientIp } from "@/lib/rateLimit";
import { getSupabaseAnonClient } from "@/lib/supabase/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EVENT_NAMES = new Set([
  "visit",
  "quiz_start",
  "quiz_complete",
  "result_view",
  "result_revisit",
  "poster_download",
  "share_copy",
  "signup_click",
]);

/**
 * Hashes the client IP with a server-only salt so we can count unique
 * visitors WITHOUT ever storing a real IP address (privacy). Truncated —
 * we only need it stable for dedupe, not reversible.
 */
function hashIp(ip: string): string {
  const salt = process.env.TRACK_IP_SALT ?? "dev-salt";
  return createHash("sha256").update(`${ip}:${salt}`).digest("hex").slice(0, 32);
}

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);

  // Lenient limit: analytics is high-volume but this still caps abuse that
  // could bloat the events table.
  const { success } = await checkRateLimitN(`track:${ip}`, 120, 60);
  if (!success) return NextResponse.json({ ok: false }, { status: 429 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const { name, sessionId, personaKey, mode } = (body ?? {}) as Record<string, unknown>;

  if (typeof name !== "string" || !EVENT_NAMES.has(name)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const supabase = getSupabaseAnonClient();
  await supabase.rpc("track_event", {
    p_name: name,
    p_ip_hash: hashIp(ip),
    p_session: typeof sessionId === "string" ? sessionId.slice(0, 64) : "",
    p_persona: typeof personaKey === "string" ? personaKey.slice(0, 16) : "",
    p_mode: mode === 64 || mode === 128 ? mode : null,
  });

  // Fire-and-forget semantics: never block the UX on analytics.
  return NextResponse.json({ ok: true });
}
