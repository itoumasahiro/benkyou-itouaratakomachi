-- =====================================================
-- テスト写真記録機能 - マイグレーション
-- Supabase Dashboard > SQL Editor で実行してください
-- =====================================================

-- study_scores に image_url カラム追加
alter table study_scores add column if not exists image_url text;

-- =====================================================
-- Storage バケット作成（必須）
-- Supabase Dashboard > Storage > New bucket で作成
-- ・バケット名: score-images
-- ・Public bucket: オン（写真を表示するため）
-- ・File size limit: 350 KB（0.35 MB）
-- =====================================================
