"use client";
import { useState } from "react";
import type { Todo, StudyLog, Score } from "@/lib/types";

const DAYS_SHORT = ["日", "月", "火", "水", "木", "金", "土"];
function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getMonth() + 1}月${d.getDate()}日(${DAYS_SHORT[d.getDay()]})`;
}
function getToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const DOT_COLORS = {
  homework:   "#4ECDC4",
  self_study: "#f5576c",
  task:       "#a78bfa",
  score:      "#F7B731",
};

interface Props { todos: Todo[]; studyLogs: StudyLog[]; scores: Score[]; }

export default function CalendarTab({ todos, scores }: Props) {
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(getToday());
  const today = getToday();

  const calYear  = calendarDate.getFullYear();
  const calMonth = calendarDate.getMonth();
  const firstDay    = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  const getDayKey = (y: number, m: number, d: number) =>
    `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const getDayActivity = (key: string) => {
    const dayTodos = todos.filter((t) => t.date === key);
    return {
      hasHomework:  dayTodos.some((t) => t.record_type === "homework"),
      hasSelfStudy: dayTodos.some((t) => t.record_type === "self_study"),
      hasTask:      dayTodos.some((t) => !t.record_type),
      hasScore:     scores.some((s) => s.date === key),
    };
  };

  const selTodos  = todos.filter((t) => t.date === selectedDay);
  const selScores = scores.filter((s) => s.date === selectedDay);
  const selHomework   = selTodos.filter((t) => t.record_type === "homework");
  const selSelfStudy  = selTodos.filter((t) => t.record_type === "self_study");
  const selTasks      = selTodos.filter((t) => !t.record_type);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ background: "white", borderRadius: "20px", padding: "16px", boxShadow: "0 4px 14px rgba(0,0,0,0.08)" }}>

        {/* 月ナビ */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <button onClick={() => setCalendarDate(new Date(calYear, calMonth - 1))} style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#555" }}>‹</button>
          <span style={{ fontWeight: 900, fontSize: "16px", color: "#185a9d" }}>{calYear}年 {calMonth + 1}月</span>
          <button onClick={() => setCalendarDate(new Date(calYear, calMonth + 1))} style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#555" }}>›</button>
        </div>

        {/* 曜日ヘッダー */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: "4px" }}>
          {DAYS_SHORT.map((d, i) => (
            <div key={d} style={{ textAlign: "center", fontSize: "11px", fontWeight: 700, color: i === 0 ? "#e53935" : i === 6 ? "#1565c0" : "#888", padding: "4px 0" }}>{d}</div>
          ))}
        </div>

        {/* 日付グリッド */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "3px" }}>
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const key = getDayKey(calYear, calMonth, day);
            const act = getDayActivity(key);
            const isToday    = key === today;
            const isSelected = key === selectedDay;
            const dow = (firstDay + i) % 7;
            const isSun = dow === 0;
            const isSat = dow === 6;

            // セル背景
            let cellBg = "white";
            if (isToday)         cellBg = "linear-gradient(135deg,#43cea2,#185a9d)";
            else if (isSelected) cellBg = "#dbeafe";
            else if (isSun)      cellBg = "#fff0f0";
            else if (isSat)      cellBg = "#f0f5ff";

            const hasAny = act.hasHomework || act.hasSelfStudy || act.hasTask || act.hasScore;

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(key)}
                style={{
                  aspectRatio: "1",
                  borderRadius: "10px",
                  border: isSelected ? "2px solid #185a9d" : "2px solid transparent",
                  background: cellBg,
                  color: isToday ? "white" : isSun ? "#e53935" : isSat ? "#1565c0" : "#333",
                  fontWeight: isToday ? 900 : 600,
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "2px",
                }}
              >
                {day}
                {hasAny && !isToday && (
                  <div style={{ display: "flex", gap: "1px", marginTop: "2px" }}>
                    {act.hasHomework  && <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: DOT_COLORS.homework }} />}
                    {act.hasSelfStudy && <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: DOT_COLORS.self_study }} />}
                    {act.hasTask      && <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: DOT_COLORS.task }} />}
                    {act.hasScore     && <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: DOT_COLORS.score }} />}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* 凡例 */}
        <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap", marginTop: "12px" }}>
          {([
            [DOT_COLORS.homework,   "📚 宿題"],
            [DOT_COLORS.self_study, "⭐ 自習"],
            [DOT_COLORS.task,       "✅ タスク"],
            [DOT_COLORS.score,      "📝 テスト"],
          ] as [string, string][]).map(([c, l]) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#888" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: c }} />{l}
            </div>
          ))}
        </div>
      </div>

      {/* 詳細パネル */}
      <div style={{ background: "white", borderRadius: "18px", padding: "16px", boxShadow: "0 4px 14px rgba(0,0,0,0.08)" }}>
        <h3 style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 800, color: "#333" }}>📌 {formatDateLabel(selectedDay)} のきろく</h3>

        {selHomework.length === 0 && selSelfStudy.length === 0 && selTasks.length === 0 && selScores.length === 0 && (
          <p style={{ color: "#ccc", textAlign: "center", fontSize: "13px" }}>この日はきろくがないよ</p>
        )}

        {selHomework.length > 0 && (
          <div style={{ marginBottom: "10px" }}>
            <p style={{ margin: "0 0 6px", fontSize: "12px", fontWeight: 700, color: DOT_COLORS.homework }}>📚 宿題きろく</p>
            {selHomework.map((t) => (
              <div key={t.id} style={{ fontSize: "13px", padding: "7px 12px", background: "#f0fffe", borderRadius: "10px", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>{t.subject?.emoji}</span>
                <span style={{ fontWeight: 700 }}>{t.subject?.name}</span>
                <span style={{ color: "#aaa", fontSize: "12px" }}>{t.content_type}</span>
              </div>
            ))}
          </div>
        )}

        {selSelfStudy.length > 0 && (
          <div style={{ marginBottom: "10px" }}>
            <p style={{ margin: "0 0 6px", fontSize: "12px", fontWeight: 700, color: DOT_COLORS.self_study }}>⭐ 自習きろく</p>
            {selSelfStudy.map((t) => (
              <div key={t.id} style={{ fontSize: "13px", padding: "7px 12px", background: "#fff5f5", borderRadius: "10px", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>{t.subject?.emoji}</span>
                <span style={{ fontWeight: 700 }}>{t.subject?.name}</span>
                <span style={{ color: "#aaa", fontSize: "12px" }}>{t.content_type}</span>
              </div>
            ))}
          </div>
        )}

        {selTasks.length > 0 && (
          <div style={{ marginBottom: "10px" }}>
            <p style={{ margin: "0 0 6px", fontSize: "12px", fontWeight: 700, color: DOT_COLORS.task }}>✅ タスク</p>
            {selTasks.map((t) => (
              <div key={t.id} style={{ fontSize: "13px", padding: "7px 12px", background: "#f5f3ff", borderRadius: "10px", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>{t.done ? "✅" : "⬜"}</span>
                <span>{t.subject?.emoji}</span>
                <span>{t.text}</span>
              </div>
            ))}
          </div>
        )}

        {selScores.length > 0 && (
          <div>
            <p style={{ margin: "0 0 6px", fontSize: "12px", fontWeight: 700, color: DOT_COLORS.score }}>📝 テスト</p>
            {selScores.map((sc) => {
              const pct = Math.round((sc.score / sc.max) * 100);
              return (
                <div key={sc.id} style={{ fontSize: "13px", padding: "7px 12px", background: "#fffbf0", borderRadius: "10px", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>{sc.subject?.emoji}</span>
                  <span style={{ fontWeight: 700 }}>{sc.subject?.name}</span>
                  <span style={{ color: "#555" }}>{sc.name}</span>
                  <span style={{ marginLeft: "auto", fontWeight: 900, color: "#F7B731" }}>{sc.score}/{sc.max}点</span>
                  <span style={{ fontSize: "11px", color: "#aaa" }}>({pct}%)</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
