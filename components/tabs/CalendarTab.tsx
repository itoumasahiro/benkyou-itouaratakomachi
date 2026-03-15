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

interface Props { todos: Todo[]; studyLogs: StudyLog[]; scores: Score[]; }

export default function CalendarTab({ todos, studyLogs, scores }: Props) {
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(getToday());
  const today = getToday();

  const calYear = calendarDate.getFullYear();
  const calMonth = calendarDate.getMonth();
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  const getDayKey = (y: number, m: number, d: number) =>
    `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const getDayActivity = (key: string) => ({
    hasTodo: todos.some((t) => t.date === key),
    hasLog: studyLogs.some((l) => l.date === key),
    hasScore: scores.some((s) => s.date === key),
    any: todos.some((t) => t.date === key) || studyLogs.some((l) => l.date === key) || scores.some((s) => s.date === key),
  });

  const selectedDayTodos = todos.filter((t) => t.date === selectedDay);
  const selectedDayLogs = studyLogs.filter((l) => l.date === selectedDay);
  const selectedDayScores = scores.filter((s) => s.date === selectedDay);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ background: "white", borderRadius: "20px", padding: "16px", boxShadow: "0 4px 14px rgba(0,0,0,0.08)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <button onClick={() => setCalendarDate(new Date(calYear, calMonth - 1))} style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#555" }}>‹</button>
          <span style={{ fontWeight: 900, fontSize: "16px", color: "#185a9d" }}>{calYear}年 {calMonth + 1}月</span>
          <button onClick={() => setCalendarDate(new Date(calYear, calMonth + 1))} style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#555" }}>›</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: "6px" }}>
          {DAYS_SHORT.map((d, i) => (
            <div key={d} style={{ textAlign: "center", fontSize: "11px", fontWeight: 700, color: i === 0 ? "#f44336" : i === 6 ? "#1565c0" : "#888", padding: "4px 0" }}>{d}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "3px" }}>
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const key = getDayKey(calYear, calMonth, day);
            const act = getDayActivity(key);
            const isToday = key === today;
            const isSelected = key === selectedDay;
            const dow = (firstDay + i) % 7;
            return (
              <button key={day} onClick={() => setSelectedDay(key)} style={{ aspectRatio: "1", borderRadius: "10px", border: isSelected ? "2px solid #185a9d" : "2px solid transparent", background: isToday ? "linear-gradient(135deg,#43cea2,#185a9d)" : isSelected ? "#e8f0fe" : act.any ? "#f0fff8" : "white", color: isToday ? "white" : dow === 0 ? "#f44336" : dow === 6 ? "#1565c0" : "#333", fontWeight: isToday ? 900 : 600, fontSize: "13px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2px" }}>
                {day}
                {act.any && !isToday && (
                  <div style={{ display: "flex", gap: "1px", marginTop: "1px" }}>
                    {act.hasLog && <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#43cea2" }} />}
                    {act.hasTodo && <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#f5576c" }} />}
                    {act.hasScore && <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#F7B731" }} />}
                  </div>
                )}
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "12px" }}>
          {[["#43cea2", "勉強時間"], ["#f5576c", "タスク"], ["#F7B731", "テスト"]].map(([c, l]) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#888" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: c }} />{l}
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: "white", borderRadius: "18px", padding: "16px", boxShadow: "0 4px 14px rgba(0,0,0,0.08)" }}>
        <h3 style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 800, color: "#333" }}>📌 {formatDateLabel(selectedDay)} のきろく</h3>
        {selectedDayLogs.length === 0 && selectedDayTodos.length === 0 && selectedDayScores.length === 0 && (
          <p style={{ color: "#ccc", textAlign: "center", fontSize: "13px" }}>この日はきろくがないよ</p>
        )}
        {selectedDayLogs.length > 0 && (
          <div style={{ marginBottom: "10px" }}>
            <p style={{ margin: "0 0 6px", fontSize: "12px", fontWeight: 700, color: "#43cea2" }}>⏱️ 勉強時間</p>
            {selectedDayLogs.map((log) => (
              <div key={log.id} style={{ fontSize: "13px", padding: "6px 10px", background: "#f0fff8", borderRadius: "8px", marginBottom: "4px" }}>{log.subject?.emoji} {log.subject?.name}　<strong>{log.minutes}分</strong></div>
            ))}
          </div>
        )}
        {selectedDayTodos.length > 0 && (
          <div style={{ marginBottom: "10px" }}>
            <p style={{ margin: "0 0 6px", fontSize: "12px", fontWeight: 700, color: "#f5576c" }}>📋 タスク</p>
            {selectedDayTodos.map((t) => (
              <div key={t.id} style={{ fontSize: "13px", padding: "6px 10px", background: "#fff5f5", borderRadius: "8px", marginBottom: "4px" }}>{t.done ? "✅" : "⬜"} {t.subject?.emoji} {t.text}</div>
            ))}
          </div>
        )}
        {selectedDayScores.length > 0 && (
          <div>
            <p style={{ margin: "0 0 6px", fontSize: "12px", fontWeight: 700, color: "#F7B731" }}>📝 テスト</p>
            {selectedDayScores.map((sc) => {
              const pct = Math.round((sc.score / sc.max) * 100);
              return <div key={sc.id} style={{ fontSize: "13px", padding: "6px 10px", background: "#fffbf0", borderRadius: "8px", marginBottom: "4px" }}>{sc.subject?.emoji} {sc.name}　<strong>{sc.score}/{sc.max}点</strong>（{pct}%）</div>;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
