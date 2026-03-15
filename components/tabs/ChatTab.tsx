"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase-client";
import type { Member, ChatMessage } from "@/lib/types";

// --- スタンプ ---
const STAMP_CATEGORIES: Record<string, string[]> = {
  "😊 きもち": ["😊", "😭", "😤", "🥳", "😴", "😍", "🤔", "😎", "🥺", "🤩"],
  "🐱 どうぶつ": ["🐱", "🐶", "🐼", "🦁", "🐸", "🐰", "🦊", "🐯", "🐮", "🐧"],
  "🍦 たべもの": ["🍕", "🍦", "🍩", "🎂", "🍣", "🍜", "🍎", "🍓", "🍫", "🧁"],
};

// --- はげましメッセージ ---
const PRAISE_MESSAGES = [
  "さすが！さいこう！🌟",
  "きみならできる！💪",
  "天才かも！✨",
  "すごすぎる！🔥",
  "がんばってるね！👏",
  "かっこいい！⭐",
  "やるじゃん！😎",
  "おうえんしてるよ！📣",
  "まけるな！💥",
  "どんどんのびてる！🌱",
  "むてきだ！⚡",
  "いつもえらいよ！💖",
];

// --- おみくじ ---
const FORTUNE_MESSAGES = [
  { luck: "大吉", msg: "今日は算数がはかどる日✨ 全問正解するかも！" },
  { luck: "中吉", msg: "国語の読書をすると、よいことが起きそう📖" },
  { luck: "吉", msg: "こつこつやれば、きっとうまくいく日🌸" },
  { luck: "小吉", msg: "理科の実験みたいに、じっくり考えてみよう🔬" },
  { luck: "大吉", msg: "英語をひとつ覚えると、すごいことが起きるかも🌍" },
  { luck: "中吉", msg: "社会のことを調べると、知識が光り輝く日📚" },
  { luck: "吉", msg: "今日は休憩も大事！上手に遊ぼう🎮" },
  { luck: "大吉", msg: "自習をすると、ごほうびが近づいてくる日⭐" },
];

const LUCK_COLORS: Record<string, string> = {
  大吉: "#ff6b6b",
  中吉: "#f7b731",
  吉: "#43cea2",
  小吉: "#a18cd1",
};

// --- リアクション ---
const REACTION_EMOJIS = ["❤️", "⭐", "👍", "🎉"];

type Reactions = Record<number, Record<string, string[]>>;

function getToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isOmikuji(text: string) {
  return text.startsWith("🎰 おみくじ");
}

interface Props {
  member: Member;
}

