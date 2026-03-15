"use client";
import { useState, useEffect } from "react";
import type { Member, Subject, StudyLog } from "@/lib/types";

interface Props {
  member: Member;
  subjects: Subject[];
  studyLogs: StudyLog[];
  today: string;
  onSaveLog: (subjectId: string, minutes: number) => Promise<void>;
}

const DAYS_SHORT = ["日", "月", "火", "水", "木", "金", "土"];
function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getMonth() + 1}月${d.getDate()}日(${DAYS_SHORT[d.getDay()]})`;
}
function fmt(sec: number) {
  return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
}

export default function TimerTab({ member, subjects, studyLogs, today, onSaveLog }: Props) {
  const [timer, setTimer] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSubjectId, setTimerSubjectId] = useState(subjects[0]?.id ?? "");

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerRunning) interval = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [timerRunning]);

  const stopTimer = async () => {
    if (timer < 60) return;
    setTimerRunning(false);
    await onSaveLog(timerSubjectId, Math.floor(timer / 60));
    setTimer(0);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ background: "white", borderRadius: "22px", padding: "32px 20px", textAlign: "center", boxShadow: "0 4px 14px rgba(0,0,0,0.08)" }}>
        <div style={{ fontSize: "68px", fontWeight: 900, letterSpacing: "4px", background: `linear-gradient(135deg, ${member.color}, #185a9d)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          {fmt(timer)}
        </div>
        <p style={{ color: "#bbb", fontSize: "12px", marginBottom: "20px" }}>勉強タイマー</p>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "center", marginBottom: "22px" }}>
          {subjects.map((s) => (
            <button
              key={s.id}
              onClick={() => !timerRunning && setTimerSubjectId(s.id)}
              style={{ padding: "5px 12px", borderRadius: "20px", border: `2px solid ${timerSubjectId === s.id ? s.color : "#e5e7eb"}`, background: timerSubjectId === s.id ? s.color : "white", color: timerSubjectId === s.id ? "white" : "#555", fontSize: "12px", fontWeight: 700, cursor: timerRunning ? "not-allowed" : "pointer", opacity: timerRunning && timerSubjectId !== s.id ? 0.5 : 1 }}
            >
              {s.emoji}{s.name}
            </button>
          ))}
        </div>
        <button
          onClick={() => setTimerRunning(!timerRunning)}
          style={{ padding: "14px 36px", borderRadius: "50px", border: "none", background: timerRunning ? "#ff6b6b" : `linear-gradient(135deg, ${member.color}, #185a9d)`, color: "white", fontWeight: 900, fontSize: "17px", cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}
        >
          {timerRunning ? "⏸️ 一時停止" : "▶️ スタート"}
        </button>
        {timer >= 60 && (
          <div style={{ marginTop: "16px" }}>
            <button
              onClick={stopTimer}
              style={{ padding: "10px 28px", borderRadius: "50px", border: "none", background: "#4caf50", color: "white", fontWeight: 700, cursor: "pointer" }}
            >
              ✅ 記録する ({Math.floor(timer / 60)}分)
            </button>
          </div>
        )}
        {timer > 0 && timer < 60 && (
          <p style={{ color: "#bbb", fontSize: "11px", marginTop: "12px" }}>1分以上で記録できます</p>
        )}
      </div>

      <div style={{ background: "white", borderRadius: "18px", padding: "16px", boxShadow: "0 4px 14px rgba(0,0,0,0.08)" }}>
        <h3 style={{ margin: "0 0 10px", fontSize: "13px", fontWeight: 800, color: "#333" }}>📜 勉強きろく</h3>
        {studyLogs.length === 0 && <p style={{ color: "#ccc", textAlign: "center", fontSize: "13px" }}>まだ記録がないよ！</p>}
        {studyLogs.map((log) => (
          <div key={log.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px", marginBottom: "6px", borderRadius: "12px", background: "#f9fafb" }}>
            <span style={{ fontSize: "18px" }}>{log.subject?.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "13px", fontWeight: 700 }}>{log.subject?.name}</div>
              <div style={{ fontSize: "11px", color: "#aaa" }}>{formatDateLabel(log.date)}</div>
            </div>
            <span style={{ fontWeight: 900, color: "#185a9d" }}>{log.minutes}分</span>
          </div>
        ))}
      </div>
    </div>
  );
}
