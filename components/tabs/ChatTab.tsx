"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase-client";
import type { Member, ChatMessage } from "@/lib/types";

const STAMP_CATEGORIES: Record<string, string[]> = {
  "😊 きもち": ["😊", "😭", "😤", "🥳", "😴", "😍", "🤔", "😎", "🥺", "🤩"],
  "🐱 どうぶつ": ["🐱", "🐶", "🐼", "🦁", "🐸", "🐰", "🦊", "🐯", "🐮", "🐧"],
  "🍦 たべもの": ["🍕", "🍦", "🍩", "🎂", "🍣", "🍜", "🍎", "🍓", "🍫", "🧁"],
};

const PRAISE_MESSAGES = [
  "さすが！さいこう！🌟", "きみならできる！💪", "天才かも！✨",
  "すごすぎる！🔥", "がんばってるね！👏", "かっこいい！⭐",
  "やるじゃん！😎", "おうえんしてるよ！📣", "まけるな！💥",
  "どんどんのびてる！🌱", "むてきだ！⚡", "いつもえらいよ！💖",
];

const FORTUNE_MESSAGES = [
  { luck: "大吉", msg: "今日は算数がはかどる日✨ 全問正解するかも！" },
  { luck: "中吉", msg: "国語の読書をすると、よいことが起きそう📖" },
  { luck: "吉",   msg: "こつこつやれば、きっとうまくいく日🌸" },
  { luck: "小吉", msg: "理科の実験みたいに、じっくり考えてみよう🔬" },
  { luck: "大吉", msg: "英語をひとつ覚えると、すごいことが起きるかも🌍" },
  { luck: "中吉", msg: "社会のことを調べると、知識が光り輝く日📚" },
  { luck: "吉",   msg: "今日は休憩も大事！上手に遊ぼう🎮" },
  { luck: "大吉", msg: "自習をすると、ごほうびが近づいてくる日⭐" },
];

const LUCK_COLORS: Record<string, string> = {
  大吉: "#ff6b6b", 中吉: "#f7b731", 吉: "#43cea2", 小吉: "#a18cd1",
};

type Panel = null | "stamps" | "fun";

function getToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface Props { member: Member; }

