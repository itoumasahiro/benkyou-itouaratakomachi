import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const memberId = searchParams.get("memberId");
  const status = searchParams.get("status");

  let query = getSupabaseAdmin()
    .from("study_reward_requests")
    .select("*, member:study_members(*), reward:study_rewards(*)")
    .order("created_at", { ascending: false });

  if (memberId) query = query.eq("member_id", memberId);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { member_id, reward_id, message } = body;

  // 残高確認
  const { data: pointData } = await getSupabaseAdmin()
    .from("study_points")
    .select("amount")
    .eq("to_member_id", member_id);
  const balance = (pointData ?? []).reduce((sum, r) => sum + r.amount, 0);

  const { data: reward } = await getSupabaseAdmin()
    .from("study_rewards")
    .select("cost, name, emoji")
    .eq("id", reward_id)
    .single();

  if (!reward) return NextResponse.json({ error: "ごほうびが見つかりません" }, { status: 404 });
  if (balance < reward.cost) return NextResponse.json({ error: "ポイントが足りません", balance, cost: reward.cost }, { status: 400 });

  const { data, error } = await getSupabaseAdmin()
    .from("study_reward_requests")
    .insert({ member_id, reward_id, message, status: "pending" })
    .select("*, member:study_members(*), reward:study_rewards(*)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // チャットに自動通知
  await getSupabaseAdmin().from("study_chat").insert({
    member_id,
    text: `${reward.emoji} ${reward.name} をたのんだよ！（${reward.cost}ポイント）${message ? ` 「${message}」` : ""}`,
  });

  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, status, parent_note, approved_by } = body;

  // リクエスト情報取得
  const { data: request } = await getSupabaseAdmin()
    .from("study_reward_requests")
    .select("*, reward:study_rewards(*)")
    .eq("id", id)
    .single();

  if (!request) return NextResponse.json({ error: "リクエストが見つかりません" }, { status: 404 });

  const { data, error } = await getSupabaseAdmin()
    .from("study_reward_requests")
    .update({ status, parent_note })
    .eq("id", id)
    .select("*, member:study_members(*), reward:study_rewards(*)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (status === "approved") {
    // ポイント消費
    await getSupabaseAdmin().from("study_points").insert({
      to_member_id: request.member_id,
      from_member_id: approved_by,
      amount: -request.reward.cost,
      reason: `${request.reward.emoji} ${request.reward.name}`,
      type: "spent",
    });
    // チャットに承認通知
    await getSupabaseAdmin().from("study_chat").insert({
      member_id: approved_by,
      text: `✅ ${data.member?.display_name}の「${request.reward.emoji} ${request.reward.name}」を承認したよ！${parent_note ? ` ${parent_note}` : ""}`,
    });
  } else if (status === "rejected") {
    // チャットに却下通知
    await getSupabaseAdmin().from("study_chat").insert({
      member_id: approved_by,
      text: `❌ ${data.member?.display_name}の「${request.reward.emoji} ${request.reward.name}」は今回はダメだよ。${parent_note ? `理由：${parent_note}` : ""}`,
    });
  }

  return NextResponse.json(data);
}
