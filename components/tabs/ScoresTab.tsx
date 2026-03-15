"use client";
import { useState, useRef } from "react";
import type { Member, Subject, Score } from "@/lib/types";
import { compressImageTo350KB } from "@/lib/compressImage";

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

// テスト結果に応じたポイント（100%:15pt, 80-99%:10pt, 60-79%:5pt, それ以下:1pt）
function calcPoints(score: number, max: number): number {
  const pct = max > 0 ? (score / max) * 100 : 0;
  if (pct >= 100) return 15;
  if (pct >= 80) return 10;
  if (pct >= 60) return 5;
  return 1;
}

interface Props {
  member: Member;
  subjects: Subject[];
  scores: Score[];
  onAddScore: (subjectId: string, name: string, testType: string, score: number, max: number, imageUrl?: string) => Promise<void>;
}

export default function ScoresTab({ member, subjects, scores, onAddScore }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<"manual" | "photo">("manual");
  const [form, setForm] = useState({ subjectId: subjects[0]?.id ?? "", name: "", testType: "other", score: "", max: "100" });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !f.type.startsWith("image/")) return;
    setPhotoFile(f);
    setPhotoPreview(URL.createObjectURL(f));
    setUploadError(null);
  };

  const handleAdd = async () => {
    if (!form.score || !form.name || !form.subjectId) return;
    let imageUrl: string | undefined;
    if (formMode === "photo" && photoFile) {
      setUploading(true);
      setUploadError(null);
      try {
        const compressed = await compressImageTo350KB(photoFile);
        const fd = new FormData();
        fd.append("image", compressed, "photo.jpg");
        fd.append("memberId", member.id);
        const res = await fetch("/api/upload/score-image", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "アップロード失敗");
        imageUrl = data.url;
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : "写真のアップロードに失敗しました");
        setUploading(false);
        return;
      }
      setUploading(false);
    }
    await onAddScore(form.subjectId, form.name, form.testType, Number(form.score), Number(form.max), imageUrl);
    setForm({ subjectId: subjects[0]?.id ?? "", name: "", testType: "other", score: "", max: "100" });
    setPhotoFile(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
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
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
            <button type="button" onClick={() => { setFormMode("manual"); setPhotoFile(null); setPhotoPreview(null); setUploadError(null); }} style={{ flex: 1, padding: "10px", borderRadius: "12px", border: `2px solid ${formMode === "manual" ? "#185a9d" : "#e5e7eb"}`, background: formMode === "manual" ? "#185a9d" : "white", color: formMode === "manual" ? "white" : "#555", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>✏️ 手入力</button>
            <button type="button" onClick={() => setFormMode("photo")} style={{ flex: 1, padding: "10px", borderRadius: "12px", border: `2px solid ${formMode === "photo" ? "#185a9d" : "#e5e7eb"}`, background: formMode === "photo" ? "#185a9d" : "white", color: formMode === "photo" ? "white" : "#555", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>📷 写真で記録</button>
          </div>

          {formMode === "photo" && (
            <div style={{ marginBottom: "12px" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, color: "#666" }}>テストの写真</label>
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoSelect} style={{ display: "none" }} />
              <div style={{ display: "flex", gap: "10px", marginTop: "6px", alignItems: "flex-start" }}>
                <button type="button" onClick={() => fileInputRef.current?.click()} style={{ padding: "12px 16px", borderRadius: "12px", border: "2px dashed #e5e7eb", background: "#f9fafb", color: "#185a9d", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>📷 撮る / 選ぶ</button>
                {photoPreview && (
                  <div style={{ position: "relative" }}>
                    <img src={photoPreview} alt="プレビュー" style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "10px", border: "2px solid #e5e7eb" }} />
                    <button type="button" onClick={() => { setPhotoFile(null); setPhotoPreview(null); if (photoPreview) URL.revokeObjectURL(photoPreview); }} style={{ position: "absolute", top: "-6px", right: "-6px", width: "22px", height: "22px", borderRadius: "50%", border: "none", background: "#f44336", color: "white", fontSize: "12px", cursor: "pointer", lineHeight: 1 }}>×</button>
                  </div>
                )}
              </div>
              <p style={{ margin: "4px 0 0", fontSize: "10px", color: "#888" }}>350KB以下に自動で圧縮されます</p>
              {uploadError && <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#f44336" }}>{uploadError}</p>}
            </div>
          )}

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
          <button onClick={handleAdd} disabled={uploading} style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "none", background: uploading ? "#ccc" : `linear-gradient(135deg, ${member.color}, #185a9d)`, color: "white", fontWeight: 800, fontSize: "14px", cursor: uploading ? "wait" : "pointer" }}>{uploading ? "アップロード中..." : "記録する ✨"}</button>
        </div>
      )}

      <div style={{ background: "white", borderRadius: "18px", padding: "16px", boxShadow: "0 4px 14px rgba(0,0,0,0.08)" }}>
        <h3 style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 800, color: "#333" }}>📝 テスト結果一覧</h3>
        <p style={{ margin: "0 0 12px", fontSize: "11px", color: "#888" }}>テストを記録するとポイントがもらえるよ！ 100点:15pt / 80-99%:10pt / 60-79%:5pt / それ以下:1pt</p>
        {scores.length === 0 && <p style={{ color: "#ccc", textAlign: "center", fontSize: "13px" }}>まだ記録がないよ！</p>}
        {[...scores].map((sc) => {
          const pct = Math.round((sc.score / sc.max) * 100);
          const c = pct >= 80 ? "#4caf50" : pct >= 60 ? "#ff9800" : "#f44336";
          const typeLabel = TEST_TYPES.find((t) => t.id === sc.test_type)?.label;
          const points = calcPoints(sc.score, sc.max);
          return (
            <div key={sc.id} style={{ padding: "12px", marginBottom: "8px", borderRadius: "14px", background: "#f9fafb", border: `2px solid ${c}30` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "13px", fontWeight: 700 }}>{sc.subject?.emoji} {sc.name}</div>
                  <div style={{ fontSize: "11px", color: "#aaa" }}>{formatDateLabel(sc.date)} {typeLabel && <span style={{ background: "#e5e7eb", borderRadius: "10px", padding: "1px 7px", marginLeft: "4px" }}>{typeLabel}</span>}</div>
                  {sc.image_url && (
                    <a href={sc.image_url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", marginTop: "6px" }}>
                      <img src={sc.image_url} alt="テスト写真" style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "8px", border: "2px solid #e5e7eb" }} />
                    </a>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                  <span style={{ background: "linear-gradient(135deg, #F7B731, #ff9800)", color: "white", fontSize: "11px", fontWeight: 800, padding: "3px 8px", borderRadius: "10px" }}>⭐ +{points}pt</span>
                  <div>
                    <span style={{ fontWeight: 900, fontSize: "22px", color: c }}>{sc.score}</span>
                    <span style={{ color: "#aaa", fontSize: "12px" }}>/{sc.max}</span>
                  </div>
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
