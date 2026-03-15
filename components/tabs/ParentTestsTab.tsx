"use client";
import { useState } from "react";
import type { Member, Subject, Score } from "@/lib/types";

interface MemberData {
  member: Member;
  subjects: Subject[];
  scores: Score[];
}

interface Props {
  childData: MemberData[];
}

const DAYS_SHORT = ["日", "月", "火", "水", "木", "金", "土"];
function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getMonth() + 1}/${d.getDate()}(${DAYS_SHORT[d.getDay()]})`;
}

function getScoreColor(pct: number) {
  if (pct >= 90) return "#43cea2";
  if (pct >= 70) return "#185a9d";
  if (pct >= 50) return "#F7B731";
  return "#f5576c";
}

export default function ParentTestsTab({ childData }: Props) {
  const [selectedMemberId, setSelectedMemberId] = useState(childData[0]?.member.id ?? "");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("all");

  const selected = childData.find((d) => d.member.id === selectedMemberId);
  if (!selected) return null;

  const filteredScores = (selectedSubjectId === "all"
    ? selected.scores
    : selected.scores.filter((s) => s.subject_id === selectedSubjectId)
  ).sort((a, b) => b.date.localeCompare(a.date));

  // 科目別平均
  const subjectStats = selected.subjects.map((s) => {
    const sc = selected.scores.filter((sc) => sc.subject_id === s.id);
    if (sc.length === 0) return null;
    const avg = Math.round(sc.reduce((sum, sc) => sum + (sc.score / sc.max) * 100, 0) / sc.length);
    const latest = sc.sort((a, b) => b.date.localeCompare(a.date))[0];
    return { ...s, avg, count: sc.length, latest };
  }).filter(Boolean) as (Subject & { avg: number; count: number; latest: Score })[];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

      {/* 子供セレクター */}
      <div style={{ display: "flex", gap: "8px" }}>
        {childData.map((d) => (
          <button
            key={d.member.id}
            onClick={() => { setSelectedMemberId(d.member.id); setSelectedSubjectId("all"); }}
            style={{
              flex: 1,
              padding: "10px 6px",
              borderRadius: "14px",
              border: `2px solid ${selectedMemberId === d.member.id ? d.member.color : "#e5e7eb"}`,
              background: selectedMemberId === d.member.id ? `${d.member.color}18` : "white",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span style={{ fontSize: "22px" }}>{d.member.emoji}</span>
            <span style={{ fontSize: "11px", fontWeight: 800, color: selectedMemberId === d.member.id ? d.member.color : "#555" }}>{d.member.display_name}</span>
          </button>
        ))}
      </div>

      {/* 科目別サマリー */}
      {subjectStats.length > 0 && (
        <div style={{ background: "white", borderRadius: "18px", padding: "16px", boxShadow: "0 4px 14px rgba(0,0,0,0.08)" }}>
          <h3 style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 800, color: "#333" }}>📊 教科別平均点</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
            {subjectStats.map((s) => {
              const color = getScoreColor(s.avg);
              return (
                <div key={s.id} style={{ background: "#f9fafb", borderRadius: "12px", padding: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "20px" }}>{s.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "#333" }}>{s.name}</div>
                    <div style={{ fontSize: "10px", color: "#aaa" }}>{s.count}回</div>
                  </div>
                  <div style={{ fontWeight: 900, fontSize: "18px", color }}>{s.avg}%</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 科目フィルター */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        <button
          onClick={() => setSelectedSubjectId("all")}
          style={{ padding: "5px 14px", borderRadius: "20px", border: `2px solid ${selectedSubjectId === "all" ? selected.member.color : "#e5e7eb"}`, background: selectedSubjectId === "all" ? selected.member.color : "white", color: selectedSubjectId === "all" ? "white" : "#555", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
        >
          すべて
        </button>
        {selected.subjects.filter((s) => selected.scores.some((sc) => sc.subject_id === s.id)).map((s) => (
          <button
            key={s.id}
            onClick={() => setSelectedSubjectId(s.id)}
            style={{ padding: "5px 14px", borderRadius: "20px", border: `2px solid ${selectedSubjectId === s.id ? s.color : "#e5e7eb"}`, background: selectedSubjectId === s.id ? s.color : "white", color: selectedSubjectId === s.id ? "white" : "#555", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
          >
            {s.emoji}{s.name}
          </button>
        ))}
      </div>

      {/* テスト一覧 */}
      <div style={{ background: "white", borderRadius: "18px", padding: "16px", boxShadow: "0 4px 14px rgba(0,0,0,0.08)" }}>
        <h3 style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 800, color: "#333" }}>📝 テストきろく</h3>
        {filteredScores.length === 0 && (
          <p style={{ color: "#ccc", textAlign: "center", fontSize: "13px" }}>テストのきろくがないよ</p>
        )}
        {filteredScores.map((sc) => {
          const pct = Math.round((sc.score / sc.max) * 100);
          const color = getScoreColor(pct);
          return (
            <div key={sc.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", marginBottom: "8px", borderRadius: "12px", background: "#f9fafb", border: `2px solid ${color}22` }}>
              <span style={{ fontSize: "20px" }}>{sc.subject?.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#333" }}>{sc.name}</div>
                <div style={{ fontSize: "11px", color: "#aaa" }}>{sc.subject?.name} · {formatDateLabel(sc.date)}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 900, fontSize: "16px", color }}>{sc.score}<span style={{ fontSize: "11px", color: "#aaa" }}>/{sc.max}</span></div>
                <div style={{ fontSize: "11px", fontWeight: 700, color }}>{pct}%</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
