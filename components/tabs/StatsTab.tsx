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

function getStreak(logs: StudyLog[]): number {
  const dates = [...new Set(logs.map((l) => l.date))].sort().reverse();
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

function getWeekMins(logs: StudyLog[]): number {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);
  return logs.filter((l) => new Date(l.date) >= weekAgo).reduce((s, l) => s + l.minutes, 0);
}

export default function StatsTab({ member, subjects, studyLogs, scores, todos, allMembersData }: Props) {
  const totalMins = studyLogs.reduce((s, l) => s + l.minutes, 0);
  const completedTodos = todos.filter((t) => t.done).length;
  const streak = getStreak(studyLogs);

  const subjectTotals = subjects.map((s) => ({
    ...s,
    totalMins: studyLogs.filter((l) => l.subject_id === s.id).reduce((sum, l) => sum + l.minutes, 0),
    avgScore: (() => {
      const sc = scores.filter((sc) => sc.subject_id === s.id);
      return sc.length ? Math.round(sc.reduce((sum, sc) => sum + (sc.score / sc.max) * 100, 0) / sc.length) : null;
    })(),
  }));
  const maxMins = Math.max(...subjectTotals.map((s) => s.totalMins), 1);

  // みんなの今週データ
  const childMembers = allMembersData.filter((d) => d.member.role === "child");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* 自分のサマリー */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
        {[
          { emoji: "⏱️", value: `${totalMins}分`, label: "合計勉強" },
          { emoji: "✅", value: `${completedTodos}個`, label: "タスク完了" },
          { emoji: "🔥", value: `${streak}日`, label: "連続記録" },
        ].map((item) => (
          <div key={item.label} style={{ background: `linear-gradient(135deg, ${member.color}, #185a9d)`, borderRadius: "14px", padding: "14px 8px", textAlign: "center", color: "white" }}>
            <div style={{ fontSize: "22px" }}>{item.emoji}</div>
            <div style={{ fontWeight: 900, fontSize: "17px" }}>{item.value}</div>
            <div style={{ fontSize: "10px", opacity: 0.85 }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* 教科別まとめ */}
      <div style={{ background: "white", borderRadius: "18px", padding: "16px", boxShadow: "0 4px 14px rgba(0,0,0,0.08)" }}>
        <h3 style={{ margin: "0 0 14px", fontSize: "13px", fontWeight: 800, color: "#333" }}>📊 教科ごとのまとめ</h3>
        {subjectTotals.map((s) => (
          <div key={s.id} style={{ marginBottom: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
              <span style={{ fontWeight: 800, fontSize: "13px" }}>{s.emoji} {s.name}</span>
              <div style={{ display: "flex", gap: "10px", fontSize: "12px" }}>
                <span style={{ color: "#185a9d", fontWeight: 700 }}>⏱️{s.totalMins}分</span>
                {s.avgScore !== null && <span style={{ color: "#f5576c", fontWeight: 700 }}>📝平均{s.avgScore}点</span>}
              </div>
            </div>
            <div style={{ background: "#e5e7eb", borderRadius: "5px", height: "9px", overflow: "hidden" }}>
              <div style={{ width: `${Math.min(100, (s.totalMins / maxMins) * 100)}%`, height: "100%", background: s.color, borderRadius: "5px" }} />
            </div>
          </div>
        ))}
      </div>

      {/* みんなの今週比較 */}
      {childMembers.length > 1 && (
        <div style={{ background: "white", borderRadius: "18px", padding: "16px", boxShadow: "0 4px 14px rgba(0,0,0,0.08)" }}>
          <h3 style={{ margin: "0 0 14px", fontSize: "13px", fontWeight: 800, color: "#333" }}>🏆 みんなの今週きろく</h3>
          {childMembers.map((d) => {
            const weekMins = getWeekMins(d.logs);
            const memberStreak = getStreak(d.logs);
            const maxWeekMins = Math.max(...childMembers.map((x) => getWeekMins(x.logs)), 1);
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
                    {memberStreak > 0 && <span style={{ color: "#ff6b6b", fontWeight: 700 }}>🔥{memberStreak}日</span>}
                    <span style={{ color: "#185a9d", fontWeight: 700 }}>{weekMins}分</span>
                  </div>
                </div>
                <div style={{ background: "#e5e7eb", borderRadius: "5px", height: "10px", overflow: "hidden" }}>
                  <div style={{ width: `${Math.min(100, (weekMins / maxWeekMins) * 100)}%`, height: "100%", background: d.member.color, borderRadius: "5px" }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
