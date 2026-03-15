import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const memberId = searchParams.get("memberId");
  let query = supabaseAdmin
    .from("study_scores")
    .select("*, subject:study_subjects(*)")
    .order("date", { ascending: false });
  if (memberId) query = query.eq("member_id", memberId);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { member_id, subject_id, name, test_type, score, max, date } = body;
  const { data, error } = await supabaseAdmin
    .from("study_scores")
    .insert({ member_id, subject_id, name, test_type: test_type || "other", score, max: max || 100, date })
    .select("*, subject:study_subjects(*)")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
