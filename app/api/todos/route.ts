import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const memberId = searchParams.get("memberId");
  const date = searchParams.get("date");
  let query = getSupabaseAdmin()
    .from("study_todos")
    .select("*, subject:study_subjects(*)")
    .order("created_at");
  if (memberId) query = query.eq("member_id", memberId);
  if (date) query = query.eq("date", date);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

const RECORD_POINTS: Record<string, number> = {
  homework: 2,
  self_study: 5,
};

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { member_id, text, subject_id, date, record_type, content_type } = body;

  const isStudyRecord = record_type === "homework" || record_type === "self_study";

  // 1日1回制限：宿題・自習はその日すでに同じ種別の記録がある場合は拒否
  if (isStudyRecord) {
    const { data: existing } = await getSupabaseAdmin()
      .from("study_todos")
      .select("id")
      .eq("member_id", member_id)
      .eq("date", date)
      .eq("record_type", record_type)
      .limit(1);
    if (existing && existing.length > 0) {
      const label = record_type === "homework" ? "宿題" : "じしゅう";
      return NextResponse.json({ error: `今日の${label}はもうきろくしたよ！` }, { status: 400 });
    }
  }

  const insertData: Record<string, unknown> = {
    member_id,
    text: text ?? content_type ?? "",
    subject_id,
    date,
    done: isStudyRecord ? true : false,
    ...(record_type ? { record_type } : {}),
    ...(content_type ? { content_type } : {}),
  };

  const { data, error } = await getSupabaseAdmin()
    .from("study_todos")
    .insert(insertData)
    .select("*, subject:study_subjects(*)")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 宿題・自習きろく時はポイントを自動付与
  if (isStudyRecord) {
    const points = RECORD_POINTS[record_type];
    const subjectName = (data as { subject?: { name?: string } }).subject?.name ?? "";
    const label = record_type === "homework" ? "宿題" : "じしゅう";
    await getSupabaseAdmin().from("study_points").insert({
      to_member_id: member_id,
      from_member_id: member_id,
      amount: points,
      reason: `${subjectName} ${content_type} (${label})`,
      type: "earned",
    });
  }

  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, done, text } = body;
  const updates: Record<string, unknown> = {};
  if (done !== undefined) updates.done = done;
  if (text !== undefined) updates.text = text;
  const { data, error } = await getSupabaseAdmin()
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
  const { error } = await getSupabaseAdmin().from("study_todos").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
