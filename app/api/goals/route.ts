import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const memberId = searchParams.get("memberId");
  const period = searchParams.get("period");
  let query = supabaseAdmin
    .from("study_goals")
    .select("*, subject:study_subjects(*)")
    .order("created_at");
  if (memberId) query = query.eq("member_id", memberId);
  if (period) query = query.eq("period", period);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { member_id, subject_id, type, target_value, period } = body;
  const { data, error } = await supabaseAdmin
    .from("study_goals")
    .insert({ member_id, subject_id, type, target_value, period })
    .select("*, subject:study_subjects(*)")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const { error } = await supabaseAdmin.from("study_goals").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
