"use client";
import type { Member, Subject, StudyLog, Score, Todo } from "@/lib/types";

interface MemberData {
  member: Member;
  logs: StudyLog[];
  scores: Score[];
  todos: Todo[];
}

interface Props {
  member: Member;
  subjects: Subject[];
  studyLogs: StudyLog[];
  scores: Score[];
  todos: Todo[];
  allMembersData: MemberData[];
}

function getToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// 宿題・自習きろくがある日の連続日数
function getStreak(todos: Todo[]): number {
  const dates = [...new Set(todos.filter((t) => t.record_type != null).map((t) => t.date))].sort().reverse();
  if (dates.length === 0) return 0;
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < dates.length; i++) {
    const expected = new Date(today);
    expected.setDate(today.getDate() - i);
    const expectedStr = `${expected.getFullYear()}-${String(expected.getMonth() + 1).padStart(2, "0")}-${String(expected.getDate()).padStart(2, "0")}`;
    if (dates[i] === expectedStr) streak++;
    else break;
  }
  return streak;
}

// 今週（7日以内）の宿題・自習きろく件数
function getWeekRecords(todos: Todo[]): number {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 6);
  const weekAgoStr = `${weekAgo.getFullYear()}-${String(weekAgo.getMonth() + 1).padStart(2, "0")}-${String(weekAgo.getDate()).padStart(2, "0")}`;
  return todos.filter((t) => t.record_type != null && t.date >= weekAgoStr).length;
}

export default function StatsTab({ member, subjects, scores, todos, allMembersData }: Props) {
  const today = getToday();

  const homeworkAll    = todos.filter((t) => t.record_type === "homework");
  const selfStudyAll   = todos.filter((t) => t.record_type === "self_study");
  const completedTodos = todos.filter((t) => t.done && !t.record_type).length;
  const streak         = getStreak(todos);

  // 教科別：きろく件数 + テスト平均
  const subjectTotals = subjects.map((s) => {
    const recordCount = todos.filter((t) => t.record_type != null && t.subject_id === s.id).length;
    const sc = scores.filter((sc) => sc.subject_id === s.id);
    const avgScore = sc.length ? Math.round(sc.reduce((sum, sc) => sum + (sc.score / sc.max) * 100, 0) / sc.length) : null;
    return { ...s, recordCount, avgScore };
  });
  const maxCount = Math.max(...subjectTotals.map((s) => s.recordCount), 1);

  // みんなの今週比較
  const childMembers = allMembersData.filter((d) => d.member.role === "child");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

      {/* サマリーカード */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
        {[
          { emoji: "📚", value: `${homeworkAll.length}回`, label: "宿題きろく" },
          { emoji: "⭐", value: `${selfStudyAll.length}回`, label: "自習きろく" },
          { emoji: "🔥", value: `${streak}日`, label: "連続きろく" },
        ].map((item) => (
          <div key={item.label} style={{ background: `linear-gradient(135deg, ${member.color}, #185a9d)`, borderRadius: "14px", padding: "14px 8px", textAlign: "center", color: "white" }}>
            <div style={{ fontSize: "22px" }}>{item.emoji}</div>
            <div style={{ fontWeight: 900, fontSize: "17px" }}>{item.value}</div>
            <div style={{ fontSize: "10px", opacity: 0.85 }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* 今週のサマリー */}
      <div style={{ background: "white", borderRadius: "18px", padding: "16px", boxShadow: "0 4px 14px rgba(0,0,0,0.08)" }}>
        <h3 style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 800, color: "#333" }}>📅 今日のようす</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
          {[
            { value: todos.filter((t) => t.date === today && t.record_type === "homework").length, label: "宿題", color: "#4ECDC4", emoji: "📚" },
            { value: todos.filter((t) => t.date === today && t.record_type === "self_study").length, label: "自習", color: "#f5576c", emoji: "⭐" },
            { value: todos.filter((t) => t.date === today && !t.record_type && t.done).length, label: "タスク完了", color: "#a78bfa", emoji: "✅" },
          ].map((item) => (
            <div key={item.label} style={{ background: "#f9fafb", borderRadius: "12px", padding: "12px 8px", textAlign: "center" }}>
              <div style={{ fontSize: "18px" }}>{item.emoji}</div>
              <div style={{ fontWeight: 900, fontSize: "20px", color: item.color }}>{item.value}</div>
              <div style={{ fontSize: "10px", color: "#aaa" }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 教科別まとめ */}
      <div style={{ background: "white", borderRadius: "18px", padding: "16px", boxShadow: "0 4px 14px rgba(0,0,0,0.08)" }}>
        <h3 style={{ margin: "0 0 14px", fontSize: "13px", fontWeight: 800, color: "#333" }}>📊 教科ごとのまとめ</h3>
        {subjectTotals.map((s) => (
          <div key={s.id} style={{ marginBottom: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
              <span style={{ fontWeight: 800, fontSize: "13px" }}>{s.emoji} {s.name}</span>
              <div style={{ display: "flex", gap: "10px", fontSize: "12px" }}>
                <span style={{ color: "#185a9d", fontWeight: 700 }}>📝{s.recordCount}回</span>
                {s.avgScore !== null && <span style={{ color: "#f5576c", fontWeight: 700 }}>🏆平均{s.avgScore}点</span>}
              </div>
            </div>
            <div style={{ background: "#e5e7eb", borderRadius: "5px", height: "9px", overflow: "hidden" }}>
              <div style={{ width: `${Math.min(100, (s.recordCount / maxCount) * 100)}%`, height: "100%", background: s.color, borderRadius: "5px" }} />
            </div>
          </div>
        ))}
        {subjectTotals.every((s) => s.recordCount === 0) && (
          <p style={{ color: "#ccc", textAlign: "center", fontSize: "13px" }}>きろくをつけるとグラフがでるよ！</p>
        )}
      </div>

      {/* みんなの今週比較 */}
      {childMembers.length > 1 && (
        <div style={{ background: "white", borderRadius: "18px", padding: "16px", boxShadow: "0 4px 14px rgba(0,0,0,0.08)" }}>
          <h3 style={{ margin: "0 0 14px", fontSize: "13px", fontWeight: 800, color: "#333" }}>🏆 みんなの今週きろく</h3>
          {childMembers.map((d) => {
            const weekRec = getWeekRecords(d.todos);
            const memStreak = getStreak(d.todos);
            const maxRec = Math.max(...childMembers.map((x) => getWeekRecords(x.todos)), 1);
            return (
              <div key={d.member.id} style={{ marginBottom: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "20px" }}>{d.member.emoji}</span>
                    <span style={{ fontWeight: 800, fontSize: "13px", color: d.member.id === member.id ? d.member.color : "#333" }}>
                      {d.member.display_name}{d.member.id === member.id && " (じぶん)"}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
                    {memStreak > 0 && <span style={{ color: "#ff6b6b", fontWeight: 700 }}>🔥{memStreak}日</span>}
                    <span style={{ color: "#185a9d", fontWeight: 700 }}>{weekRec}回</span>
                  </div>
                </div>
                <div style={{ background: "#e5e7eb", borderRadius: "5px", height: "10px", overflow: "hidden" }}>
                  <div style={{ width: `${Math.min(100, (weekRec / maxRec) * 100)}%`, height: "100%", background: d.member.color, borderRadius: "5px" }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
