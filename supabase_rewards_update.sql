-- =====================================================
-- ごほうびショップ変更マイグレーション
-- Supabase Dashboard > SQL Editor で実行してください
-- =====================================================

-- ポイント変更: ジュース 20→40, おかし 30→40, マンガ1さつ→本１冊 60→70
update study_rewards set cost = 40 where name = 'ジュース';
update study_rewards set cost = 40 where name = 'おかし';
update study_rewards set name = '本１冊', description = 'すきな本を1さつかってもらえる', cost = 70 where name = 'マンガ1さつ';

-- 非表示: おそとあそび, おてつだいパス
update study_rewards set active = false where name in ('おそとあそび', 'おてつだいパス');
