-- =====================================================
-- ポイント・ごほうびシステム追加SQL
-- Supabase Dashboard > SQL Editor で実行してください
-- =====================================================

-- ポイント履歴テーブル
create table if not exists study_points (
  id bigint primary key generated always as identity,
  to_member_id text references study_members(id) on delete cascade,   -- もらった人
  from_member_id text references study_members(id) on delete cascade, -- あげた人（親）
  amount int not null,         -- ポイント数（正=付与, 負=消費）
  reason text not null,        -- 理由「算数100点！」「アイス」など
  type text not null default 'earned',  -- 'earned'(付与) | 'spent'(消費)
  created_at timestamptz default now()
);

-- ごほうびカタログテーブル
create table if not exists study_rewards (
  id bigint primary key generated always as identity,
  name text not null,           -- 「アイス」「おかし」
  emoji text not null,          -- 🍦
  cost int not null,            -- 必要ポイント
  description text,             -- 説明
  active boolean default true,  -- 表示中かどうか
  created_at timestamptz default now()
);

-- ごほうびリクエストテーブル
create table if not exists study_reward_requests (
  id bigint primary key generated always as identity,
  member_id text references study_members(id) on delete cascade,    -- 頼んだ子供
  reward_id bigint references study_rewards(id) on delete cascade,  -- ごほうびの種類
  status text not null default 'pending',  -- 'pending' | 'approved' | 'rejected'
  message text,                             -- 子供からのメッセージ
  parent_note text,                         -- 親からの一言
  created_at timestamptz default now()
);

-- RLS
alter table study_points enable row level security;
alter table study_rewards enable row level security;
alter table study_reward_requests enable row level security;
create policy "all_points" on study_points for all using (true);
create policy "all_rewards" on study_rewards for all using (true);
create policy "all_reward_requests" on study_reward_requests for all using (true);

-- デフォルトのごほうびカタログ
insert into study_rewards (name, emoji, cost, description) values
  ('アイス',         '🍦', 50,  'すきなアイスを1こ'),
  ('おかし',         '🍬', 30,  'すきなおかしを1こ'),
  ('ジュース',       '🧃', 20,  'すきなジュースを1ぽん'),
  ('ゲーム30分',     '🎮', 80,  'ゲームを30ふんやっていい'),
  ('マンガ1さつ',   '📚', 60,  'すきなマンガを1さつかってもらえる'),
  ('すきなごはん',   '🍽️', 100, 'すきなごはんをリクエストできる'),
  ('おそとあそび',   '🌳', 40,  'こうえんであそべる'),
  ('おてつだいパス', '✨', 150, 'おてつだい1かいやらなくていい')
on conflict do nothing;
