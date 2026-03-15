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

// テスト結果に応じたポイント計算（100%:15pt, 80-99%:10pt, 60-79%:5pt, それ以下:1pt）
function calcPointsFromScore(score: number, max: number): number {
  const pct = max > 0 ? (score / max) * 100 : 0;
  if (pct >= 100) return 15;
  if (pct >= 80) return 10;
  if (pct >= 60) return 5;
  return 1; // がんばったねポイント
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { member_id, subject_id, name, test_type, score, max, date, image_url } = body;
  const maxVal = max || 100;
  const { data, error } = await supabaseAdmin
    .from("study_scores")
    .insert({ member_id, subject_id, name, test_type: test_type || "other", score, max: maxVal, date, image_url: image_url || null })
    .select("*, subject:study_subjects(*)")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // テスト結果に応じてポイント付与（自己獲得として from_member_id = member_id）
  const points = calcPointsFromScore(score, maxVal);
  await supabaseAdmin.from("study_points").insert({
    to_member_id: member_id,
    from_member_id: member_id,
    amount: points,
    reason: `テスト「${name}」で ${score}/${maxVal}点！`,
    type: "earned",
  });

  return NextResponse.json({ ...data, points_earned: points });
}