export default function ChatTab({ member }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [stampCategory, setStampCategory] = useState(Object.keys(STAMP_CATEGORIES)[0]);
  const [omikujiDone, setOmikujiDone] = useState(false);
  const [openPanel, setOpenPanel] = useState<Panel>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    const res = await fetch("/api/chat");
    const data = await res.json();
    if (Array.isArray(data)) setMessages(data);
  };

  useEffect(() => {
    fetchMessages();
    if (localStorage.getItem(`omikuji_${getToday()}`)) setOmikujiDone(true);
    const channel = supabase
      .channel("study_chat_realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "study_chat" }, fetchMessages)
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
    await sendMessage(PRAISE_MESSAGES[Math.floor(Math.random() * PRAISE_MESSAGES.length)]);
    setOpenPanel(null);
  };

  const sendOmikuji = async () => {
    if (omikujiDone) return;
    const f = FORTUNE_MESSAGES[Math.floor(Math.random() * FORTUNE_MESSAGES.length)];
    await sendMessage(`🎰 おみくじ：【${f.luck}】\n${f.msg}`);
    localStorage.setItem(`omikuji_${getToday()}`, "1");
    setOmikujiDone(true);
    setOpenPanel(null);
  };

  const togglePanel = (panel: Panel) => setOpenPanel((p) => (p === panel ? null : panel));

  const fmt = (s: string) => { const d = new Date(s); return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`; };
  const fmtDay = (s: string) => { const d = new Date(s); return `${d.getMonth() + 1}/${d.getDate()}`; };

  let lastDay = "";

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>

      {/* ── メッセージ一覧 ── */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", WebkitOverflowScrolling: "touch", padding: "4px 0 8px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {messages.length === 0 && (
          <p style={{ color: "#ccc", textAlign: "center", fontSize: "13px", marginTop: "40px" }}>メッセージをおくってみよう！💬</p>
        )}
        {messages.map((msg) => {
          const isMe = msg.member_id === member.id;
          const day = fmtDay(msg.created_at);
          const showDay = day !== lastDay;
          lastDay = day;
          const m = msg.member;

          // おみくじカード
          if (msg.text.startsWith("🎰 おみくじ")) {
            const lines = msg.text.split("\n");
            const luck = lines[0].match(/【(.+?)】/)?.[1] ?? "吉";
            const luckColor = LUCK_COLORS[luck] ?? "#43cea2";
            return (
              <div key={msg.id}>
                {showDay && <div style={{ textAlign: "center", fontSize: "11px", color: "#aaa", margin: "10px 0 4px", fontWeight: 700 }}>{day}</div>}
                <div style={{ margin: "6px 4px", background: "white", borderRadius: "18px", padding: "14px", textAlign: "center", boxShadow: "0 3px 12px rgba(0,0,0,0.09)", border: `2px solid ${luckColor}` }}>
                  <div style={{ fontSize: "20px" }}>🎰</div>
                  <div style={{ fontWeight: 900, fontSize: "20px", color: luckColor }}>{luck}</div>
                  <div style={{ fontSize: "12px", color: "#555", marginTop: "4px", lineHeight: 1.6 }}>{lines[1]}</div>
                  <div style={{ fontSize: "12px", color: "#555", fontWeight: 700, marginTop: "6px" }}>{m?.display_name} · {fmt(msg.created_at)}</div>
                </div>
              </div>
            );
          }

          // 通常メッセージ
          return (
            <div key={msg.id}>
              {showDay && <div style={{ textAlign: "center", fontSize: "11px", color: "#aaa", margin: "10px 0 4px", fontWeight: 700 }}>{day}</div>}
              <div style={{ display: "flex", flexDirection: isMe ? "row-reverse" : "row", alignItems: "flex-start", gap: "6px", marginBottom: "4px" }}>
                {!isMe && (
                  <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: m ? `${m.color}22` : "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", border: m ? `2px solid ${m.color}` : "2px solid #ddd", flexShrink: 0, marginTop: "2px" }}>
                    {m?.emoji ?? "👤"}
                  </div>
                )}
                <div style={{ maxWidth: "72%", display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start", gap: "2px" }}>
                  {!isMe && <div style={{ fontSize: "12px", color: "#555", fontWeight: 700 }}>{m?.display_name}</div>}
                  <div style={{ background: isMe ? `linear-gradient(135deg, ${member.color}, #185a9d)` : "white", color: isMe ? "white" : "#333", padding: "8px 12px", borderRadius: isMe ? "18px 4px 18px 18px" : "4px 18px 18px 18px", fontSize: "13px", boxShadow: "0 2px 6px rgba(0,0,0,0.07)", wordBreak: "break-word", whiteSpace: "pre-line" }}>
                    {msg.text}
                  </div>
                  <div style={{ fontSize: "10px", color: "#bbb" }}>{fmt(msg.created_at)}</div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
        </div>
      </div>

      {/* ── スタンプパネル（＋で開閉） ── */}
      {openPanel === "stamps" && (
        <div style={{ background: "white", borderTop: "1px solid #f0f0f0", padding: "10px 12px", flexShrink: 0 }}>
          <div style={{ display: "flex", gap: "4px", marginBottom: "8px" }}>
            {Object.keys(STAMP_CATEGORIES).map((cat) => (
              <button key={cat} onClick={() => setStampCategory(cat)} style={{ padding: "3px 9px", borderRadius: "10px", border: "none", background: stampCategory === cat ? member.color : "#f0f0f0", color: stampCategory === cat ? "white" : "#555", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                {cat}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {STAMP_CATEGORIES[stampCategory].map((stamp) => (
              <button key={stamp} onClick={() => { sendMessage(stamp); setOpenPanel(null); }} style={{ background: "none", border: "2px solid #e5e7eb", borderRadius: "10px", fontSize: "22px", padding: "4px 7px", cursor: "pointer", lineHeight: 1 }}>
                {stamp}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── たのしいパネル（😊で開閉） ── */}
      {openPanel === "fun" && (
        <div style={{ background: "white", borderTop: "1px solid #f0f0f0", padding: "12px 16px", display: "flex", gap: "10px", justifyContent: "center", flexShrink: 0 }}>
          <button onClick={sendPraise} style={{ padding: "10px 18px", borderRadius: "16px", border: "none", background: "linear-gradient(135deg, #a18cd1, #fbc2eb)", color: "white", fontWeight: 800, fontSize: "13px", cursor: "pointer" }}>
            💬 はげます
          </button>
          <button onClick={sendOmikuji} disabled={omikujiDone} style={{ padding: "10px 18px", borderRadius: "16px", border: "none", background: omikujiDone ? "#e5e7eb" : "linear-gradient(135deg, #43cea2, #185a9d)", color: omikujiDone ? "#aaa" : "white", fontWeight: 800, fontSize: "13px", cursor: omikujiDone ? "not-allowed" : "pointer" }}>
            🎰 おみくじ{omikujiDone ? "（すみ）" : ""}
          </button>
        </div>
      )}

      {/* ── 入力バー（常に1行） ── */}
      <div style={{ background: "white", borderTop: "1px solid #f0f0f0", padding: "8px 10px", display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
        {/* ＋ボタン */}
        <button
          onClick={() => togglePanel("stamps")}
          style={{ width: "36px", height: "36px", borderRadius: "50%", border: "none", background: openPanel === "stamps" ? member.color : "#f0f0f0", color: openPanel === "stamps" ? "white" : "#555", fontSize: "20px", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}
        >
          {openPanel === "stamps" ? "×" : "+"}
        </button>

        {/* 入力欄 */}
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setOpenPanel(null)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(text)}
          placeholder="メッセージを入力..."
          style={{ flex: 1, minWidth: 0, padding: "9px 13px", borderRadius: "20px", border: "2px solid #e5e7eb", fontSize: "13px", outline: "none", background: "#fafafa", boxSizing: "border-box" }}
        />

        {/* 😊ボタン */}
        <button
          onClick={() => togglePanel("fun")}
          style={{ width: "36px", height: "36px", borderRadius: "50%", border: "none", background: openPanel === "fun" ? member.color : "#f0f0f0", fontSize: "18px", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          {openPanel === "fun" ? "×" : "😊"}
        </button>

        {/* 送信ボタン */}
        <button
          onClick={() => sendMessage(text)}
          disabled={!text.trim() || sending}
          style={{ width: "36px", height: "36px", borderRadius: "50%", border: "none", background: text.trim() ? `linear-gradient(135deg, ${member.color}, #185a9d)` : "#e5e7eb", color: text.trim() ? "white" : "#aaa", fontWeight: 900, cursor: text.trim() ? "pointer" : "not-allowed", flexShrink: 0, fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          ➤
        </button>
      </div>
    </div>
  );
}
