import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const memberId = searchParams.get("memberId");
  const date = searchParams.get("date");
  let query = supabaseAdmin
    .from("study_todos")
    .select("*, subject:study_subjects(*)")
    .order("created_at");
  if (memberId) query = query.eq("member_id", memberId);
  if (date) query = query.eq("date", date);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { member_id, text, subject_id, date } = body;
  const { data, error } = await supabaseAdmin
    .from("study_todos")
    .insert({ member_id, text, subject_id, date, done: false })
    .select("*, subject:study_subjects(*)")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, done, text } = body;
  const updates: Record<string, unknown> = {};
  if (done !== undefined) updates.done = done;
  if (text !== undefined) updates.text = text;
  const { data, error } = await supabaseAdmin
    .from("study_todos")
    .update(updates)
    .eq("id", id)
    .select("*, subject:study_subjects(*)")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const { error } = await supabaseAdmin.from("study_todos").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
