import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const memberId = searchParams.get("memberId");
  let query = getSupabaseAdmin().from("study_subjects").select("*").order("sort_order");
  if (memberId) query = query.eq("member_id", memberId);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { member_id, name, emoji, color } = body;
  const id = `${name}_${member_id}_${Date.now()}`;
  const { data: existing } = await getSupabaseAdmin()
    .from("study_subjects")
    .select("sort_order")
    .eq("member_id", member_id)
    .order("sort_order", { ascending: false })
    .limit(1);
  const sort_order = existing && existing.length > 0 ? existing[0].sort_order + 1 : 1;
  const { data, error } = await getSupabaseAdmin()
    .from("study_subjects")
    .insert({ id, member_id, name, emoji, color, sort_order })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const { error } = await getSupabaseAdmin().from("study_subjects").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
