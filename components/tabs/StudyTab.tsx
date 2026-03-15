"use client";
import { useState } from "react";
import type { Member, Subject, Todo } from "@/lib/types";

const DAYS_SHORT = ["日", "月", "火", "水", "木", "金", "土"];
function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getMonth() + 1}月${d.getDate()}日(${DAYS_SHORT[d.getDay()]})`;
}

const CONTENT_TYPES: Record<"homework" | "self_study", string[]> = {
  homework: ["✏️ドリル", "📖よみ", "📄プリント", "📝その他"],
  self_study: ["📗問題集", "📖よみ", "🔁復習", "📝その他"],
};

const POINTS: Record<"homework" | "self_study", number> = { homework: 2, self_study: 5 };

interface Props {
  member: Member;
  subjects: Subject[];
  studyRecords: Todo[];
  today: string;
  onSaveRecord: (subjectId: string, recordType: "homework" | "self_study", contentType: string) => Promise<void>;
}

export default function StudyTab({ member, subjects, studyRecords, today, onSaveRecord }: Props) {
  const [recordType, setRecordType] = useState<"homework" | "self_study">("homework");
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [contentType, setContentType] = useState(CONTENT_TYPES.homework[0]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleRecordTypeChange = (type: "homework" | "self_study") => {
    setRecordType(type);
    setContentType(CONTENT_TYPES[type][0]);
  };

  const handleSave = async () => {
    if (!subjectId || !contentType || saving) return;
    setSaving(true);
    await onSaveRecord(subjectId, recordType, contentType);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const todayRecords = studyRecords.filter((r) => r.date === today);
  const pastRecords = studyRecords.filter((r) => r.date !== today);
  const alreadyRecordedToday = todayRecords.some((r) => r.record_type === recordType);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ background: "white", borderRadius: "22px", padding: "24px 20px", boxShadow: "0 4px 14px rgba(0,0,0,0.08)" }}>

        {/* 種別選択 */}
        <p style={{ margin: "0 0 10px", fontSize: "13px", fontWeight: 800, color: "#555" }}>なにをした？</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
          {(
            [
              ["homework", "📚", "宿題", "2pt", "#4ECDC4"] as const,
              ["self_study", "⭐", "じしゅう", "5pt", "#f5576c"] as const,
            ] as const
          ).map(([type, icon, label, pt, color]) => (
            <button
              key={type}
              onClick={() => handleRecordTypeChange(type)}
              style={{
                padding: "14px 8px",
                borderRadius: "18px",
                border: `3px solid ${recordType === type ? color : "#e5e7eb"}`,
                background: recordType === type ? `${color}18` : "white",
                cursor: "pointer",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "30px" }}>{icon}</div>
              <div style={{ fontSize: "14px", fontWeight: 900, color: recordType === type ? color : "#555", marginTop: "4px" }}>{label}</div>
              <div style={{ fontSize: "11px", color: recordType === type ? color : "#aaa", fontWeight: 700 }}>{pt}</div>
            </button>
          ))}
        </div>

        {/* 科目選択 */}
        <p style={{ margin: "0 0 8px", fontSize: "13px", fontWeight: 800, color: "#555" }}>科目を選ぶ</p>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "20px" }}>
          {subjects.map((s) => (
            <button
              key={s.id}
              onClick={() => setSubjectId(s.id)}
              style={{
                padding: "6px 14px",
                borderRadius: "20px",
                border: `2px solid ${subjectId === s.id ? s.color : "#e5e7eb"}`,
                background: subjectId === s.id ? s.color : "white",
                color: subjectId === s.id ? "white" : "#555",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {s.emoji}{s.name}
            </button>
          ))}
        </div>

        {/* 内容選択 */}
        <p style={{ margin: "0 0 8px", fontSize: "13px", fontWeight: 800, color: "#555" }}>内容を選ぶ</p>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "24px" }}>
          {CONTENT_TYPES[recordType].map((ct) => (
            <button
              key={ct}
              onClick={() => setContentType(ct)}
              style={{
                padding: "6px 14px",
                borderRadius: "20px",
                border: `2px solid ${contentType === ct ? member.color : "#e5e7eb"}`,
                background: contentType === ct ? member.color : "white",
                color: contentType === ct ? "white" : "#555",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {ct}
            </button>
          ))}
        </div>

        {/* 記録ボタン */}
        {alreadyRecordedToday ? (
          <div style={{ width: "100%", padding: "16px", borderRadius: "50px", background: "#f0f0f0", color: "#999", fontWeight: 900, fontSize: "15px", textAlign: "center" }}>
            ✅ 今日の{recordType === "homework" ? "宿題" : "じしゅう"}はもうきろくしたよ！
          </div>
        ) : (
          <button
            onClick={handleSave}
            disabled={saving || saved}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: "50px",
              border: "none",
              background: saved ? "#43cea2" : `linear-gradient(135deg, ${member.color}, #185a9d)`,
              color: "white",
              fontWeight: 900,
              fontSize: "17px",
              cursor: saving || saved ? "default" : "pointer",
              boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
              transition: "background 0.3s",
            }}
          >
            {saved ? "✅ きろくしたよ！" : saving ? "..." : `${recordType === "homework" ? "📚" : "⭐"} きろくする (+${POINTS[recordType]}pt)`}
          </button>
        )}
      </div>

      {/* 今日のきろく */}
      <div style={{ background: "white", borderRadius: "18px", padding: "16px", boxShadow: "0 4px 14px rgba(0,0,0,0.08)" }}>
        <h3 style={{ margin: "0 0 10px", fontSize: "13px", fontWeight: 800, color: "#333" }}>📜 今日のきろく</h3>
        {todayRecords.length === 0 && (
          <p style={{ color: "#ccc", textAlign: "center", fontSize: "13px" }}>まだきろくがないよ！</p>
        )}
        {todayRecords.map((r) => (
          <div
            key={r.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "9px 12px",
              marginBottom: "6px",
              borderRadius: "12px",
              background: r.record_type === "self_study" ? "#fff8f0" : "#f0fff8",
            }}
          >
            <span style={{ fontSize: "18px" }}>{r.record_type === "self_study" ? "⭐" : "📚"}</span>
            <span style={{ fontSize: "18px" }}>{r.subject?.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "13px", fontWeight: 700 }}>{r.subject?.name}</div>
              <div style={{ fontSize: "11px", color: "#aaa" }}>{r.content_type}</div>
            </div>
            <span
              style={{
                fontWeight: 900,
                color: r.record_type === "self_study" ? "#f5576c" : "#43cea2",
                fontSize: "13px",
              }}
            >
              +{r.record_type ? POINTS[r.record_type] : 0}pt
            </span>
          </div>
        ))}
      </div>

      {/* 過去のきろく */}
      {pastRecords.length > 0 && (
        <div style={{ background: "white", borderRadius: "18px", padding: "16px", boxShadow: "0 4px 14px rgba(0,0,0,0.08)" }}>
          <h3 style={{ margin: "0 0 10px", fontSize: "13px", fontWeight: 800, color: "#333" }}>📖 これまでのきろく</h3>
          {pastRecords.map((r) => (
            <div
              key={r.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "9px 12px",
                marginBottom: "6px",
                borderRadius: "12px",
                background: "#f9fafb",
              }}
            >
              <span style={{ fontSize: "18px" }}>{r.record_type === "self_study" ? "⭐" : "📚"}</span>
              <span style={{ fontSize: "18px" }}>{r.subject?.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "13px", fontWeight: 700 }}>{r.subject?.name}</div>
                <div style={{ fontSize: "11px", color: "#aaa" }}>{r.content_type} · {formatDateLabel(r.date)}</div>
              </div>
              <span style={{ fontWeight: 900, color: "#aaa", fontSize: "12px" }}>
                +{r.record_type ? POINTS[r.record_type] : 0}pt
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
