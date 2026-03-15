"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Member } from "@/lib/types";

export default function HomePage() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/members")
      .then((r) => r.json())
      .then((data) => {
        setMembers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSelect = (member: Member) => {
    localStorage.setItem("studyMemberId", member.id);
    if (member.role === "parent") {
      router.push("/parent");
    } else {
      router.push(`/study/${member.id}`);
    }
  };

  const children = members.filter((m) => m.role === "child");
  const parents = members.filter((m) => m.role === "parent");

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#a8edea 0%,#fed6e3 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: "40px", animation: "pulse 1s infinite" }}>📚</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#a8edea 0%,#fed6e3 100%)", padding: "24px 16px", fontFamily: "'Noto Sans JP', sans-serif" }}>
      {/* ヘッダー */}
      <div style={{ textAlign: "center", marginBottom: "36px" }}>
        <div style={{ fontSize: "56px", marginBottom: "8px" }}>📚</div>
        <h1 style={{ margin: 0, fontSize: "28px", fontWeight: 900, background: "linear-gradient(135deg,#43cea2,#185a9d)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          べんきょう手帳
        </h1>
        <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#888" }}>だれがつかう？</p>
      </div>

      {/* 子供カード */}
      <div style={{ maxWidth: "480px", margin: "0 auto" }}>
        <p style={{ fontSize: "12px", fontWeight: 700, color: "#888", marginBottom: "10px", textAlign: "center", letterSpacing: "0.05em" }}>こどもたち</p>
        <div style={{ display: "grid", gridTemplateColumns: children.length === 1 ? "1fr" : "1fr 1fr", gap: "14px", marginBottom: "28px" }}>
          {children.map((m) => (
            <button
              key={m.id}
              onClick={() => handleSelect(m)}
              style={{
                background: "white",
                borderRadius: "24px",
                padding: "28px 16px",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                transition: "transform 0.15s, box-shadow 0.15s",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "10px",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 16px 40px rgba(0,0,0,0.15)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.1)"; }}
            >
              <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: `${m.color}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "40px", border: `3px solid ${m.color}` }}>
                {m.emoji}
              </div>
              <div style={{ fontWeight: 900, fontSize: "20px", color: "#333" }}>{m.display_name}</div>
              {m.grade && <div style={{ fontSize: "12px", color: "white", background: m.color, borderRadius: "20px", padding: "3px 12px", fontWeight: 700 }}>{m.grade}</div>}
            </button>
          ))}
        </div>

        {/* 家族カード */}
        <p style={{ fontSize: "12px", fontWeight: 700, color: "#888", marginBottom: "10px", textAlign: "center", letterSpacing: "0.05em" }}>かぞく</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
          {parents.map((m) => (
            <button
              key={m.id}
              onClick={() => handleSelect(m)}
              style={{
                background: "rgba(255,255,255,0.8)",
                borderRadius: "16px",
                padding: "14px 8px",
                border: "2px solid rgba(255,255,255,0.9)",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <div style={{ fontSize: "28px" }}>{m.emoji}</div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#555" }}>{m.display_name}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
