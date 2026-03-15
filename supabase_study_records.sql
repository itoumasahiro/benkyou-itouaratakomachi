-- =====================================================
-- 宿題・自習きろく機能 - マイグレーション
-- Supabase Dashboard > SQL Editor で実行してください
-- =====================================================

-- study_todos に record_type と content_type カラム追加
alter table study_todos add column if not exists record_type text; -- 'homework' | 'self_study'
alter table study_todos add column if not exists content_type text; -- ドリル / よみ / プリント / 問題集 / 復習 / その他
