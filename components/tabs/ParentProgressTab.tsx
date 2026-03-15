"use client";
import type { Member, Subject, Score, Todo } from "@/lib/types";

interface MemberData {
  member: Member;
  subjects: Subject[];
  scores: Score[];
  todos: Todo[];
}

interface Props {
  childData: MemberData[];
}

const DAYS_SHORT = ["日", "月", "火", "水", "木", "金", "土"];

function getDateStr(offsetDays: number) {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getDayLabel(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return DAYS_SHORT[d.getDay()];
}

function getStreak(todos: Todo[]): number {
  const dates = [...new Set(todos.filter((t) => t.record_type != null).map((t) => t.date))].sort().reverse();
  if (dates.length === 0) return 0;
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < dates.length; i++) {
    const expected = new Date(today);
    expected.setDate(today.getDate() - i);
    const exp = `${expected.getFullYear()}-${String(expected.getMonth() + 1).padStart(2, "0")}-${String(expected.getDate()).padStart(2, "0")}`;
    if (dates[i] === exp) streak++;
    else break;
  }
  return streak;
}

export default function ParentProgressTab({ childData }: Props) {
  const today = getDateStr(0);
  const calYear = new Date().getFullYear();
  const calMonth = new Date().getMonth();
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  // 過去7日の日付リスト（古い順）
  const last7 = Array.from({ length: 7 }, (_, i) => getDateStr(6 - i));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {childData.map((d) => {
        const streak = getStreak(d.todos);

        // 週間バーグラフ用データ
        const weekData = last7.map((date) => ({
          date,
          label: getDayLabel(date),
          homework: d.todos.filter((t) => t.date === date && t.record_type === "homework").length,
          selfStudy: d.todos.filter((t) => t.date === date && t.record_type === "self_study").length,
        }));
        const maxBar = 2; // 宿題1 + 自習1 = 最大2

        // 月間ヒートマップ用
        const getMonthKey = (day: number) => {
          const m = calMonth + 1;
          return `${calYear}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        };
        const getHeatColor = (count: number) => {
          if (count === 0) return "#f0f0f0";
          if (count === 1) return "#a8edea";
          return "#43cea2";
        };

        // 教科別きろく件数
        const subjectCounts = d.subjects.map((s) => ({
          ...s,
          count: d.todos.filter((t) => t.record_type != null && t.subject_id === s.id).length,
        })).sort((a, b) => b.count - a.count);
        const maxSubjectCount = Math.max(...subjectCounts.map((s) => s.count), 1);

        return (
          <div key={d.member.id} style={{ background: "white", borderRadius: "20px", padding: "16px", boxShadow: "0 4px 14px rgba(0,0,0,0.08)" }}>
            {/* 子供ヘッダー */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: `${d.member.color}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", border: `2px solid ${d.member.color}` }}>
                {d.member.emoji}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 900, fontSize: "15px", color: "#333" }}>{d.member.display_name}</div>
                <div style={{ fontSize: "11px", color: "#aaa" }}>{d.member.grade}</div>
              </div>
              {streak > 0 && (
                <div style={{ background: "linear-gradient(135deg, #ff6b6b, #ff9800)", borderRadius: "12px", padding: "6px 12px", color: "white", fontWeight: 900, fontSize: "13px" }}>
                  🔥 {streak}日連続！
                </div>
              )}
            </div>

            {/* 週間バーグラフ */}
            <p style={{ margin: "0 0 8px", fontSize: "12px", fontWeight: 800, color: "#555" }}>📅 過去7日間のきろく</p>
            <div style={{ display: "flex", gap: "4px", alignItems: "flex-end", height: "70px", marginBottom: "16px" }}>
              {weekData.map((day) => {
                const total = day.homework + day.selfStudy;
                const isToday = day.date === today;
                return (
                  <div key={day.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", height: "100%" }}>
                    <div style={{ flex: 1, width: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: "1px" }}>
                      {day.selfStudy > 0 && (
                        <div style={{ width: "100%", height: `${(day.selfStudy / maxBar) * 48}px`, background: "#f5576c", borderRadius: "4px 4px 0 0" }} />
                      )}
                      {day.homework > 0 && (
                        <div style={{ width: "100%", height: `${(day.homework / maxBar) * 48}px`, background: "#4ECDC4", borderRadius: day.selfStudy > 0 ? "0" : "4px 4px 0 0" }} />
                      )}
                      {total === 0 && (
                        <div style={{ width: "100%", height: "4px", background: "#e5e7eb", borderRadius: "2px" }} />
                      )}
                    </div>
                    <div style={{ fontSize: "10px", fontWeight: isToday ? 900 : 600, color: isToday ? d.member.color : "#aaa" }}>{day.label}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
              {[["#4ECDC4", "📚 宿題"], ["#f5576c", "⭐ 自習"]].map(([c, l]) => (
                <div key={l} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#888" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: c }} />{l}
                </div>
              ))}
            </div>

            {/* 月間ヒートマップ */}
            <p style={{ margin: "0 0 8px", fontSize: "12px", fontWeight: 800, color: "#555" }}>🗓️ {calMonth + 1}月のきろく</p>
            <div style={{ marginBottom: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: "4px" }}>
                {DAYS_SHORT.map((dl, i) => (
                  <div key={dl} style={{ textAlign: "center", fontSize: "9px", fontWeight: 700, color: i === 0 ? "#e53935" : i === 6 ? "#1565c0" : "#aaa" }}>{dl}</div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "3px" }}>
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const key = getMonthKey(day);
                  const count = d.todos.filter((t) => t.date === key && t.record_type != null).length;
                  const isToday = key === today;
                  const dow = (firstDay + i) % 7;
                  return (
                    <div
                      key={day}
                      style={{
                        aspectRatio: "1",
                        borderRadius: "6px",
                        background: isToday ? d.member.color : getHeatColor(count),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "9px",
                        fontWeight: 700,
                        color: isToday ? "white" : dow === 0 ? "#e53935" : dow === 6 ? "#1565c0" : "#666",
                        border: isToday ? `2px solid ${d.member.color}` : "none",
                      }}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: "8px", marginTop: "8px", alignItems: "center" }}>
                <span style={{ fontSize: "10px", color: "#aaa" }}>きろくなし</span>
                {["#f0f0f0", "#a8edea", "#43cea2"].map((c, i) => (
                  <div key={i} style={{ width: "14px", height: "14px", borderRadius: "3px", background: c }} />
                ))}
                <span style={{ fontSize: "10px", color: "#aaa" }}>きろくあり</span>
              </div>
            </div>

            {/* 教科別ランキング */}
            {subjectCounts.some((s) => s.count > 0) && (
              <>
                <p style={{ margin: "0 0 8px", fontSize: "12px", fontWeight: 800, color: "#555" }}>📊 教科別きろく（累計）</p>
                {subjectCounts.filter((s) => s.count > 0).map((s, rank) => (
                  <div key={s.id} style={{ marginBottom: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 700 }}>
                        {rank === 0 ? "🥇" : rank === 1 ? "🥈" : rank === 2 ? "🥉" : `${rank + 1}.`} {s.emoji} {s.name}
                      </span>
                      <span style={{ fontSize: "12px", fontWeight: 900, color: s.color }}>{s.count}回</span>
                    </div>
                    <div style={{ background: "#e5e7eb", borderRadius: "4px", height: "7px", overflow: "hidden" }}>
                      <div style={{ width: `${(s.count / maxSubjectCount) * 100}%`, height: "100%", background: s.color, borderRadius: "4px" }} />
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
