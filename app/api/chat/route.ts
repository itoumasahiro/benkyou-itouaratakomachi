import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await getSupabaseAdmin()
    .from("study_chat")
    .select("*, member:study_members(*)")
    .order("created_at", { ascending: true })
    .limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { member_id, text } = body;
  if (!text?.trim()) return NextResponse.json({ error: "text required" }, { status: 400 });
  const { data, error } = await getSupabaseAdmin()
    .from("study_chat")
    .insert({ member_id, text: text.trim() })
    .select("*, member:study_members(*)")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
