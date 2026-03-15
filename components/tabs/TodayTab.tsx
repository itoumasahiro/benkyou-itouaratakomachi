"use client";
import { useState } from "react";
import type { Member, Subject, Todo, StudyLog } from "@/lib/types";

const DAYS_SHORT = ["日", "月", "火", "水", "木", "金", "土"];
function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getMonth() + 1}月${d.getDate()}日(${DAYS_SHORT[d.getDay()]})`;
}

const POINTS: Record<"homework" | "self_study", number> = { homework: 2, self_study: 5 };

interface Props {
  member: Member;
  subjects: Subject[];
  todos: Todo[];
  todayLogs: StudyLog[];
  today: string;
  onAddTodo: (text: string, subjectId: string) => Promise<void>;
  onToggleTodo: (id: number, done: boolean) => Promise<void>;
  onDeleteTodo: (id: number) => Promise<void>;
}

export default function TodayTab({ member, subjects, todos, today, onAddTodo, onToggleTodo, onDeleteTodo }: Props) {
  const [newTodo, setNewTodo] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id ?? "");

  const todayTodos        = todos.filter((t) => t.date === today && t.record_type == null);
  const todayHomework     = todos.filter((t) => t.date === today && t.record_type === "homework");
  const todaySelfStudy    = todos.filter((t) => t.date === today && t.record_type === "self_study");
  const completedToday    = todayTodos.filter((t) => t.done).length;
  const studyRecordCount  = todayHomework.length + todaySelfStudy.length;

  const handleAdd = async () => {
    if (!newTodo.trim() || !selectedSubjectId) return;
    await onAddTodo(newTodo.trim(), selectedSubjectId);
    setNewTodo("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

      {/* サマリーカード */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <div style={{ background: "white", borderRadius: "16px", padding: "16px", textAlign: "center", boxShadow: "0 4px 14px rgba(0,0,0,0.08)" }}>
          <div style={{ fontSize: "30px", fontWeight: 900, color: "#43cea2" }}>{completedToday}/{todayTodos.length}</div>
          <div style={{ fontSize: "11px", color: "#aaa" }}>タスク完了</div>
        </div>
        <div style={{ background: "white", borderRadius: "16px", padding: "16px", textAlign: "center", boxShadow: "0 4px 14px rgba(0,0,0,0.08)" }}>
          <div style={{ fontSize: "30px", fontWeight: 900, color: "#f5576c" }}>{studyRecordCount}件</div>
          <div style={{ fontSize: "11px", color: "#aaa" }}>宿題・自習きろく</div>
        </div>
      </div>

      {/* Todo追加 */}
      <div style={{ background: "white", borderRadius: "18px", padding: "16px", boxShadow: "0 4px 14px rgba(0,0,0,0.08)" }}>
        <h3 style={{ margin: "0 0 10px", fontSize: "13px", fontWeight: 800, color: "#333" }}>➕ やることを追加</h3>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
          {subjects.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSubjectId(s.id)}
              style={{ padding: "5px 12px", borderRadius: "20px", border: `2px solid ${selectedSubjectId === s.id ? s.color : "#e5e7eb"}`, background: selectedSubjectId === s.id ? s.color : "white", color: selectedSubjectId === s.id ? "white" : "#555", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
            >
              {s.emoji}{s.name}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <input
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="例：算数プリント3枚"
            style={{ flex: 1, padding: "10px 14px", borderRadius: "12px", border: "2px solid #e5e7eb", fontSize: "13px", outline: "none" }}
          />
          <button
            onClick={handleAdd}
            style={{ padding: "10px 18px", borderRadius: "12px", border: "none", background: `linear-gradient(135deg, ${member.color}, #185a9d)`, color: "white", fontWeight: 800, cursor: "pointer" }}
          >
            追加
          </button>
        </div>
      </div>

      {/* Todoリスト */}
      <div style={{ background: "white", borderRadius: "18px", padding: "16px", boxShadow: "0 4px 14px rgba(0,0,0,0.08)" }}>
        <h3 style={{ margin: "0 0 10px", fontSize: "13px", fontWeight: 800, color: "#333" }}>📋 今日のやること</h3>
        {todayTodos.length === 0 && <p style={{ color: "#ccc", textAlign: "center", fontSize: "13px" }}>追加してみよう✨</p>}
        {todayTodos.map((todo) => (
          <div key={todo.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", marginBottom: "7px", borderRadius: "12px", background: todo.done ? "#f0fff8" : "#f9fafb", border: `2px solid ${todo.done ? "#43cea2" : "#e5e7eb"}` }}>
            <button
              onClick={() => onToggleTodo(todo.id, !todo.done)}
              style={{ width: "24px", height: "24px", borderRadius: "50%", border: `2px solid ${todo.done ? "#43cea2" : "#ccc"}`, background: todo.done ? "#43cea2" : "white", cursor: "pointer", color: "white", fontWeight: 900, fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
            >
              {todo.done ? "✓" : ""}
            </button>
            <span>{todo.subject?.emoji}</span>
            <span style={{ flex: 1, fontSize: "13px", textDecoration: todo.done ? "line-through" : "none", color: todo.done ? "#aaa" : "#333" }}>{todo.text}</span>
            <button onClick={() => onDeleteTodo(todo.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ddd", fontSize: "18px" }}>×</button>
          </div>
        ))}
      </div>

      {/* 今日の宿題・自習きろく */}
      {studyRecordCount > 0 && (
        <div style={{ background: "white", borderRadius: "18px", padding: "16px", boxShadow: "0 4px 14px rgba(0,0,0,0.08)" }}>
          <h3 style={{ margin: "0 0 10px", fontSize: "13px", fontWeight: 800, color: "#333" }}>📚 今日のきろく</h3>
          {todayHomework.map((t) => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", marginBottom: "6px", borderRadius: "10px", background: "#f0fffe" }}>
              <span style={{ fontSize: "16px" }}>📚</span>
              <span style={{ fontSize: "16px" }}>{t.subject?.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "13px", fontWeight: 700 }}>{t.subject?.name}</div>
                <div style={{ fontSize: "11px", color: "#aaa" }}>{t.content_type}</div>
              </div>
              <span style={{ fontWeight: 900, color: "#4ECDC4", fontSize: "13px" }}>+{POINTS.homework}pt</span>
            </div>
          ))}
          {todaySelfStudy.map((t) => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", marginBottom: "6px", borderRadius: "10px", background: "#fff5f5" }}>
              <span style={{ fontSize: "16px" }}>⭐</span>
              <span style={{ fontSize: "16px" }}>{t.subject?.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "13px", fontWeight: 700 }}>{t.subject?.name}</div>
                <div style={{ fontSize: "11px", color: "#aaa" }}>{t.content_type}</div>
              </div>
              <span style={{ fontWeight: 900, color: "#f5576c", fontSize: "13px" }}>+{POINTS.self_study}pt</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
