"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Member } from "@/lib/types";

// ★ 変更したい場合はここの数字を書き換えてください
const PARENT_PIN = "0612";

export default function HomePage() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [pinTarget, setPinTarget] = useState<Member | null>(null);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

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
    if (member.role === "parent") {
      setPinTarget(member);
      setPinInput("");
      setPinError(false);
    } else {
      localStorage.setItem("studyMemberId", member.id);
      router.push(`/study/${member.id}`);
    }
  };

  const handlePinPress = (digit: string) => {
    if (pinInput.length >= 4) return;
    const next = pinInput + digit;
    setPinInput(next);
    setPinError(false);
    if (next.length === 4) {
      if (next === PARENT_PIN) {
        localStorage.setItem("studyMemberId", pinTarget!.id);
        router.push("/parent");
      } else {
        setPinError(true);
        setTimeout(() => setPinInput(""), 600);
      }
    }
  };

  const handlePinDelete = () => {
    setPinInput((p) => p.slice(0, -1));
    setPinError(false);
  };

  const children = members.filter((m) => m.role === "child");
  const parents  = members.filter((m) => m.role === "parent");

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#a8edea 0%,#fed6e3 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: "40px" }}>📚</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#a8edea 0%,#fed6e3 100%)", padding: "24px 16px", fontFamily: "'Noto Sans JP', sans-serif" }}>

      {/* PINダイアログ */}
      {pinTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "white", borderRadius: "28px", padding: "32px 28px", width: "300px", boxShadow: "0 20px 60px rgba(0,0,0,0.25)", textAlign: "center" }}>
            <div style={{ fontSize: "36px", marginBottom: "6px" }}>{pinTarget.emoji}</div>
            <div style={{ fontWeight: 900, fontSize: "17px", color: "#333", marginBottom: "4px" }}>{pinTarget.display_name}</div>
            <div style={{ fontSize: "12px", color: "#aaa", marginBottom: "24px" }}>あんしょうばんごうを入力してね</div>

            {/* ドット表示 */}
            <div style={{ display: "flex", justifyContent: "center", gap: "14px", marginBottom: "8px" }}>
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    width: "16px", height: "16px", borderRadius: "50%",
                    background: pinError ? "#f44336" : i < pinInput.length ? "#185a9d" : "#e5e7eb",
                    transition: "background 0.15s",
                  }}
                />
              ))}
            </div>
            {pinError && <div style={{ fontSize: "12px", color: "#f44336", marginBottom: "8px", fontWeight: 700 }}>ちがうよ！もういちど</div>}
            {!pinError && <div style={{ height: "22px", marginBottom: "8px" }} />}

            {/* テンキー */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "12px" }}>
              {["1","2","3","4","5","6","7","8","9"].map((d) => (
                <button
                  key={d}
                  onClick={() => handlePinPress(d)}
                  style={{ padding: "16px", borderRadius: "14px", border: "2px solid #e5e7eb", background: "white", fontSize: "20px", fontWeight: 800, color: "#333", cursor: "pointer" }}
                >
                  {d}
                </button>
              ))}
              <div />
              <button
                onClick={() => handlePinPress("0")}
                style={{ padding: "16px", borderRadius: "14px", border: "2px solid #e5e7eb", background: "white", fontSize: "20px", fontWeight: 800, color: "#333", cursor: "pointer" }}
              >
                0
              </button>
              <button
                onClick={handlePinDelete}
                style={{ padding: "16px", borderRadius: "14px", border: "2px solid #e5e7eb", background: "#f9fafb", fontSize: "18px", color: "#888", cursor: "pointer" }}
              >
                ⌫
              </button>
            </div>

            <button
              onClick={() => { setPinTarget(null); setPinInput(""); }}
              style={{ width: "100%", padding: "10px", borderRadius: "12px", border: "2px solid #e5e7eb", background: "white", color: "#aaa", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* ヘッダー */}
      <div style={{ textAlign: "center", marginBottom: "36px" }}>
        <div style={{ fontSize: "56px", marginBottom: "8px" }}>📚</div>
        <h1 style={{ margin: 0, fontSize: "28px", fontWeight: 900, background: "linear-gradient(135deg,#43cea2,#185a9d)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          べんきょう手帳
        </h1>
        <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#888" }}>だれがつかう？</p>
      </div>

      <div style={{ maxWidth: "480px", margin: "0 auto" }}>
        {/* 子供カード */}
        <p style={{ fontSize: "12px", fontWeight: 700, color: "#888", marginBottom: "10px", textAlign: "center", letterSpacing: "0.05em" }}>こどもたち</p>
        <div style={{ display: "grid", gridTemplateColumns: children.length === 1 ? "1fr" : "1fr 1fr", gap: "14px", marginBottom: "28px" }}>
          {children.map((m) => (
            <button
              key={m.id}
              onClick={() => handleSelect(m)}
              style={{ background: "white", borderRadius: "24px", padding: "28px 16px", border: "none", cursor: "pointer", boxShadow: "0 8px 32px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}
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
              style={{ background: "rgba(255,255,255,0.8)", borderRadius: "16px", padding: "14px 8px", border: "2px solid rgba(255,255,255,0.9)", cursor: "pointer", boxShadow: "0 4px 14px rgba(0,0,0,0.08)", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}
            >
              <div style={{ fontSize: "28px" }}>{m.emoji}</div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#555" }}>{m.display_name}</div>
              <div style={{ fontSize: "9px", color: "#bbb" }}>🔒</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
