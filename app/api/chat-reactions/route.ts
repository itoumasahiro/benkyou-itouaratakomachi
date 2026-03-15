import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await getSupabaseAdmin()
    .from("study_chat_reactions")
    .select("*")
    .order("created_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { message_id, member_id, emoji, remove } = body;

  if (remove) {
    const { error } = await getSupabaseAdmin()
      .from("study_chat_reactions")
      .delete()
      .eq("message_id", message_id)
      .eq("member_id", member_id)
      .eq("emoji", emoji);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("study_chat_reactions")
    .upsert({ message_id, member_id, emoji }, { onConflict: "message_id,member_id,emoji" })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
