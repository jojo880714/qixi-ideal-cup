import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getClientIp, checkRateLimit } from "@/lib/rateLimit";
import { sanitizeNickname } from "@/lib/sanitize";
import { getSupabaseAnonClient } from "@/lib/supabase/client";
import { InvalidResultSubmissionError, validateResultSubmission } from "@/lib/results";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  const { success } = await checkRateLimit(ip);
  if (!success) {
    return NextResponse.json({ error: "Too many requests, please try again shortly." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let submission;
  try {
    submission = validateResultSubmission(body);
  } catch (err) {
    const message = err instanceof InvalidResultSubmissionError ? err.message : "Invalid submission";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const nickname = sanitizeNickname((body as Record<string, unknown>).nickname);
  const id = randomUUID();

  const supabase = getSupabaseAnonClient();
  const { error } = await supabase.from("results").insert({
    id,
    mode: submission.mode,
    persona_key: submission.personaKey,
    champion_id: submission.championId,
    final_four_ids: submission.finalFourIds,
    nickname,
  });

  if (error) {
    return NextResponse.json({ error: "Failed to save result" }, { status: 500 });
  }

  return NextResponse.json({ id }, { status: 201 });
}
