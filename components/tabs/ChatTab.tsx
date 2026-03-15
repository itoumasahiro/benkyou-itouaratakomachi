"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase-client";
import type { Member, ChatMessage } from "@/lib/types";

const QUICK_STAMPS = ["🎉", "👍", "💪", "🔥", "⭐", "😊", "🙌", "✨"];

interface Props {
  member: Member;
}

export default function ChatTab({ member }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    const res = await fetch("/api/chat");
    const data = await res.json();
    if (Array.isArray(data)) setMessages(data);
  };

  useEffect(() => {
    fetchMessages();
    const channel = supabase
      .channel("study_chat_realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "study_chat" }, () => {
        fetchMessages();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (msg: string) => {
    if (!msg.trim() || sending) return;
    setSending(true);
    await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ member_id: member.id, text: msg.trim() }),
    });
    setText("");
    setSending(false);
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  const formatDay = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  // 日付ごとにグループ化
  let lastDay = "";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 240px)", minHeight: "400px" }}>
      {/* メッセージ一覧 */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px", paddingBottom: "8px" }}>
        {messages.length === 0 && (
          <p style={{ color: "#ccc", textAlign: "center", fontSize: "13px", marginTop: "40px" }}>
            メッセージをおくってみよう！💬
          </p>
        )}
        {messages.map((msg) => {
          const isMe = msg.member_id === member.id;
          const day = formatDay(msg.created_at);
          const showDay = day !== lastDay;
          lastDay = day;
          const m = msg.member;

          return (
            <div key={msg.id}>
              {showDay && (
                <div style={{ textAlign: "center", fontSize: "11px", color: "#aaa", margin: "10px 0 6px", fontWeight: 700 }}>
                  {day}
                </div>
              )}
              <div style={{ display: "flex", flexDirection: isMe ? "row-reverse" : "row", alignItems: "flex-end", gap: "6px", marginBottom: "6px" }}>
                {!isMe && (
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: m ? `${m.color}22` : "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", border: m ? `2px solid ${m.color}` : "2px solid #ddd", flexShrink: 0 }}>
                    {m?.emoji ?? "👤"}
                  </div>
                )}
                <div style={{ maxWidth: "70%", display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start", gap: "2px" }}>
                  {!isMe && <div style={{ fontSize: "10px", color: "#aaa", marginBottom: "2px" }}>{m?.display_name}</div>}
                  <div style={{ background: isMe ? `linear-gradient(135deg, ${member.color}, #185a9d)` : "white", color: isMe ? "white" : "#333", padding: "9px 13px", borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px", fontSize: "13px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", wordBreak: "break-word" }}>
                    {msg.text}
                  </div>
                  <div style={{ fontSize: "10px", color: "#bbb" }}>{formatTime(msg.created_at)}</div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* 入力エリア */}
      <div style={{ background: "white", borderRadius: "18px", padding: "12px", boxShadow: "0 -4px 14px rgba(0,0,0,0.06)", marginTop: "8px" }}>
        {/* スタンプ */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "10px", justifyContent: "center" }}>
          {QUICK_STAMPS.map((stamp) => (
            <button key={stamp} onClick={() => sendMessage(stamp)} style={{ background: "none", border: "2px solid #e5e7eb", borderRadius: "10px", fontSize: "18px", padding: "4px 8px", cursor: "pointer", lineHeight: 1 }}>
              {stamp}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(text)}
            placeholder="メッセージを入力..."
            style={{ flex: 1, padding: "10px 14px", borderRadius: "12px", border: "2px solid #e5e7eb", fontSize: "13px", outline: "none" }}
          />
          <button
            onClick={() => sendMessage(text)}
            disabled={!text.trim() || sending}
            style={{ padding: "10px 16px", borderRadius: "12px", border: "none", background: text.trim() ? `linear-gradient(135deg, ${member.color}, #185a9d)` : "#e5e7eb", color: text.trim() ? "white" : "#aaa", fontWeight: 800, cursor: text.trim() ? "pointer" : "not-allowed", fontSize: "13px" }}
          >
            送信
          </button>
        </div>
      </div>
    </div>
  );
}
