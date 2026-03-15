-- =====================================================
-- チャットリアクション機能 - マイグレーション
-- Supabase Dashboard > SQL Editor で実行してください
-- =====================================================

create table if not exists study_chat_reactions (
  id bigint generated always as identity primary key,
  message_id bigint references study_chat(id) on delete cascade,
  member_id text references study_members(id),
  emoji text not null,
  created_at timestamptz default now(),
  unique(message_id, member_id, emoji)
);

-- Realtime 有効化
alter publication supabase_realtime add table study_chat_reactions;
