"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Member, Subject, Todo, StudyLog, Score } from "@/lib/types";
import TodayTab from "./tabs/TodayTab";
import TimerTab from "./tabs/TimerTab";
import ScoresTab from "./tabs/ScoresTab";
import CalendarTab from "./tabs/CalendarTab";
import StatsTab from "./tabs/StatsTab";
import ChatTab from "./tabs/ChatTab";

const DAYS_SHORT = ["日", "月", "火", "水", "木", "金", "土"];
function getToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getMonth() + 1}月${d.getDate()}日(${DAYS_SHORT[d.getDay()]})`;
}

const TABS = [
  { key: "today", icon: "📅", label: "今日" },
  { key: "timer", icon: "⏱️", label: "タイマー" },
  { key: "scores", icon: "📝", label: "テスト" },
  { key: "calendar", icon: "🗓️", label: "カレンダー" },
  { key: "stats", icon: "📊", label: "まとめ" },
  { key: "chat", icon: "💬", label: "チャット" },
];

interface Props {
  member: Member;
  allMembers: Member[];
}

export default function StudyApp({ member, allMembers }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState("today");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [studyLogs, setStudyLogs] = useState<StudyLog[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [allMembersData, setAllMembersData] = useState<{ member: Member; logs: StudyLog[]; scores: Score[]; todos: Todo[] }[]>([]);
  const today = getToday();

  // データ取得
  const fetchData = useCallback(async () => {
    const [subRes, todoRes, logRes, scoreRes] = await Promise.all([
      fetch(`/api/subjects?memberId=${member.id}`),
      fetch(`/api/todos?memberId=${member.id}`),
      fetch(`/api/study-logs?memberId=${member.id}`),
      fetch(`/api/scores?memberId=${member.id}`),
    ]);
    const [subData, todoData, logData, scoreData] = await Promise.all([
      subRes.json(), todoRes.json(), logRes.json(), scoreRes.json(),
    ]);
    if (Array.isArray(subData)) setSubjects(subData);
    if (Array.isArray(todoData)) setTodos(todoData);
    if (Array.isArray(logData)) setStudyLogs(logData);
    if (Array.isArray(scoreData)) setScores(scoreData);
  }, [member.id]);

  // 全員データ（まとめタブ用）
  const fetchAllData = useCallback(async () => {
    const childMembers = allMembers.filter((m) => m.role === "child");
    const results = await Promise.all(
      childMembers.map(async (m) => {
        const [logRes, scoreRes, todoRes] = await Promise.all([
          fetch(`/api/study-logs?memberId=${m.id}`),
          fetch(`/api/scores?memberId=${m.id}`),
          fetch(`/api/todos?memberId=${m.id}`),
        ]);
        const [logs, scores, todos] = await Promise.all([logRes.json(), scoreRes.json(), todoRes.json()]);
        return { member: m, logs: Array.isArray(logs) ? logs : [], scores: Array.isArray(scores) ? scores : [], todos: Array.isArray(todos) ? todos : [] };
      })
    );
    setAllMembersData(results);
  }, [allMembers]);

  useEffect(() => { fetchData(); fetchAllData(); }, [fetchData, fetchAllData]);

  const totalStars = todos.filter((t) => t.done).length + studyLogs.length + scores.length;
  const todayLogs = studyLogs.filter((l) => l.date === today);

  // Todo操作
  const handleAddTodo = async (text: string, subjectId: string) => {
    const res = await fetch("/api/todos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ member_id: member.id, text, subject_id: subjectId, date: today }) });
    const data = await res.json();
    if (data.id) setTodos((prev) => [...prev, data]);
  };
  const handleToggleTodo = async (id: number, done: boolean) => {
    const res = await fetch("/api/todos", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, done }) });
    const data = await res.json();
    if (data.id) setTodos((prev) => prev.map((t) => t.id === id ? data : t));
  };
  const handleDeleteTodo = async (id: number) => {
    await fetch(`/api/todos?id=${id}`, { method: "DELETE" });
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  // 勉強ログ保存
  const handleSaveLog = async (subjectId: string, minutes: number) => {
    const res = await fetch("/api/study-logs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ member_id: member.id, subject_id: subjectId, minutes, date: today }) });
    const data = await res.json();
    if (data.id) setStudyLogs((prev) => [data, ...prev]);
  };

  // テスト点数追加
  const handleAddScore = async (subjectId: string, name: string, testType: string, score: number, max: number) => {
    const res = await fetch("/api/scores", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ member_id: member.id, subject_id: subjectId, name, test_type: testType, score, max, date: today }) });
    const data = await res.json();
    if (data.id) setScores((prev) => [data, ...prev]);
  };

  return (
    <div style={{ fontFamily: "'Noto Sans JP', sans-serif", minHeight: "100vh", background: "linear-gradient(160deg, #a8edea 0%, #fed6e3 100%)", padding: "14px", boxSizing: "border-box" }}>
      {/* ヘッダー */}
      <div style={{ background: "white", borderRadius: "22px", padding: "12px 16px", marginBottom: "12px", boxShadow: "0 6px 24px rgba(0,0,0,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: `${member.color}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", border: `2px solid ${member.color}` }}>
            {member.emoji}
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: "16px", fontWeight: 900, color: "#333" }}>{member.display_name}の手帳</h1>
            <p style={{ margin: "1px 0 0", fontSize: "10px", color: "#aaa" }}>{formatDateLabel(today)}</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ background: "linear-gradient(135deg, #f093fb, #f5576c)", borderRadius: "14px", padding: "6px 12px", color: "white", textAlign: "center" }}>
            <div style={{ fontSize: "16px", fontWeight: 900 }}>⭐ {totalStars}</div>
            <div style={{ fontSize: "9px" }}>スター</div>
          </div>
          <button onClick={() => router.push("/")} style={{ background: "#f9fafb", border: "2px solid #e5e7eb", borderRadius: "12px", padding: "6px 10px", cursor: "pointer", fontSize: "11px", fontWeight: 700, color: "#555" }}>
            🔄 かえる
          </button>
        </div>
      </div>

      {/* タブ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: "4px", marginBottom: "12px" }}>
        {TABS.map(({ key, icon, label }) => (
          <button key={key} onClick={() => setTab(key)} style={{ padding: "7px 2px", borderRadius: "12px", border: "none", fontWeight: 800, fontSize: "9px", cursor: "pointer", background: tab === key ? "white" : "rgba(255,255,255,0.45)", color: tab === key ? member.color : "#555", boxShadow: tab === key ? "0 4px 14px rgba(0,0,0,0.13)" : "none", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
            <span style={{ fontSize: "15px" }}>{icon}</span>{label}
          </button>
        ))}
      </div>

      {/* タブコンテンツ */}
      {tab === "today" && subjects.length > 0 && (
        <TodayTab member={member} subjects={subjects} todos={todos} todayLogs={todayLogs} today={today} onAddTodo={handleAddTodo} onToggleTodo={handleToggleTodo} onDeleteTodo={handleDeleteTodo} />
      )}
      {tab === "timer" && subjects.length > 0 && (
        <TimerTab member={member} subjects={subjects} studyLogs={studyLogs} today={today} onSaveLog={handleSaveLog} />
      )}
      {tab === "scores" && subjects.length > 0 && (
        <ScoresTab member={member} subjects={subjects} scores={scores} onAddScore={handleAddScore} />
      )}
      {tab === "calendar" && (
        <CalendarTab todos={todos} studyLogs={studyLogs} scores={scores} />
      )}
      {tab === "stats" && (
        <StatsTab member={member} subjects={subjects} studyLogs={studyLogs} scores={scores} todos={todos} allMembersData={allMembersData} />
      )}
      {tab === "chat" && (
        <ChatTab member={member} />
      )}
    </div>
  );
}