export default function ChatTab({ member }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reactions, setReactions] = useState<Reactions>({});
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [stampCategory, setStampCategory] = useState(Object.keys(STAMP_CATEGORIES)[0]);
  const [omikujiDone, setOmikujiDone] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    const res = await fetch("/api/chat");
    const data = await res.json();
    if (Array.isArray(data)) setMessages(data);
  };

  const fetchReactions = async () => {
    const res = await fetch("/api/chat-reactions");
    const data = await res.json();
    if (Array.isArray(data)) {
      const map: Reactions = {};
      for (const r of data) {
        if (!map[r.message_id]) map[r.message_id] = {};
        if (!map[r.message_id][r.emoji]) map[r.message_id][r.emoji] = [];
        map[r.message_id][r.emoji].push(r.member_id);
      }
      setReactions(map);
    }
  };

  useEffect(() => {
    fetchMessages();
    fetchReactions();
    if (localStorage.getItem(`omikuji_${getToday()}`)) setOmikujiDone(true);

    const channel = supabase
      .channel("study_chat_realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "study_chat" }, () => {
        fetchMessages();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "study_chat_reactions" }, () => {
        fetchReactions();
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

  const sendPraise = async () => {
    const msg = PRAISE_MESSAGES[Math.floor(Math.random() * PRAISE_MESSAGES.length)];
    await sendMessage(msg);
  };

  const sendOmikuji = async () => {
    if (omikujiDone) return;
    const fortune = FORTUNE_MESSAGES[Math.floor(Math.random() * FORTUNE_MESSAGES.length)];
    await sendMessage(`🎰 おみくじ：【${fortune.luck}】\n${fortune.msg}`);
    localStorage.setItem(`omikuji_${getToday()}`, "1");
    setOmikujiDone(true);
  };

  const toggleReaction = async (messageId: number, emoji: string) => {
    const myReactions = reactions[messageId]?.[emoji] ?? [];
    const hasMyReaction = myReactions.includes(member.id);
    // Optimistic update
    setReactions((prev) => {
      const updated = { ...prev, [messageId]: { ...(prev[messageId] ?? {}) } };
      if (hasMyReaction) {
        updated[messageId][emoji] = (updated[messageId][emoji] ?? []).filter((id) => id !== member.id);
      } else {
        updated[messageId][emoji] = [...(updated[messageId][emoji] ?? []), member.id];
      }
      return updated;
    });
    await fetch("/api/chat-reactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message_id: messageId, member_id: member.id, emoji, remove: hasMyReaction }),
    });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  };
  const formatDay = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  let lastDay = "";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100svh - 240px)", minHeight: "400px" }}>
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
          const msgReactions = reactions[msg.id] ?? {};
          const activeReactions = REACTION_EMOJIS.filter((e) => (msgReactions[e]?.length ?? 0) > 0);


          if (isOmikuji(msg.text)) {
            const lines = msg.text.split("\n");
            const luckMatch = lines[0].match(/【(.+?)】/);
            const luck = luckMatch?.[1] ?? "吉";
            const luckColor = LUCK_COLORS[luck] ?? "#43cea2";
            return (
              <div key={msg.id}>
                {showDay && (
                  <div style={{ textAlign: "center", fontSize: "11px", color: "#aaa", margin: "10px 0 6px", fontWeight: 700 }}>{day}</div>
                )}
                <div style={{ margin: "8px 4px", background: "white", borderRadius: "20px", padding: "16px", textAlign: "center", boxShadow: "0 4px 14px rgba(0,0,0,0.1)", border: `3px solid ${luckColor}` }}>
                  <div style={{ fontSize: "24px", marginBottom: "4px" }}>🎰</div>
                  <div style={{ fontWeight: 900, fontSize: "22px", color: luckColor }}>{luck}</div>
                  <div style={{ fontSize: "13px", color: "#555", marginTop: "6px", lineHeight: 1.6 }}>{lines[1]}</div>
                  <div style={{ fontSize: "10px", color: "#bbb", marginTop: "8px" }}>{m?.display_name} · {formatTime(msg.created_at)}</div>
                  {activeReactions.length > 0 && (
                    <div style={{ display: "flex", gap: "4px", justifyContent: "center", marginTop: "8px" }}>
                      {activeReactions.map((e) => (
                        <button key={e} onClick={() => toggleReaction(msg.id, e)} style={{ background: msgReactions[e]?.includes(member.id) ? "#fff3cd" : "#f9fafb", border: `1.5px solid ${msgReactions[e]?.includes(member.id) ? "#ffc107" : "#e5e7eb"}`, borderRadius: "12px", padding: "2px 8px", fontSize: "12px", cursor: "pointer", fontWeight: 700 }}>
                          {e} {msgReactions[e].length}
                        </button>
                      ))}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: "4px", justifyContent: "center", marginTop: "6px" }}>
                    {REACTION_EMOJIS.map((e) => (
                      <button key={e} onClick={() => toggleReaction(msg.id, e)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "14px", opacity: 0.4 }}>{e}</button>
                    ))}
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div key={msg.id}>
              {showDay && (
                <div style={{ textAlign: "center", fontSize: "11px", color: "#aaa", margin: "10px 0 6px", fontWeight: 700 }}>{day}</div>
              )}
              <div style={{ display: "flex", flexDirection: isMe ? "row-reverse" : "row", alignItems: "flex-end", gap: "6px", marginBottom: "6px" }}>
                {!isMe && (
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: m ? `${m.color}22` : "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", border: m ? `2px solid ${m.color}` : "2px solid #ddd", flexShrink: 0 }}>
                    {m?.emoji ?? "👤"}
                  </div>
                )}
                <div style={{ maxWidth: "70%", display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start", gap: "2px" }}>
                  {!isMe && <div style={{ fontSize: "10px", color: "#aaa", marginBottom: "2px" }}>{m?.display_name}</div>}
                  <div style={{ background: isMe ? `linear-gradient(135deg, ${member.color}, #185a9d)` : "white", color: isMe ? "white" : "#333", padding: "9px 13px", borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px", fontSize: "13px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", wordBreak: "break-word", whiteSpace: "pre-line" }}>
                    {msg.text}
                  </div>
                  <div style={{ fontSize: "10px", color: "#bbb" }}>{formatTime(msg.created_at)}</div>
                  {/* リアクション表示 */}
                  {activeReactions.length > 0 && (
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                      {activeReactions.map((e) => (
                        <button key={e} onClick={() => toggleReaction(msg.id, e)} style={{ background: msgReactions[e]?.includes(member.id) ? "#fff3cd" : "#f9fafb", border: `1.5px solid ${msgReactions[e]?.includes(member.id) ? "#ffc107" : "#e5e7eb"}`, borderRadius: "12px", padding: "2px 8px", fontSize: "12px", cursor: "pointer", fontWeight: 700 }}>
                          {e} {msgReactions[e].length}
                        </button>
                      ))}
                    </div>
                  )}
                  {/* リアクション追加 */}
                  <div style={{ display: "flex", gap: "2px" }}>
                    {REACTION_EMOJIS.map((e) => (
                      <button key={e} onClick={() => toggleReaction(msg.id, e)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "13px", opacity: 0.35, padding: "0 2px" }}>
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* 入力エリア */}
      <div style={{ background: "white", borderRadius: "18px", padding: "12px", boxShadow: "0 -4px 14px rgba(0,0,0,0.06)", marginTop: "8px" }}>
        {/* 特別ボタン */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "10px", justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={sendPraise} style={{ padding: "6px 12px", borderRadius: "14px", border: "none", background: "linear-gradient(135deg, #a18cd1, #fbc2eb)", color: "white", fontWeight: 800, fontSize: "11px", cursor: "pointer" }}>
            💬 はげます
          </button>
          <button onClick={sendOmikuji} disabled={omikujiDone} style={{ padding: "6px 12px", borderRadius: "14px", border: "none", background: omikujiDone ? "#e5e7eb" : "linear-gradient(135deg, #43cea2, #185a9d)", color: omikujiDone ? "#aaa" : "white", fontWeight: 800, fontSize: "11px", cursor: omikujiDone ? "not-allowed" : "pointer" }}>
            🎰 おみくじ{omikujiDone ? "（すみ）" : ""}
          </button>
        </div>

        {/* スタンプカテゴリー */}
        <div style={{ display: "flex", gap: "4px", marginBottom: "6px" }}>
          {Object.keys(STAMP_CATEGORIES).map((cat) => (
            <button key={cat} onClick={() => setStampCategory(cat)} style={{ padding: "3px 9px", borderRadius: "10px", border: "none", background: stampCategory === cat ? member.color : "#f0f0f0", color: stampCategory === cat ? "white" : "#555", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
              {cat}
            </button>
          ))}
        </div>

        {/* スタンプ */}
        <div style={{ display: "flex", gap: "4px", marginBottom: "10px", flexWrap: "wrap" }}>
          {STAMP_CATEGORIES[stampCategory].map((stamp) => (
            <button key={stamp} onClick={() => sendMessage(stamp)} style={{ background: "none", border: "2px solid #e5e7eb", borderRadius: "10px", fontSize: "18px", padding: "3px 6px", cursor: "pointer", lineHeight: 1 }}>
              {stamp}
            </button>
          ))}
        </div>

        {/* テキスト送信 */}
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
