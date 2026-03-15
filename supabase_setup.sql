-- =====================================================
-- べんきょう手帳 - Supabaseテーブル作成SQL
-- Supabase Dashboard > SQL Editor で実行してください
-- =====================================================

-- メンバーテーブル
create table if not exists study_members (
  id text primary key,
  display_name text not null,
  emoji text not null,
  color text not null,
  role text not null default 'child',
  grade text,
  school_level text default 'elementary',
  created_at timestamptz default now()
);

-- 教科テーブル（メンバーごとにカスタマイズ）
create table if not exists study_subjects (
  id text primary key,
  member_id text references study_members(id) on delete cascade,
  name text not null,
  emoji text not null,
  color text not null,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Todoテーブル
create table if not exists study_todos (
  id bigint primary key generated always as identity,
  member_id text references study_members(id) on delete cascade,
  text text not null,
  subject_id text references study_subjects(id),
  done boolean default false,
  date text not null,
  created_at timestamptz default now()
);

-- 勉強記録テーブル
create table if not exists study_logs (
  id bigint primary key generated always as identity,
  member_id text references study_members(id) on delete cascade,
  subject_id text references study_subjects(id),
  minutes int not null,
  date text not null,
  created_at timestamptz default now()
);

-- テスト点数テーブル
create table if not exists study_scores (
  id bigint primary key generated always as identity,
  member_id text references study_members(id) on delete cascade,
  subject_id text references study_subjects(id),
  name text not null,
  test_type text default 'other',
  score int not null,
  max int not null default 100,
  date text not null,
  created_at timestamptz default now()
);

-- 目標テーブル
create table if not exists study_goals (
  id bigint primary key generated always as identity,
  member_id text references study_members(id) on delete cascade,
  subject_id text references study_subjects(id),
  type text not null,
  target_value int not null,
  period text not null,
  created_at timestamptz default now()
);

-- チャットテーブル
create table if not exists study_chat (
  id bigint primary key generated always as identity,
  member_id text references study_members(id) on delete cascade,
  text text not null,
  created_at timestamptz default now()
);

-- RLS有効化（APIルート経由でservice_roleキーを使うため全許可）
alter table study_members enable row level security;
alter table study_subjects enable row level security;
alter table study_todos enable row level security;
alter table study_logs enable row level security;
alter table study_scores enable row level security;
alter table study_goals enable row level security;
alter table study_chat enable row level security;

-- service_roleは全操作許可（APIルートから使用）
create policy "service_role_all_members" on study_members for all using (true);
create policy "service_role_all_subjects" on study_subjects for all using (true);
create policy "service_role_all_todos" on study_todos for all using (true);
create policy "service_role_all_logs" on study_logs for all using (true);
create policy "service_role_all_scores" on study_scores for all using (true);
create policy "service_role_all_goals" on study_goals for all using (true);
create policy "service_role_all_chat" on study_chat for all using (true);

-- Realtimeを有効化（チャット用）
alter publication supabase_realtime add table study_chat;

-- =====================================================
-- 初期データ投入
-- =====================================================

-- 子供メンバー
insert into study_members (id, display_name, emoji, color, role, grade, school_level) values
  ('arata', 'あらた', '🦁', '#4ECDC4', 'child', '6年生', 'elementary'),
  ('komachi', 'こまち', '🌸', '#FF6B6B', 'child', '4年生', 'elementary')
on conflict (id) do nothing;

-- 家族メンバー（親・祖父母）
insert into study_members (id, display_name, emoji, color, role, grade, school_level) values
  ('papa', 'おとうさん', '👨', '#185a9d', 'parent', null, null),
  ('mama', 'おかあさん', '👩', '#f093fb', 'parent', null, null),
  ('ojii', 'おじいさん', '👴', '#96CEB4', 'parent', null, null),
  ('obaa', 'おばあさん', '👵', '#F7B731', 'parent', null, null)
on conflict (id) do nothing;

-- あらたの教科（小学生）
insert into study_subjects (id, member_id, name, emoji, color, sort_order) values
  ('kokugo_arata', 'arata', '国語', '📖', '#FF6B6B', 1),
  ('sansu_arata', 'arata', '算数', '🔢', '#4ECDC4', 2),
  ('rika_arata', 'arata', '理科', '🔬', '#45B7D1', 3),
  ('shakai_arata', 'arata', '社会', '🌍', '#96CEB4', 4),
  ('eigo_arata', 'arata', '英語', '🗣️', '#F7B731', 5)
on conflict (id) do nothing;

-- こまちの教科（小学生）
insert into study_subjects (id, member_id, name, emoji, color, sort_order) values
  ('kokugo_komachi', 'komachi', '国語', '📖', '#FF6B6B', 1),
  ('sansu_komachi', 'komachi', '算数', '🔢', '#4ECDC4', 2),
  ('rika_komachi', 'komachi', '理科', '🔬', '#45B7D1', 3),
  ('shakai_komachi', 'komachi', '社会', '🌍', '#96CEB4', 4),
  ('eigo_komachi', 'komachi', '英語', '🗣️', '#F7B731', 5)
on conflict (id) do nothing;
