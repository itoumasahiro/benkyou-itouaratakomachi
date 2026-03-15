import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// 残高計算
async function getBalance(memberId: string): Promise<number> {
  const { data } = await supabaseAdmin
    .from("study_points")
    .select("amount")
    .eq("to_member_id", memberId);
  return (data ?? []).reduce((sum, r) => sum + r.amount, 0);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const memberId = searchParams.get("memberId");
  if (!memberId) return NextResponse.json({ error: "memberId required" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("study_points")
    .select("*, from_member:study_members!study_points_from_member_id_fkey(*)")
    .eq("to_member_id", memberId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const balance = (data ?? []).reduce((sum, r) => sum + r.amount, 0);
  return NextResponse.json({ balance, history: data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { to_member_id, from_member_id, amount, reason, type } = body;

  // spent の場合は残高確認
  if (type === "spent") {
    const balance = await getBalance(to_member_id);
    if (balance < Math.abs(amount)) {
      return NextResponse.json({ error: "ポイントが足りません" }, { status: 400 });
    }
  }

  const { data, error } = await supabaseAdmin
    .from("study_points")
    .insert({ to_member_id, from_member_id, amount, reason, type: type ?? "earned" })
    .select("*, from_member:study_members!study_points_from_member_id_fkey(*)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
