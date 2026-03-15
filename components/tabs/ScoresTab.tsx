"use client";
import { useState } from "react";
import type { Member, Subject, Score } from "@/lib/types";

const DAYS_SHORT = ["日", "月", "火", "水", "木", "金", "土"];
function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getMonth() + 1}月${d.getDate()}日(${DAYS_SHORT[d.getDay()]})`;
}

const TEST_TYPES = [
  { id: "other", label: "通常テスト" },
  { id: "regular", label: "確認テスト" },
  { id: "midterm", label: "中間テスト" },
  { id: "final", label: "期末テスト" },
];

interface Props {
  member: Member;
  subjects: Subject[];
  scores: Score[];
  onAddScore: (subjectId: string, name: string, testType: string, score: number, max: number) => Promise<void>;
}

export default function ScoresTab({ member, subjects, scores, onAddScore }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ subjectId: subjects[0]?.id ?? "", name: "", testType: "other", score: "", max: "100" });

  const handleAdd = async () => {
    if (!form.score || !form.name || !form.subjectId) return;
    await onAddScore(form.subjectId, form.name, form.testType, Number(form.score), Number(form.max));
    setForm({ subjectId: subjects[0]?.id ?? "", name: "", testType: "other", score: "", max: "100" });
    setShowForm(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <button
        onClick={() => setShowForm(!showForm)}
        style={{ padding: "13px", borderRadius: "16px", border: "none", background: "white", color: "#185a9d", fontWeight: 900, fontSize: "14px", cursor: "pointer", boxShadow: "0 4px 14px rgba(0,0,0,0.08)" }}
      >
        {showForm ? "✕ とじる" : "➕ テストの点数を記録"}
      </button>

      {showForm && (
        <div style={{ background: "white", borderRadius: "18px", padding: "16px", boxShadow: "0 4px 14px rgba(0,0,0,0.08)" }}>
          <div style={{ marginBottom: "12px" }}>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "#666" }}>テスト名</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="例：算数 第3回テスト" style={{ display: "block", width: "100%", marginTop: "4px", padding: "10px 14px", borderRadius: "12px", border: "2px solid #e5e7eb", fontSize: "13px", boxSizing: "border-box", outline: "none" }} />
          </div>
          <div style={{ marginBottom: "12px" }}>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "#666" }}>種類</label>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "6px" }}>
              {TEST_TYPES.map((t) => (
                <button key={t.id} onClick={() => setForm({ ...form, testType: t.id })} style={{ padding: "4px 10px", borderRadius: "20px", border: `2px solid ${form.testType === t.id ? "#185a9d" : "#e5e7eb"}`, background: form.testType === t.id ? "#185a9d" : "white", color: form.testType === t.id ? "white" : "#555", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: "12px" }}>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "#666" }}>教科</label>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "6px" }}>
              {subjects.map((s) => (
                <button key={s.id} onClick={() => setForm({ ...form, subjectId: s.id })} style={{ padding: "5px 12px", borderRadius: "20px", border: `2px solid ${form.subjectId === s.id ? s.color : "#e5e7eb"}`, background: form.subjectId === s.id ? s.color : "white", color: form.subjectId === s.id ? "white" : "#555", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                  {s.emoji}{s.name}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
            {[["score", "点数", "80"], ["max", "満点", "100"]].map(([key, lbl, ph]) => (
              <div key={key} style={{ flex: 1 }}>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#666" }}>{lbl}</label>
                <input type="number" value={form[key as "score" | "max"]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={ph} style={{ display: "block", width: "100%", marginTop: "4px", padding: "10px 14px", borderRadius: "12px", border: "2px solid #e5e7eb", fontSize: "13px", boxSizing: "border-box", outline: "none" }} />
              </div>
            ))}
          </div>
          <button onClick={handleAdd} style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "none", background: `linear-gradient(135deg, ${member.color}, #185a9d)`, color: "white", fontWeight: 800, fontSize: "14px", cursor: "pointer" }}>記録する ✨</button>
        </div>
      )}

      <div style={{ background: "white", borderRadius: "18px", padding: "16px", boxShadow: "0 4px 14px rgba(0,0,0,0.08)" }}>
        <h3 style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 800, color: "#333" }}>📝 テスト結果一覧</h3>
        {scores.length === 0 && <p style={{ color: "#ccc", textAlign: "center", fontSize: "13px" }}>まだ記録がないよ！</p>}
        {[...scores].map((sc) => {
          const pct = Math.round((sc.score / sc.max) * 100);
          const c = pct >= 80 ? "#4caf50" : pct >= 60 ? "#ff9800" : "#f44336";
          const typeLabel = TEST_TYPES.find((t) => t.id === sc.test_type)?.label;
          return (
            <div key={sc.id} style={{ padding: "12px", marginBottom: "8px", borderRadius: "14px", background: "#f9fafb", border: `2px solid ${c}30` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 700 }}>{sc.subject?.emoji} {sc.name}</div>
                  <div style={{ fontSize: "11px", color: "#aaa" }}>{formatDateLabel(sc.date)} {typeLabel && <span style={{ background: "#e5e7eb", borderRadius: "10px", padding: "1px 7px", marginLeft: "4px" }}>{typeLabel}</span>}</div>
                </div>
                <div>
                  <span style={{ fontWeight: 900, fontSize: "22px", color: c }}>{sc.score}</span>
                  <span style={{ color: "#aaa", fontSize: "12px" }}>/{sc.max}</span>
                </div>
              </div>
              <div style={{ marginTop: "8px", background: "#e5e7eb", borderRadius: "4px", height: "7px" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: c, borderRadius: "4px" }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
