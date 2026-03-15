import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const MAX_SIZE = 350 * 1024; // 350KB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/heic"];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;
    const memberId = formData.get("memberId") as string | null;

    if (!file || !memberId) {
      return NextResponse.json({ error: "画像とmemberIdが必要です" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `ファイルサイズは350KB以下にしてください（現在: ${Math.round(file.size / 1024)}KB）` },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "JPEG、PNG、HEICのみ対応しています" }, { status: 400 });
    }

    const ext = file.type.includes("png") ? "png" : file.type.includes("heic") ? "heic" : "jpg";
    const path = `${memberId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data, error } = await supabaseAdmin.storage
      .from("score-images")
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      if (error.message?.includes("Bucket not found")) {
        return NextResponse.json(
          { error: "Storageバケット「score-images」がありません。Supabase Dashboard > Storage で作成してください。" },
          { status: 500 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: urlData } = supabaseAdmin.storage.from("score-images").getPublicUrl(data.path);
    return NextResponse.json({ url: urlData.publicUrl });
  } catch (e) {
    return NextResponse.json({ error: "アップロードに失敗しました" }, { status: 500 });
  }
}
