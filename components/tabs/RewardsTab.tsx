"use client";
import { useState, useEffect } from "react";
import type { Member } from "@/lib/types";

interface Reward {
  id: number;
  name: string;
  emoji: string;
  cost: number;
  description: string | null;
}

interface PointHistory {
  id: number;
  amount: number;
  reason: string;
  type: string;
  created_at: string;
  from_member: Member | null;
}

interface RewardRequest {
  id: number;
  status: string;
  message: string | null;
  parent_note: string | null;
  created_at: string;
  reward: Reward;
}

interface Props {
  member: Member;
  balance: number;
  onBalanceChange: (newBalance: number) => void;
}

export default function RewardsTab({ member, balance, onBalanceChange }: Props) {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [history, setHistory] = useState<PointHistory[]>([]);
  const [requests, setRequests] = useState<RewardRequest[]>([]);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [viewTab, setViewTab] = useState<"shop" | "history">("shop");

  const fetchData = async () => {
    const [rRes, pRes, reqRes] = await Promise.all([
      fetch("/api/rewards"),
      fetch(`/api/points?memberId=${member.id}`),
      fetch(`/api/reward-requests?memberId=${member.id}`),
    ]);
    const [rData, pData, reqData] = await Promise.all([rRes.json(), pRes.json(), reqRes.json()]);
    if (Array.isArray(rData)) setRewards(rData);
    if (pData.history) {
      setHistory(pData.history);
      onBalanceChange(pData.balance ?? 0);
    }
    if (Array.isArray(reqData)) setRequests(reqData);
  };

  useEffect(() => { fetchData(); }, [member.id]);

  const handleRequest = async () => {
    if (!selectedReward || sending) return;
    setSending(true);
    const res = await fetch("/api/reward-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ member_id: member.id, reward_id: selectedReward.id, message }),
    });
    const data = await res.json();
    setSending(false);
    if (data.error) {
      alert(data.error);
      return;
    }
    setSuccessMsg(`${selectedReward.emoji} ${selectedReward.name} をたのんだよ！チャットを見てね 💬`);
    setSelectedReward(null);
    setMessage("");
    setTimeout(() => setSuccessMsg(""), 4000);
    fetchData();
  };

  const statusLabel = (s: string) => {
    if (s === "pending") return { label: "まってるよ⏳", color: "#F7B731" };
    if (s === "approved") return { label: "OKもらった🎉", color: "#43cea2" };
    return { label: "またこんど😢", color: "#aaa" };
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* ポイント残高 */}
      <div style={{ background: `linear-gradient(135deg, ${member.color}, #185a9d)`, borderRadius: "20px", padding: "20px", textAlign: "center", color: "white", boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}>
        <div style={{ fontSize: "13px", opacity: 0.85, marginBottom: "4px" }}>いまのポイント</div>
        <div style={{ fontSize: "52px", fontWeight: 900, letterSpacing: "2px" }}>
          ⭐ {balance}
        </div>
        <div style={{ fontSize: "12px", opacity: 0.75, marginTop: "4px" }}>がんばるともっとたまるよ！</div>
      </div>

      {/* 成功メッセージ */}
      {successMsg && (
        <div style={{ background: "#f0fff8", border: "2px solid #43cea2", borderRadius: "14px", padding: "14px", textAlign: "center", fontSize: "14px", fontWeight: 700, color: "#43cea2" }}>
          {successMsg}
        </div>
      )}

      {/* タブ切り替え */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
        {[["shop", "🛍️ ごほうびショップ"], ["history", "📋 りれき"]].map(([key, label]) => (
          <button key={key} onClick={() => setViewTab(key as "shop" | "history")} style={{ padding: "10px", borderRadius: "12px", border: "none", background: viewTab === key ? "white" : "rgba(255,255,255,0.45)", color: viewTab === key ? member.color : "#555", fontWeight: 800, fontSize: "12px", cursor: "pointer", boxShadow: viewTab === key ? "0 4px 12px rgba(0,0,0,0.1)" : "none" }}>
            {label}
          </button>
        ))}
      </div>

      {/* ごほうびショップ */}
      {viewTab === "shop" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {rewards.map((r) => {
              const canAfford = balance >= r.cost;
              const isSelected = selectedReward?.id === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => canAfford && setSelectedReward(isSelected ? null : r)}
                  style={{ background: "white", borderRadius: "16px", padding: "16px 12px", border: `2px solid ${isSelected ? member.color : canAfford ? "#e5e7eb" : "#f0f0f0"}`, cursor: canAfford ? "pointer" : "not-allowed", opacity: canAfford ? 1 : 0.5, textAlign: "center", boxShadow: isSelected ? `0 0 0 3px ${member.color}44` : "0 4px 12px rgba(0,0,0,0.06)", transition: "all 0.15s" }}
                >
                  <div style={{ fontSize: "36px", marginBottom: "6px" }}>{r.emoji}</div>
                  <div style={{ fontSize: "13px", fontWeight: 800, color: "#333", marginBottom: "4px" }}>{r.name}</div>
                  {r.description && <div style={{ fontSize: "10px", color: "#aaa", marginBottom: "8px" }}>{r.description}</div>}
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "3px", background: canAfford ? `${member.color}22` : "#f5f5f5", borderRadius: "20px", padding: "4px 10px" }}>
                    <span style={{ fontSize: "13px" }}>⭐</span>
                    <span style={{ fontSize: "13px", fontWeight: 900, color: canAfford ? member.color : "#bbb" }}>{r.cost}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* 注文フォーム */}
          {selectedReward && (
            <div style={{ background: "white", borderRadius: "18px", padding: "16px", boxShadow: "0 4px 14px rgba(0,0,0,0.1)", border: `2px solid ${member.color}` }}>
              <h3 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 800, color: "#333" }}>
                {selectedReward.emoji} {selectedReward.name} をたのむ
              </h3>
              <p style={{ fontSize: "12px", color: "#888", margin: "0 0 10px" }}>
                ⭐ {selectedReward.cost}ポイント → のこり {balance - selectedReward.cost}ポイント
              </p>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#666" }}>ひとことメッセージ（なくてもOK）</label>
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="例：きょうがんばったから！"
                  style={{ display: "block", width: "100%", marginTop: "6px", padding: "10px 14px", borderRadius: "12px", border: "2px solid #e5e7eb", fontSize: "13px", boxSizing: "border-box", outline: "none" }}
                />
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => setSelectedReward(null)} style={{ flex: 1, padding: "11px", borderRadius: "12px", border: "2px solid #e5e7eb", background: "white", color: "#888", fontWeight: 700, cursor: "pointer", fontSize: "13px" }}>
                  やめる
                </button>
                <button onClick={handleRequest} disabled={sending} style={{ flex: 2, padding: "11px", borderRadius: "12px", border: "none", background: `linear-gradient(135deg, ${member.color}, #185a9d)`, color: "white", fontWeight: 900, cursor: "pointer", fontSize: "13px" }}>
                  {sending ? "おくりちゅう..." : "🎁 たのむ！"}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* 履歴タブ */}
      {viewTab === "history" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {/* リクエスト状況 */}
          {requests.length > 0 && (
            <div style={{ background: "white", borderRadius: "18px", padding: "16px", boxShadow: "0 4px 14px rgba(0,0,0,0.08)" }}>
              <h3 style={{ margin: "0 0 10px", fontSize: "13px", fontWeight: 800, color: "#333" }}>🎁 たのんだごほうび</h3>
              {requests.map((req) => {
                const s = statusLabel(req.status);
                return (
                  <div key={req.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", marginBottom: "6px", borderRadius: "12px", background: "#f9fafb", border: `2px solid ${s.color}30` }}>
                    <span style={{ fontSize: "24px" }}>{req.reward.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "13px", fontWeight: 700 }}>{req.reward.name}</div>
                      {req.parent_note && <div style={{ fontSize: "11px", color: "#888" }}>💬 {req.parent_note}</div>}
                    </div>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: s.color, whiteSpace: "nowrap" }}>{s.label}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* ポイント履歴 */}
          <div style={{ background: "white", borderRadius: "18px", padding: "16px", boxShadow: "0 4px 14px rgba(0,0,0,0.08)" }}>
            <h3 style={{ margin: "0 0 10px", fontSize: "13px", fontWeight: 800, color: "#333" }}>⭐ ポイントのきろく</h3>
            {history.length === 0 && <p style={{ color: "#ccc", textAlign: "center", fontSize: "13px" }}>まだないよ！</p>}
            {history.map((h) => (
              <div key={h.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px", marginBottom: "6px", borderRadius: "12px", background: h.type === "earned" ? "#f0fff8" : "#fff5f5" }}>
                <span style={{ fontSize: "18px" }}>{h.type === "earned" ? "⭐" : "💸"}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "13px", fontWeight: 700 }}>{h.reason}</div>
                  <div style={{ fontSize: "10px", color: "#aaa" }}>
                    {h.from_member && `${h.from_member.emoji} ${h.from_member.display_name}から`}
                  </div>
                </div>
                <span style={{ fontWeight: 900, fontSize: "15px", color: h.type === "earned" ? "#43cea2" : "#f5576c" }}>
                  {h.type === "earned" ? "+" : ""}{h.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
