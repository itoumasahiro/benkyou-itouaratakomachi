"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Member, Subject, StudyLog, Score, Todo } from "@/lib/types";
import ChatTab from "@/components/tabs/ChatTab";

interface RewardRequest {
  id: number;
  member_id: string;
  status: string;
  message: string | null;
  parent_note: string | null;
  created_at: string;
  member: Member;
  reward: { id: number; name: string; emoji: string; cost: number };
}

const EMOJI_OPTIONS = ["🦁", "🌸", "🐬", "🦊", "🐼", "🦋", "🌟", "🎯", "🚀", "🎨"];
const COLOR_OPTIONS = ["#4ECDC4", "#FF6B6B", "#45B7D1", "#96CEB4", "#F7B731", "#f093fb", "#43cea2", "#185a9d", "#ff6b6b", "#a8edea"];

interface MemberData {
  member: Member;
  subjects: Subject[];
  logs: StudyLog[];
  scores: Score[];
  todos: Todo[];
}

function getToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function ParentPage() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [childData, setChildData] = useState<MemberData[]>([]);
  const [currentParent, setCurrentParent] = useState<Member | null>(null);
  const [tab, setTab] = useState<"dashboard" | "chat" | "members" | "requests">("dashboard");
  const [childBalances, setChildBalances] = useState<Record<string, number>>({});
  const [pendingRequests, setPendingRequests] = useState<RewardRequest[]>([]);
  const [pointForm, setPointForm] = useState<{ memberId: string; amount: string; reason: string } | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ display_name: "", emoji: "🦁", color: "#4ECDC4", role: "child", grade: "", school_level: "elementary" });
  const today = getToday();

  useEffect(() => {
    const savedId = localStorage.getItem("studyMemberId");
    fetch("/api/members")
      .then((r) => r.json())
      .then(async (data: Member[]) => {
        setMembers(Array.isArray(data) ? data : []);
        const parent = data.find((m) => m.id === savedId && m.role === "parent");
        setCurrentParent(parent ?? data.find((m) => m.role === "parent") ?? null);

        const children = data.filter((m) => m.role === "child");
        const results = await Promise.all(
          children.map(async (m) => {
            const [subRes, logRes, scoreRes, todoRes] = await Promise.all([
              fetch(`/api/subjects?memberId=${m.id}`),
              fetch(`/api/study-logs?memberId=${m.id}`),
              fetch(`/api/scores?memberId=${m.id}`),
              fetch(`/api/todos?memberId=${m.id}`),
            ]);
            const [subjects, logs, scores, todos] = await Promise.all([subRes.json(), logRes.json(), scoreRes.json(), todoRes.json()]);
            return { member: m, subjects: Array.isArray(subjects) ? subjects : [], logs: Array.isArray(logs) ? logs : [], scores: Array.isArray(scores) ? scores : [], todos: Array.isArray(todos) ? todos : [] };
          })
        );
        setChildData(results);

        // ポイント残高・リクエスト取得
        const balances: Record<string, number> = {};
        for (const m of data.filter((x: Member) => x.role === "child")) {
          const pRes = await fetch(`/api/points?memberId=${m.id}`);
          const pData = await pRes.json();
          balances[m.id] = pData.balance ?? 0;
        }
        setChildBalances(balances);

        const reqRes = await fetch("/api/reward-requests?status=pending");
        const reqData = await reqRes.json();
        if (Array.isArray(reqData)) setPendingRequests(reqData);
      });
  }, []);

  const handleAddMember = async () => {
    if (!addForm.display_name.trim()) return;
    const res = await fetch("/api/members", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(addForm) });
    const newMember = await res.json();
    if (newMember.id) {
      setMembers((prev) => [...prev, newMember]);
      setAddForm({ display_name: "", emoji: "🦁", color: "#4ECDC4", role: "child", grade: "", school_level: "elementary" });
      setShowAddForm(false);
      // 子供の場合はデフォルト教科を追加
      if (addForm.role === "child") {
        const defaultSubjects = [
          { name: "国語", emoji: "📖", color: "#FF6B6B" },
          { name: addForm.school_level === "junior_high" ? "数学" : "算数", emoji: "🔢", color: "#4ECDC4" },
          { name: "理科", emoji: "🔬", color: "#45B7D1" },
          { name: "社会", emoji: "🌍", color: "#96CEB4" },
          { name: "英語", emoji: "🗣️", color: "#F7B731" },
        ];
        for (const s of defaultSubjects) {
          await fetch("/api/subjects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ member_id: newMember.id, ...s }) });
        }
      }
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!confirm("本当に削除しますか？")) return;
    await fetch(`/api/members?id=${id}`, { method: "DELETE" });
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const handleGivePoints = async () => {
    if (!pointForm || !currentParent || !pointForm.amount || !pointForm.reason) return;
    await fetch("/api/points", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to_member_id: pointForm.memberId, from_member_id: currentParent.id, amount: Number(pointForm.amount), reason: pointForm.reason, type: "earned" }),
    });
    // チャット通知
    const child = members.find((m) => m.id === pointForm.memberId);
    await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ member_id: currentParent.id, text: `⭐ ${child?.display_name}に${pointForm.amount}ポイントあげたよ！「${pointForm.reason}」` }),
    });
    // 残高更新
    setChildBalances((prev) => ({ ...prev, [pointForm.memberId]: (prev[pointForm.memberId] ?? 0) + Number(pointForm.amount) }));
    setPointForm(null);
  };

  const handleRequestAction = async (requestId: number, status: "approved" | "rejected", note: string) => {
    if (!currentParent) return;
    await fetch("/api/reward-requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: requestId, status, parent_note: note, approved_by: currentParent.id }),
    });
    setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
    // 残高再取得
    const req = pendingRequests.find((r) => r.id === requestId);
    if (req && status === "approved") {
      setChildBalances((prev) => ({ ...prev, [req.member_id]: (prev[req.member_id] ?? 0) - req.reward.cost }));
    }
  };

  const getTodayMins = (data: MemberData) => data.logs.filter((l) => l.date === today).reduce((s, l) => s + l.minutes, 0);
  const getTodayDone = (data: MemberData) => data.todos.filter((t) => t.date === today && t.done).length;
  const getTodayTotal = (data: MemberData) => data.todos.filter((t) => t.date === today).length;

  const PARENT_TABS = [
    { key: "dashboard", icon: "📊", label: "みんな" },
    { key: "requests", icon: "🎁", label: `たのみ${pendingRequests.length > 0 ? `(${pendingRequests.length})` : ""}` },
    { key: "chat", icon: "💬", label: "チャット" },
    { key: "members", icon: "👥", label: "メンバー" },
  ];

  const isChatTab = tab === "chat";

  return (
    <div style={{ fontFamily: "'Noto Sans JP', sans-serif", background: "linear-gradient(160deg,#a8edea 0%,#fed6e3 100%)", padding: "14px", boxSizing: "border-box", ...(isChatTab ? { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden", display: "flex", flexDirection: "column" } : { minHeight: "100vh" }) }}>
      {/* ヘッダー */}
      <div style={{ background: "white", borderRadius: "22px", padding: "12px 16px", marginBottom: "12px", boxShadow: "0 6px 24px rgba(0,0,0,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center", ...(isChatTab ? { flexShrink: 0 } : {}) }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ fontSize: "28px" }}>{currentParent?.emoji ?? "👨"}</div>
          <div>
            <h1 style={{ margin: 0, fontSize: "16px", fontWeight: 900, color: "#333" }}>{currentParent?.display_name ?? "かんり"}のページ</h1>
            <p style={{ margin: "1px 0 0", fontSize: "10px", color: "#aaa" }}>管理者ダッシュボード</p>
          </div>
        </div>
        <button onClick={() => router.push("/")} style={{ background: "#f9fafb", border: "2px solid #e5e7eb", borderRadius: "12px", padding: "6px 10px", cursor: "pointer", fontSize: "11px", fontWeight: 700, color: "#555" }}>
          🔄 かえる
        </button>
      </div>

      {/* タブ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "6px", marginBottom: "12px", ...(isChatTab ? { flexShrink: 0 } : {}) }}>
        {PARENT_TABS.map(({ key, icon, label }) => (
          <button key={key} onClick={() => setTab(key as typeof tab)} style={{ padding: "10px 4px", borderRadius: "14px", border: "none", fontWeight: 800, fontSize: "12px", cursor: "pointer", background: tab === key ? "white" : "rgba(255,255,255,0.45)", color: tab === key ? "#185a9d" : "#555", boxShadow: tab === key ? "0 4px 14px rgba(0,0,0,0.13)" : "none", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
            <span style={{ fontSize: "18px" }}>{icon}</span>{label}
          </button>
        ))}
      </div>

      {/* ダッシュボード */}
      {tab === "dashboard" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <h3 style={{ margin: 0, fontSize: "13px", fontWeight: 800, color: "#333" }}>📅 今日のきろく</h3>
          {childData.map((d) => (
            <div key={d.member.id} style={{ background: "white", borderRadius: "18px", padding: "16px", boxShadow: "0 4px 14px rgba(0,0,0,0.08)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: `${d.member.color}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", border: `2px solid ${d.member.color}` }}>
                  {d.member.emoji}
                </div>
                <div>
                  <div style={{ fontWeight: 900, fontSize: "16px" }}>{d.member.display_name}</div>
                  <div style={{ fontSize: "11px", color: "#aaa" }}>{d.member.grade}</div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <div style={{ background: "#f0fff8", borderRadius: "12px", padding: "12px", textAlign: "center" }}>
                  <div style={{ fontSize: "22px", fontWeight: 900, color: "#43cea2" }}>{getTodayMins(d)}分</div>
                  <div style={{ fontSize: "10px", color: "#aaa" }}>今日の勉強</div>
                </div>
                <div style={{ background: "#f5f5ff", borderRadius: "12px", padding: "12px", textAlign: "center" }}>
                  <div style={{ fontSize: "22px", fontWeight: 900, color: "#185a9d" }}>{getTodayDone(d)}/{getTodayTotal(d)}</div>
                  <div style={{ fontSize: "10px", color: "#aaa" }}>タスク完了</div>
                </div>
              </div>
              {/* ポイント残高 + 付与ボタン */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px", padding: "10px 12px", background: "linear-gradient(135deg, #fffbf0, #fff3cd)", borderRadius: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "18px" }}>⭐</span>
                  <span style={{ fontWeight: 900, fontSize: "18px", color: "#F7B731" }}>{childBalances[d.member.id] ?? 0}</span>
                  <span style={{ fontSize: "11px", color: "#aaa" }}>ポイント</span>
                </div>
                <button
                  onClick={() => setPointForm({ memberId: d.member.id, amount: "", reason: "" })}
                  style={{ padding: "7px 14px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #F7B731, #ff9800)", color: "white", fontWeight: 800, fontSize: "12px", cursor: "pointer" }}
                >
                  ⭐ ポイントをあげる
                </button>
              </div>

              {/* ポイント付与フォーム */}
              {pointForm?.memberId === d.member.id && (
                <div style={{ marginTop: "10px", padding: "12px", background: "#fffbf0", borderRadius: "12px", border: "2px solid #F7B731" }}>
                  <div style={{ marginBottom: "8px" }}>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#666" }}>ポイント数</label>
                    <div style={{ display: "flex", gap: "6px", marginTop: "4px", flexWrap: "wrap" }}>
                      {[10, 20, 30, 50, 100].map((v) => (
                        <button key={v} onClick={() => setPointForm({ ...pointForm, amount: String(v) })} style={{ padding: "5px 12px", borderRadius: "20px", border: `2px solid ${pointForm.amount === String(v) ? "#F7B731" : "#e5e7eb"}`, background: pointForm.amount === String(v) ? "#F7B731" : "white", color: pointForm.amount === String(v) ? "white" : "#555", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                          {v}
                        </button>
                      ))}
                      <input type="number" value={pointForm.amount} onChange={(e) => setPointForm({ ...pointForm, amount: e.target.value })} placeholder="その他" style={{ width: "60px", padding: "4px 8px", borderRadius: "10px", border: "2px solid #e5e7eb", fontSize: "12px", outline: "none" }} />
                    </div>
                  </div>
                  <div style={{ marginBottom: "10px" }}>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#666" }}>理由</label>
                    <div style={{ display: "flex", gap: "6px", marginTop: "4px", flexWrap: "wrap" }}>
                      {["算数がんばった！", "テスト合格！", "宿題おわった！", "自分から勉強した！", "毎日つづけた！"].map((r) => (
                        <button key={r} onClick={() => setPointForm({ ...pointForm, reason: r })} style={{ padding: "4px 10px", borderRadius: "20px", border: `2px solid ${pointForm.reason === r ? "#43cea2" : "#e5e7eb"}`, background: pointForm.reason === r ? "#43cea2" : "white", color: pointForm.reason === r ? "white" : "#555", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                          {r}
                        </button>
                      ))}
                    </div>
                    <input value={pointForm.reason} onChange={(e) => setPointForm({ ...pointForm, reason: e.target.value })} placeholder="理由を入力..." style={{ display: "block", width: "100%", marginTop: "6px", padding: "8px 12px", borderRadius: "10px", border: "2px solid #e5e7eb", fontSize: "12px", boxSizing: "border-box", outline: "none" }} />
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => setPointForm(null)} style={{ flex: 1, padding: "9px", borderRadius: "10px", border: "2px solid #e5e7eb", background: "white", color: "#888", fontWeight: 700, cursor: "pointer", fontSize: "12px" }}>キャンセル</button>
                    <button onClick={handleGivePoints} style={{ flex: 2, padding: "9px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #F7B731, #ff9800)", color: "white", fontWeight: 800, cursor: "pointer", fontSize: "12px" }}>⭐ あげる！</button>
                  </div>
                </div>
              )}

              {/* 教科別今日の勉強 */}
              {d.logs.filter((l) => l.date === today).length > 0 && (
                <div style={{ marginTop: "10px" }}>
                  {d.logs.filter((l) => l.date === today).map((log) => (
                    <div key={log.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "4px 0", borderBottom: "1px solid #f0f0f0" }}>
                      <span>{log.subject?.emoji} {log.subject?.name}</span>
                      <span style={{ fontWeight: 700, color: "#185a9d" }}>{log.minutes}分</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ごほうびリクエスト */}
      {tab === "requests" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {pendingRequests.length === 0 ? (
            <div style={{ background: "white", borderRadius: "18px", padding: "40px 16px", textAlign: "center", boxShadow: "0 4px 14px rgba(0,0,0,0.08)" }}>
              <div style={{ fontSize: "40px", marginBottom: "10px" }}>🎁</div>
              <p style={{ color: "#aaa", fontSize: "13px" }}>いまはたのみがないよ</p>
            </div>
          ) : (
            pendingRequests.map((req) => (
              <RequestCard key={req.id} req={req} onAction={handleRequestAction} />
            ))
          )}
        </div>
      )}

      {/* チャット */}
      {tab === "chat" && currentParent && (
        <div style={{ flex: 1, minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <ChatTab member={currentParent} />
        </div>
      )}

      {/* メンバー管理 */}
      {tab === "members" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <button onClick={() => setShowAddForm(!showAddForm)} style={{ padding: "13px", borderRadius: "16px", border: "none", background: "white", color: "#185a9d", fontWeight: 900, fontSize: "14px", cursor: "pointer", boxShadow: "0 4px 14px rgba(0,0,0,0.08)" }}>
            {showAddForm ? "✕ とじる" : "➕ メンバーを追加"}
          </button>
          {showAddForm && (
            <div style={{ background: "white", borderRadius: "18px", padding: "16px", boxShadow: "0 4px 14px rgba(0,0,0,0.08)" }}>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#666" }}>種類</label>
                <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                  {[["child", "子供"], ["parent", "家族"]].map(([v, l]) => (
                    <button key={v} onClick={() => setAddForm({ ...addForm, role: v })} style={{ flex: 1, padding: "8px", borderRadius: "10px", border: `2px solid ${addForm.role === v ? "#185a9d" : "#e5e7eb"}`, background: addForm.role === v ? "#185a9d" : "white", color: addForm.role === v ? "white" : "#555", fontWeight: 700, cursor: "pointer", fontSize: "13px" }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#666" }}>名前</label>
                <input value={addForm.display_name} onChange={(e) => setAddForm({ ...addForm, display_name: e.target.value })} placeholder="例：たろう" style={{ display: "block", width: "100%", marginTop: "4px", padding: "10px 14px", borderRadius: "12px", border: "2px solid #e5e7eb", fontSize: "13px", boxSizing: "border-box", outline: "none" }} />
              </div>
              {addForm.role === "child" && (
                <>
                  <div style={{ marginBottom: "12px" }}>
                    <label style={{ fontSize: "12px", fontWeight: 700, color: "#666" }}>学校段階</label>
                    <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                      {[["elementary", "小学生"], ["junior_high", "中学生"]].map(([v, l]) => (
                        <button key={v} onClick={() => setAddForm({ ...addForm, school_level: v })} style={{ flex: 1, padding: "8px", borderRadius: "10px", border: `2px solid ${addForm.school_level === v ? "#43cea2" : "#e5e7eb"}`, background: addForm.school_level === v ? "#43cea2" : "white", color: addForm.school_level === v ? "white" : "#555", fontWeight: 700, cursor: "pointer", fontSize: "13px" }}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ marginBottom: "12px" }}>
                    <label style={{ fontSize: "12px", fontWeight: 700, color: "#666" }}>学年</label>
                    <input value={addForm.grade} onChange={(e) => setAddForm({ ...addForm, grade: e.target.value })} placeholder={addForm.school_level === "junior_high" ? "例：中1" : "例：5年生"} style={{ display: "block", width: "100%", marginTop: "4px", padding: "10px 14px", borderRadius: "12px", border: "2px solid #e5e7eb", fontSize: "13px", boxSizing: "border-box", outline: "none" }} />
                  </div>
                </>
              )}
              <div style={{ marginBottom: "12px" }}>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#666" }}>絵文字</label>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "6px" }}>
                  {EMOJI_OPTIONS.map((e) => (
                    <button key={e} onClick={() => setAddForm({ ...addForm, emoji: e })} style={{ width: "36px", height: "36px", borderRadius: "10px", border: `2px solid ${addForm.emoji === e ? "#185a9d" : "#e5e7eb"}`, background: addForm.emoji === e ? "#e8f0fe" : "white", fontSize: "18px", cursor: "pointer" }}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#666" }}>カラー</label>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "6px" }}>
                  {COLOR_OPTIONS.map((c) => (
                    <button key={c} onClick={() => setAddForm({ ...addForm, color: c })} style={{ width: "28px", height: "28px", borderRadius: "50%", background: c, border: addForm.color === c ? "3px solid #333" : "3px solid transparent", cursor: "pointer" }} />
                  ))}
                </div>
              </div>
              <button onClick={handleAddMember} style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg, #43cea2, #185a9d)", color: "white", fontWeight: 800, fontSize: "14px", cursor: "pointer" }}>追加する ✨</button>
            </div>
          )}

          {/* メンバー一覧 */}
          <div style={{ background: "white", borderRadius: "18px", padding: "16px", boxShadow: "0 4px 14px rgba(0,0,0,0.08)" }}>
            <h3 style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 800, color: "#333" }}>👥 現在のメンバー</h3>
            {members.map((m) => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", marginBottom: "8px", borderRadius: "12px", background: "#f9fafb" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: `${m.color}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", border: `2px solid ${m.color}` }}>
                  {m.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "13px", fontWeight: 700 }}>{m.display_name}</div>
                  <div style={{ fontSize: "11px", color: "#aaa" }}>{m.grade ?? (m.role === "parent" ? "家族" : "")} · {m.role === "child" ? (m.school_level === "junior_high" ? "中学生" : "小学生") : "管理者"}</div>
                </div>
                {!["arata", "komachi", "papa", "mama", "ojii", "obaa"].includes(m.id) && (
                  <button onClick={() => handleDeleteMember(m.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ddd", fontSize: "18px" }}>×</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RequestCard({ req, onAction }: { req: RewardRequest; onAction: (id: number, status: "approved" | "rejected", note: string) => void }) {
  const [note, setNote] = useState("");
  const [decided, setDecided] = useState(false);

  const handle = async (status: "approved" | "rejected") => {
    setDecided(true);
    onAction(req.id, status, note);
  };

  if (decided) return null;

  return (
    <div style={{ background: "white", borderRadius: "18px", padding: "16px", boxShadow: "0 4px 14px rgba(0,0,0,0.08)", border: "2px solid #F7B73130" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
        <div style={{ fontSize: "36px" }}>{req.reward.emoji}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "15px", fontWeight: 900 }}>{req.reward.name}</div>
          <div style={{ fontSize: "12px", color: "#888" }}>
            {req.member.emoji} {req.member.display_name} · ⭐ {req.reward.cost}ポイント
          </div>
        </div>
      </div>
      {req.message && (
        <div style={{ background: "#f9fafb", borderRadius: "10px", padding: "10px 12px", fontSize: "13px", color: "#555", marginBottom: "12px", fontStyle: "italic" }}>
          「{req.message}」
        </div>
      )}
      <div style={{ marginBottom: "12px" }}>
        <label style={{ fontSize: "11px", fontWeight: 700, color: "#666" }}>ひとこと（なくてもOK）</label>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="例：えらい！今週もがんばったね" style={{ display: "block", width: "100%", marginTop: "4px", padding: "9px 12px", borderRadius: "10px", border: "2px solid #e5e7eb", fontSize: "12px", boxSizing: "border-box", outline: "none" }} />
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <button onClick={() => handle("rejected")} style={{ flex: 1, padding: "11px", borderRadius: "12px", border: "2px solid #e5e7eb", background: "white", color: "#888", fontWeight: 700, cursor: "pointer", fontSize: "13px" }}>
          ❌ またこんど
        </button>
        <button onClick={() => handle("approved")} style={{ flex: 2, padding: "11px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg, #43cea2, #185a9d)", color: "white", fontWeight: 900, cursor: "pointer", fontSize: "13px" }}>
          ✅ OK！あげる！
        </button>
      </div>
    </div>
  );
}
