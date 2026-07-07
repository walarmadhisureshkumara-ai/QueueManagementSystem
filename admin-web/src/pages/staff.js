import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

// ─────────────────────────────────────────────────────────────────────────────
// BOC BANK · Queue Management System · Staff Dashboard
// Each staff member is bound to ONE counter. They see ONLY their queue,
// generate tokens ONLY for their service, and manage ONLY their customers.
// ─────────────────────────────────────────────────────────────────────────────

const C = {
  navyDeep:  "#0A1628",
  navyMid:   "#12285C",
  navyLight: "#1A3A7C",
  amber:     "#F5A623",
  amberSoft: "#FFF3D6",
  teal:      "#00B8A9",
  tealSoft:  "#E0FAF8",
  red:       "#E8395A",
  redSoft:   "#FDEAEE",
  green:     "#1DB97A",
  greenSoft: "#E3FAF1",
  slate:     "#F2F4F8",
  gray:      "#6B7A99",
  white:     "#FFFFFF",
};

// ── BOC Counter Definitions ───────────────────────────────────────────────────
const COUNTERS = {
  CD: { code: "CD", label: "Cash Deposit",           icon: "💵", color: "#1A8FE3", service: "Cash Deposit" },
  CW: { code: "CW", label: "Cash Withdrawal",         icon: "💴", color: "#7B5EA7", service: "Cash Withdrawal" },
  CS: { code: "CS", label: "Customer Service",        icon: "🎧", color: "#00B8A9", service: "Customer Service / Help Desk" },
  AO: { code: "AO", label: "Account Opening",         icon: "📋", color: "#1DB97A", service: "Account Opening" },
  LS: { code: "LS", label: "Loan Services",           icon: "🏦", color: "#F5A623", service: "Loan Services" },
  CHQ: { code: "CHQ", label: "Cheque Services",       icon: "🗒️", color: "#E8395A", service: "Cheque Services (Deposit & Clearing)" },
  CARD: { code: "CARD", label: "Card Services",       icon: "💳", color: "#0A1628", service: "Card Services (ATM/Debit/Credit)" },
};

// ── Staff roster — each staff has a unique PIN tied to their counter ─────────
// In production, PINs are hashed server-side. These are demo values only.
const STAFF_ROSTER = [
  { id: "S01", name: "K. Jayawardena",  counter: "CD",   role: "Teller",          pin: "2241" },
  { id: "S02", name: "P. Rathnayake",   counter: "CW",   role: "Teller",          pin: "3857" },
  { id: "S03", name: "A. Gunaratne",    counter: "CS",   role: "Customer Rep",    pin: "1193" },
  { id: "S04", name: "N. Perera",       counter: "AO",   role: "Account Officer", pin: "4762" },
  { id: "S05", name: "S. Fernando",     counter: "LS",   role: "Loans Officer",   pin: "9034" },
  { id: "S06", name: "R. Silva",        counter: "CHQ",  role: "Teller",          pin: "5581" },
  { id: "S07", name: "L. Dissanayake",  counter: "CARD", role: "Card Officer",    pin: "6620" },
];

// (Seed data removed — tokens now loaded from backend API)

const STATUS_META = {
  waiting:   { label:"Waiting",   color:C.amber, bg:C.amberSoft },
  serving:   { label:"Serving",   color:C.teal,  bg:C.tealSoft  },
  completed: { label:"Completed", color:C.green, bg:C.greenSoft },
  skipped:   { label:"Skipped",   color:C.red,   bg:C.redSoft   },
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN APP — wraps login + dashboard
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [loggedIn, setLoggedIn] = useState(null); // staff object or null

  if (!loggedIn) return <LoginScreen onLogin={setLoggedIn} />;
  return <StaffDashboard staff={loggedIn} onLogout={() => setLoggedIn(null)} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
const MAX_ATTEMPTS = 3;
const LOCKOUT_SECS = 30;

function LoginScreen({ onLogin }) {
  const [step, setStep]         = useState("select"); // "select" | "pin"
  const [sel, setSel]           = useState("");
  const [pin, setPin]           = useState("");
  const [err, setErr]           = useState("");
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked]     = useState(false);
  const [countdown, setCountdown] = useState(0);

  const selectedStaff = STAFF_ROSTER.find(s => s.id === sel);
  const counter       = selectedStaff ? COUNTERS[selectedStaff.counter] : null;

  // Lockout countdown
  useEffect(() => {
    if (!locked) return;
    setCountdown(LOCKOUT_SECS);
    const iv = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(iv); setLocked(false); setAttempts(0); setPin(""); setErr(""); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [locked]);

  const handleSelectContinue = () => {
    if (!sel) { setErr("Please select your name."); return; }
    setErr(""); setPin(""); setStep("pin");
  };

  const handlePinKey = (digit) => {
    if (locked || pin.length >= 4) return;
    setPin(p => p + digit);
    setErr("");
  };

  const handlePinDelete = () => { if (!locked) setPin(p => p.slice(0, -1)); setErr(""); };

  const handleLogin = () => {
    if (locked) return;
    if (pin.length < 4) { setErr("Enter your 4-digit PIN."); return; }
    if (pin !== selectedStaff.pin) {
      const next = attempts + 1;
      setAttempts(next);
      setPin("");
      if (next >= MAX_ATTEMPTS) {
        setLocked(true);
        setErr(`Too many incorrect attempts. Locked for ${LOCKOUT_SECS}s.`);
      } else {
        setErr(`Incorrect PIN. ${MAX_ATTEMPTS - next} attempt${MAX_ATTEMPTS - next === 1 ? "" : "s"} remaining.`);
      }
      return;
    }
    onLogin(selectedStaff);
  };

 useEffect(() => {
  const handleLogin = () => {
    // login logic here
  };

  handleLogin();
}, [locked, step]); // Now you only need 'locked' and 'step'

  return (
    <div style={{
      minHeight:"100vh",
      background:`linear-gradient(135deg, ${C.navyDeep} 0%, ${C.navyLight} 100%)`,
      display:"flex", alignItems:"center", justifyContent:"center",
    }}>
      <div style={{
        background:C.white, borderRadius:22, padding:"40px 36px", width:380,
        boxShadow:"0 28px 70px rgba(0,0,0,.4)",
      }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:30 }}>
          <div style={{
            width:46, height:46, borderRadius:10, background:C.navyDeep,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontWeight:900, fontSize:14, color:C.amber, letterSpacing:1,
          }}>BOC</div>
          <div>
            <div style={{ fontWeight:800, fontSize:16, color:C.navyDeep }}>Staff Sign In</div>
            <div style={{ fontSize:11, color:C.gray }}>Queue Management System · Bank of Ceylon</div>
          </div>
        </div>

        {/* ── STEP 1: Select staff ── */}
        {step === "select" && (
          <>
            <label style={labelStyle}>Select Your Name</label>
            <select value={sel} onChange={e=>{ setSel(e.target.value); setErr(""); }} style={{ ...inputStyle, marginBottom:12 }}>
              <option value="">— Choose your name —</option>
              {STAFF_ROSTER.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} · {COUNTERS[s.counter].icon} {COUNTERS[s.counter].label}
                </option>
              ))}
            </select>

            {sel && counter && (
              <div style={{
                padding:"12px 14px", borderRadius:10, marginBottom:16,
                background:counter.color+"15", border:`1.5px solid ${counter.color}44`,
                display:"flex", alignItems:"center", gap:10,
              }}>
                <span style={{ fontSize:22 }}>{counter.icon}</span>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:counter.color }}>{counter.label} Counter</div>
                  <div style={{ fontSize:11, color:C.gray }}>{selectedStaff.role} · ID {selectedStaff.id}</div>
                </div>
              </div>
            )}

            {err && <div style={{ color:C.red, fontSize:12, marginBottom:10 }}>⚠ {err}</div>}

            <button onClick={handleSelectContinue} style={{
              width:"100%", padding:13, borderRadius:10, border:"none",
              background:sel?C.navyDeep:C.slate, color:sel?C.white:C.gray,
              fontWeight:700, fontSize:14, cursor:sel?"pointer":"default", transition:"all .2s",
            }}>Continue →</button>
          </>
        )}

        {/* ── STEP 2: PIN entry ── */}
        {step === "pin" && (
          <>
            {/* Back + counter info */}
            <button onClick={()=>{ setStep("select"); setPin(""); setErr(""); setAttempts(0); setLocked(false); }}
              style={{ border:"none", background:"none", color:C.gray, fontSize:12, cursor:"pointer", marginBottom:16, padding:0 }}>
              ← Back
            </button>

            {counter && (
              <div style={{
                padding:"10px 14px", borderRadius:10, marginBottom:20,
                background:counter.color+"15", border:`1.5px solid ${counter.color}44`,
                display:"flex", alignItems:"center", gap:10,
              }}>
                <span style={{ fontSize:20 }}>{counter.icon}</span>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:counter.color }}>{counter.label} Counter</div>
                  <div style={{ fontSize:11, color:C.gray }}>{selectedStaff.name} · {selectedStaff.role}</div>
                </div>
              </div>
            )}

            <div style={{ textAlign:"center", marginBottom:20 }}>
              <div style={{ fontSize:13, fontWeight:600, color:C.gray, marginBottom:14 }}>Enter your 4-digit PIN</div>
              {/* PIN dots */}
              <div style={{ display:"flex", justifyContent:"center", gap:14, marginBottom:6 }}>
                {[0,1,2,3].map(i => (
                  <div key={i} style={{
                    width:18, height:18, borderRadius:"50%", transition:"all .15s",
                    background: i < pin.length
                      ? (locked ? C.red : counter?.color || C.navyMid)
                      : C.slate,
                    border:`2px solid ${i < pin.length ? (locked?C.red:counter?.color||C.navyMid) : "#DDE3F0"}`,
                  }}/>
                ))}
              </div>
              {attempts > 0 && !locked && (
                <div style={{ fontSize:10, color:C.amber, fontWeight:600 }}>
                  {MAX_ATTEMPTS - attempts} attempt{MAX_ATTEMPTS - attempts === 1?"":"s"} remaining
                </div>
              )}
            </div>

            {/* Numpad */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:14 }}>
              {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((k,i) => {
                const isEmpty = k === "";
                const isDel   = k === "⌫";
                return (
                  <button key={i} disabled={locked||isEmpty}
                    onClick={()=> isDel ? handlePinDelete() : handlePinKey(String(k))}
                    style={{
                      height:54, borderRadius:10, border:"none", fontSize:isDel?18:20,
                      fontWeight:700, cursor:isEmpty||locked?"default":"pointer",
                      background: isEmpty ? "transparent" : locked ? C.slate : isDel ? C.redSoft : C.slate,
                      color: isDel ? C.red : locked ? C.gray : C.navyDeep,
                      transition:"all .1s", opacity:locked?0.5:1,
                    }}>{k}</button>
                );
              })}
            </div>

            {err && (
              <div style={{
                color: locked ? C.red : C.red, fontSize:12, textAlign:"center",
                marginBottom:12, fontWeight:600,
              }}>⚠ {err}{locked ? ` Retry in ${countdown}s.` : ""}</div>
            )}

            <button onClick={handleLogin} disabled={locked||pin.length<4} style={{
              width:"100%", padding:13, borderRadius:10, border:"none",
              background: locked||pin.length<4 ? C.slate : C.navyDeep,
              color: locked||pin.length<4 ? C.gray : C.white,
              fontWeight:700, fontSize:14,
              cursor: locked||pin.length<4 ? "default" : "pointer", transition:"all .2s",
            }}>{locked ? `Locked (${countdown}s)` : "Sign In"}</button>

            {/* Demo hint */}
            <div style={{
              marginTop:16, padding:"10px 14px", borderRadius:8, background:C.amberSoft,
              fontSize:11, color:"#8B6B1A", textAlign:"center",
            }}>
              Demo PINs — CD: <b>2241</b> · CW: <b>3857</b> · CS: <b>1193</b> · AO: <b>4762</b><br/>
              LS: <b>9034</b> · CHQ: <b>5581</b> · CARD: <b>6620</b>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STAFF DASHBOARD — scoped entirely to staff.counter
// ─────────────────────────────────────────────────────────────────────────────
const API = "http://localhost:3000";

function StaffDashboard({ staff, onLogout }) {
  const counter     = COUNTERS[staff.counter];

  const [tokens, setTokens]           = useState([]);
  const [notifications, setNotifs]    = useState([
    { id:1, type:"info", msg:`${counter.label} counter is active. Waiting for customers...`, time:"00:00", read:false },
  ]);
  const [activeTab, setActiveTab]     = useState("queue");
  const [filter, setFilter]           = useState("all");
  const [showNotif, setShowNotif]     = useState(false);
  const [showModal, setShowModal]     = useState(false);
  const [newTok, setNewTok]           = useState({ customer:"", priority:false, note:"" });
  const [toast, setToast]             = useState(null);
  const [time, setTime]               = useState(new Date());
  const [isOpen, setIsOpen]           = useState(true);
  const [dbCounterId, setDbCounterId] = useState(null);
  const notifRef                      = useRef(null);
  const socketRef                     = useRef(null);

  // Map staff counter code to database counter_id on login
  useEffect(() => {
    fetch(`${API}/counters`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          const match = data.data.find(c =>
            c.counter_name?.toLowerCase().includes(counter.label.toLowerCase())
          );
          if (match) setDbCounterId(match.counter_id);
        }
      })
      .catch(console.error);
  }, [staff]);

  // Socket.io real-time listener
  useEffect(() => {
    socketRef.current = io(API);
    socketRef.current.on("connect", () => console.log("Staff socket connected"));

    // Listen only on this staff's assigned counter channel
    const channel = `NEW_STAFF_NOTIFICATION_${dbCounterId}`;
    socketRef.current.on(channel, (data) => {
      fetchTokens();
      const customerInfo = data.customerName ? `${data.customerName}${data.customerEmail ? ` (${data.customerEmail})` : ''}` : '';
      pushToast(`New ticket ${data.ticketNumber} from ${customerInfo || 'Customer'}`, "info");
      addNotif("info", `Token ${data.ticketNumber} requested — ${customerInfo || 'Walk-in customer'}`);
    });

    socketRef.current.on("TOKEN_STATUS_CHANGE", (data) => {
      fetchTokens();
    });

    socketRef.current.on("NEW_CUSTOMER_REGISTERED", (data) => {
      const name = data.customerName || "Unknown";
      const email = data.customerEmail || "";
      pushToast(`New customer registered: ${name}${email ? ` (${email})` : ''}`, "info");
      addNotif("info", `New registration — ${name}${email ? ` · ${email}` : ''}`);
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [dbCounterId]);

  // Fetch tokens from backend
  const fetchTokens = async () => {
    if (!dbCounterId) return;
    try {
      const r = await fetch(`${API}/staff/tokens/${dbCounterId}`);
      const d = await r.json();
      if (d.success) {
        const formatted = d.data.map(t => ({
          id: t.token_number || `T${t.token_id}`,
          token_id: t.token_id,
          customer: t.customer_name || "Customer",
          customer_email: t.customer_email || "",
          status: t.status,
          time: new Date(t.created_at || Date.now()).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"}),
          priority: false,
          note: "",
        }));
        setTokens(formatted);
      }
    } catch (e) {
      console.error("Failed to fetch tokens", e);
    }
  };

  // Load tokens on mount and when dbCounterId changes
  useEffect(() => {
    if (dbCounterId) fetchTokens();
  }, [dbCounterId]);

  // Poll for new tokens every 10 seconds
  useEffect(() => {
    if (!dbCounterId) return;
    const iv = setInterval(fetchTokens, 10000);
    return () => clearInterval(iv);
  }, [dbCounterId]);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const h = e => { if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const pushToast = (msg, type="success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const addNotif = (type, msg) => {
    const n = { id:Date.now(), type, msg, time:new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"}), read:false };
    setNotifs(p => [n, ...p]);
  };

  const unread = notifications.filter(n => !n.read).length;

  // derive queue views
  const serving   = tokens.find(t => t.status === "serving");
  const waiting   = tokens.filter(t => t.status === "waiting");
  const completed = tokens.filter(t => t.status === "completed");
  const skipped   = tokens.filter(t => t.status === "skipped");

  // priority waiting first
  const sortedWaiting = [
    ...waiting.filter(t=>t.priority),
    ...waiting.filter(t=>!t.priority),
  ];

  const filtered = filter === "all"
    ? [...tokens.filter(t=>t.status==="serving"), ...sortedWaiting, ...tokens.filter(t=>["completed","skipped"].includes(t.status))]
    : filter === "waiting" ? sortedWaiting
    : tokens.filter(t=>t.status===filter);

  const updateStatus = async (id, status) => {
    const tok = tokens.find(t => t.id === id);
    try {
      await fetch(`${API}/staff/tokens/${tok?.token_id}/${status}`, { method: "PUT" });
      setTokens(p => p.map(t => t.id===id ? {...t, status} : t));
      pushToast(`${id} marked as ${STATUS_META[status].label}`);
      addNotif(status==="completed"?"success":"info", `Token ${id} (${tok?.customer}) → ${STATUS_META[status].label}`);
    } catch (e) {
      pushToast("Update failed", "error");
    }
  };

  const callNext = () => {
    const next = sortedWaiting[0];
    if (!next) { pushToast("No customers waiting", "info"); return; }

    // Auto-complete current serving
    if (serving) {
      fetch(`${API}/staff/tokens/${serving.token_id}/completed`, { method: "PUT" }).catch(() => {});
    }
    // Mark next as serving
    fetch(`${API}/staff/tokens/${next.token_id}/serving`, { method: "PUT" })
      .then(() => fetchTokens())
      .catch(() => {});
    pushToast(`Now serving ${next.id} — ${next.customer}`, "info");
    addNotif("info", `Token ${next.id} called — ${next.customer}`);
  };

  const generateToken = () => {
    if (!newTok.customer.trim()) { pushToast("Enter customer name", "error"); return; }
    if (!dbCounterId) { pushToast("Counter not configured", "error"); return; }

    fetch(`${API}/request-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_id: 1,
        counter_id: dbCounterId,
        token_type_id: 1,
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          const now = new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
          const entry = { id: data.token_number, customer: newTok.customer, status:"waiting", time: now, priority: newTok.priority, note: newTok.note };
          setTokens(p => [...p, entry]);
          addNotif("success", `Token ${data.token_number} generated for ${newTok.customer}${newTok.priority?" (Priority)":""}`);
          pushToast(`Token ${data.token_number} generated`);
          fetchTokens();
        } else {
          pushToast("Failed to create token", "error");
        }
      })
      .catch(() => pushToast("Server error", "error"));

    setNewTok({ customer:"", priority:false, note:"" });
    setShowModal(false);
  };

  const toggleCounter = () => {
    setIsOpen(v=>!v);
    addNotif("info", `Counter marked as ${isOpen?"Closed":"Open"}`);
    pushToast(`Counter ${isOpen?"closed":"opened"}`, "info");
  };

  return (
    <div style={{ minHeight:"100vh", background:C.slate, fontFamily:"'Inter','Segoe UI',sans-serif" }}>

      {/* ── NAV ──────────────────────────────────────────────────────────── */}
      <nav style={{
        background:C.navyDeep, color:C.white, padding:"0 24px", height:60,
        display:"flex", alignItems:"center", justifyContent:"space-between",
        position:"sticky", top:0, zIndex:100, boxShadow:"0 2px 16px rgba(0,0,0,.3)",
      }}>
        {/* Left: brand + counter identity */}
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{
            width:36, height:36, borderRadius:8, background:C.amber,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontWeight:900, fontSize:13, color:C.navyDeep, letterSpacing:1,
          }}>BOC</div>
          <div>
            <div style={{ fontSize:13, fontWeight:700 }}>Queue Management System</div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,.45)" }}>Bank of Ceylon · Staff Portal</div>
          </div>
          {/* Counter badge */}
          <div style={{
            marginLeft:8, padding:"4px 14px", borderRadius:20,
            background:counter.color+"33", border:`1.5px solid ${counter.color}`,
            display:"flex", alignItems:"center", gap:6,
          }}>
            <span style={{ fontSize:15 }}>{counter.icon}</span>
            <span style={{ fontSize:12, fontWeight:700, color:C.white }}>{counter.label} Counter</span>
          </div>
          {/* Open/Closed indicator */}
          <div style={{
            padding:"4px 12px", borderRadius:20, fontSize:11, fontWeight:700,
            background:isOpen?C.green+"33":C.red+"33",
            color:isOpen?C.green:C.red, border:`1.5px solid ${isOpen?C.green:C.red}`,
          }}>{isOpen?"● OPEN":"● CLOSED"}</div>
        </div>

        {/* Right: clock + notif + profile */}
        <div style={{ display:"flex", alignItems:"center", gap:18 }}>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:15, fontWeight:700, fontVariantNumeric:"tabular-nums" }}>
              {time.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}
            </div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,.4)" }}>
              {time.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}
            </div>
          </div>

          {/* Notification bell */}
          <div style={{ position:"relative" }} ref={notifRef}>
            <button onClick={()=>setShowNotif(v=>!v)} style={{
              background:"rgba(255,255,255,.08)", border:"none", borderRadius:8,
              width:38, height:38, cursor:"pointer", color:C.white, fontSize:16,
              display:"flex", alignItems:"center", justifyContent:"center", position:"relative",
            }}>🔔
              {unread>0 && <span style={{
                position:"absolute", top:7, right:7, width:8, height:8,
                background:C.red, borderRadius:"50%", border:`2px solid ${C.navyDeep}`,
              }}/>}
            </button>
            {showNotif && (
              <NotifPanel
                notifications={notifications}
                onChange={setNotifs}
                onClose={()=>setShowNotif(false)}
              />
            )}
          </div>

          {/* Staff profile */}
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{
              width:34, height:34, borderRadius:"50%", background:counter.color,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:12, fontWeight:800, color:C.white,
            }}>{staff.name.split(".")[0][0]}{staff.name.split(" ")[1]?.[0]}</div>
            <div>
              <div style={{ fontSize:12, fontWeight:700 }}>{staff.name}</div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,.5)" }}>{staff.role}</div>
            </div>
          </div>

          <button onClick={onLogout} style={{
            background:"rgba(255,255,255,.08)", border:"none", borderRadius:8,
            padding:"6px 14px", color:"rgba(255,255,255,.7)", cursor:"pointer",
            fontSize:11, fontWeight:600,
          }}>Sign Out</button>
        </div>
      </nav>

      {/* ── BODY ─────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth:1100, margin:"0 auto", padding:"24px 20px" }}>

        {/* Counter closed banner */}
        {!isOpen && (
          <div style={{
            background:C.redSoft, border:`1.5px solid ${C.red}`, borderRadius:12,
            padding:"14px 20px", marginBottom:20, display:"flex",
            alignItems:"center", justifyContent:"space-between",
          }}>
            <span style={{ color:C.red, fontWeight:700, fontSize:13 }}>
              ⚠️ Your counter is currently closed. Customers cannot request tokens for this counter.
            </span>
            <button onClick={toggleCounter} style={{
              padding:"7px 16px", borderRadius:8, border:"none",
              background:C.green, color:C.white, fontWeight:700, fontSize:12, cursor:"pointer",
            }}>Reopen Counter</button>
          </div>
        )}

        {/* Stats */}
        <div style={{ display:"flex", gap:14, marginBottom:24, flexWrap:"wrap" }}>
          <StatCard label="Now Serving"     value={serving?serving.id:"—"}        sub={serving?.customer||"No active customer"} accent={C.teal}   />
          <StatCard label="Waiting"         value={waiting.length}                 sub={`${waiting.filter(t=>t.priority).length} priority`}         accent={C.amber}  />
          <StatCard label="Completed"       value={completed.length}               sub="today"                                                       accent={C.green}  />
          <StatCard label="Skipped"         value={skipped.length}                 sub="today"                                                       accent={C.red}    />
          <StatCard label="Total Processed" value={completed.length+skipped.length} sub="tokens handled"                                             accent={C.navyMid}/>
        </div>

        {/* NOW SERVING banner */}
        {serving && (
          <div style={{
            background:`linear-gradient(135deg,${C.navyMid},${C.navyLight})`,
            borderRadius:14, padding:"22px 28px", marginBottom:24, color:C.white,
            display:"flex", justifyContent:"space-between", alignItems:"center",
            boxShadow:"0 4px 20px rgba(26,58,124,.3)",
          }}>
            <div>
              <div style={{ fontSize:10, letterSpacing:2, color:C.amber, textTransform:"uppercase", fontWeight:700 }}>
                Now Serving · {counter.icon} {counter.label} Counter
              </div>
              <div style={{ fontSize:34, fontWeight:900, marginTop:4, letterSpacing:"-1px" }}>{serving.id}</div>
              <div style={{ fontSize:15, color:"rgba(255,255,255,.85)", marginTop:2 }}>{serving.customer}</div>
              {serving.customer_email && <div style={{ fontSize:11, color:"rgba(255,255,255,.5)", marginTop:1 }}>{serving.customer_email}</div>}
              {serving.note && <div style={{ fontSize:12, color:C.amber, marginTop:4 }}>📝 {serving.note}</div>}
              {serving.priority && (
                <div style={{
                  display:"inline-block", marginTop:8, padding:"3px 10px", borderRadius:10,
                  background:C.red+"44", color:C.red, fontSize:10, fontWeight:700, letterSpacing:1,
                }}>⚑ PRIORITY CUSTOMER</div>
              )}
            </div>
            <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
              <SolidBtn label="✓ Complete" bg={C.green}  onClick={()=>updateStatus(serving.id,"completed")} />
              <SolidBtn label="↷ Skip"    bg={C.red}    onClick={()=>updateStatus(serving.id,"skipped")}   />
              <SolidBtn label="⏭ Next"    bg={C.amber}  tc={C.navyDeep} onClick={callNext} />
            </div>
          </div>
        )}

        {/* Tabs + actions */}
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:18, flexWrap:"wrap" }}>
          {["queue","history"].map(t=>(
            <button key={t} onClick={()=>setActiveTab(t)} style={{
              padding:"9px 22px", borderRadius:10, border:"none", cursor:"pointer",
              fontWeight:700, fontSize:13, transition:"all .15s",
              background:activeTab===t?C.navyDeep:C.white,
              color:activeTab===t?C.white:C.gray,
              boxShadow:activeTab===t?"0 2px 8px rgba(10,22,40,.18)":"none",
            }}>{t==="queue"?"🎫 My Queue":"📋 History"}</button>
          ))}

          <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
            {!serving && waiting.length>0 && (
              <button onClick={callNext} style={{
                padding:"9px 18px", borderRadius:10, border:`2px solid ${C.teal}`,
                background:"transparent", color:C.teal, fontWeight:700, fontSize:12, cursor:"pointer",
              }}>⏭ Call Next</button>
            )}
            <button onClick={toggleCounter} style={{
              padding:"9px 18px", borderRadius:10, border:"none",
              background:isOpen?C.redSoft:C.greenSoft,
              color:isOpen?C.red:C.green, fontWeight:700, fontSize:12, cursor:"pointer",
            }}>{isOpen?"⏸ Close Counter":"▶ Open Counter"}</button>
            <button onClick={()=>setShowModal(true)} style={{
              padding:"9px 20px", borderRadius:10, border:"none",
              background:C.amber, color:C.navyDeep, fontWeight:800, fontSize:13, cursor:"pointer",
            }}>＋ Generate Token</button>
          </div>
        </div>

        {/* Filter pills */}
        {activeTab==="queue" && (
          <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
            {["all","waiting","serving","completed","skipped"].map(f=>(
              <Pill key={f} active={filter===f} onClick={()=>setFilter(f)}>
                {f==="all"?"All":STATUS_META[f]?.label}
                {f==="waiting"&&waiting.length>0&&
                  <span style={{
                    marginLeft:6, padding:"1px 7px", borderRadius:10, fontSize:10, fontWeight:800,
                    background:C.amber, color:C.navyDeep,
                  }}>{waiting.length}</span>}
              </Pill>
            ))}
          </div>
        )}

        {/* Queue list */}
        {activeTab==="queue" && (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {filtered.length===0 && (
              <div style={{
                textAlign:"center", padding:48, color:C.gray,
                background:C.white, borderRadius:12, fontSize:14,
              }}>
                {filter==="all"?"Your queue is empty — generate a token to start.":"No tokens with this status."}
              </div>
            )}
            {filtered.map((t,i)=>(
              <TokenRow key={t.id} token={t} pos={i+1}
                onStatus={updateStatus}
                isServing={serving?.id===t.id}
                counterColor={counter.color}
              />
            ))}
          </div>
        )}

        {/* History table */}
        {activeTab==="history" && (
          <div style={{ background:C.white, borderRadius:12, overflow:"hidden", boxShadow:"0 2px 12px rgba(10,22,40,.06)" }}>
            <div style={{
              padding:"16px 20px", borderBottom:`1px solid ${C.slate}`,
              display:"flex", justifyContent:"space-between", alignItems:"center",
            }}>
              <span style={{ fontWeight:700, color:C.navyDeep, fontSize:14 }}>
                {counter.icon} {counter.label} Counter — Token History
              </span>
              <span style={{ fontSize:12, color:C.gray }}>
                {completed.length+skipped.length} tokens processed today
              </span>
            </div>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
              <thead>
                <tr style={{ background:C.navyDeep, color:C.white }}>
                  {["Token ID","Customer","Email","Time","Priority","Note","Status"].map(h=>(
                    <th key={h} style={{ padding:"12px 16px", textAlign:"left", fontSize:11, fontWeight:600, letterSpacing:".5px" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...completed,...skipped,...serving?[serving]:[]].map((t,i)=>(
                  <tr key={t.id} style={{ borderBottom:`1px solid ${C.slate}`, background:i%2===0?C.white:"#FAFBFD" }}>
                    <td style={{ padding:"12px 16px", fontWeight:700, color:C.navyMid }}>{t.id}</td>
                    <td style={{ padding:"12px 16px" }}>{t.customer}</td>
                    <td style={{ padding:"12px 16px", color:C.gray, fontSize:11 }}>{t.customer_email||"—"}</td>
                    <td style={{ padding:"12px 16px", color:C.gray, fontVariantNumeric:"tabular-nums" }}>{t.time}</td>
                    <td style={{ padding:"12px 16px" }}>{t.priority?<span style={{ color:C.red, fontWeight:700, fontSize:11 }}>⚑ Yes</span>:<span style={{ color:C.gray, fontSize:11 }}>—</span>}</td>
                    <td style={{ padding:"12px 16px", color:C.gray, fontSize:12 }}>{t.note||"—"}</td>
                    <td style={{ padding:"12px 16px" }}><Badge status={t.status}/></td>
                  </tr>
                ))}
                {completed.length+skipped.length===0&&!serving&&(
                  <tr><td colSpan={7} style={{ padding:32, textAlign:"center", color:C.gray }}>No completed tokens yet today.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── GENERATE TOKEN MODAL ────────────────────────────────────────── */}
      {showModal && (
        <div style={{
          position:"fixed", inset:0, background:"rgba(10,22,40,.6)",
          display:"flex", alignItems:"center", justifyContent:"center", zIndex:500,
        }}>
          <div style={{
            background:C.white, borderRadius:18, padding:32, width:420,
            boxShadow:"0 24px 60px rgba(0,0,0,.3)",
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:22 }}>
              <span style={{ fontSize:24 }}>{counter.icon}</span>
              <div>
                <div style={{ fontWeight:800, fontSize:17, color:C.navyDeep }}>Generate Token</div>
                <div style={{ fontSize:12, color:C.gray }}>{counter.label} Counter · {staff.name}</div>
              </div>
            </div>

            {/* Service locked to counter */}
            <div style={{
              padding:"10px 14px", borderRadius:8, background:C.tealSoft,
              marginBottom:16, fontSize:12, color:C.teal, fontWeight:600,
            }}>
              🔒 Service: <strong>{counter.service}</strong>
            </div>

            <label style={labelStyle}>Customer Name *</label>
            <input
              value={newTok.customer}
              onChange={e=>setNewTok(p=>({...p,customer:e.target.value}))}
              placeholder="e.g. Anura Bandara"
              style={{ ...inputStyle, marginBottom:14 }}
            />

            <label style={labelStyle}>Staff Note (optional)</label>
            <input
              value={newTok.note}
              onChange={e=>setNewTok(p=>({...p,note:e.target.value}))}
              placeholder="e.g. Large denomination, foreign currency..."
              style={{ ...inputStyle, marginBottom:16 }}
            />

            <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", marginBottom:24 }}>
              <input type="checkbox" checked={newTok.priority}
                onChange={e=>setNewTok(p=>({...p,priority:e.target.checked}))}
                style={{ width:16, height:16, accentColor:C.red }}
              />
              <span style={{ fontSize:13, fontWeight:600, color:C.navyDeep }}>
                ⚑ Priority customer (elderly / differently-abled / VIP)
              </span>
            </label>

            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>setShowModal(false)} style={{
                flex:1, padding:"12px 0", borderRadius:9, border:`1.5px solid #DDE3F0`,
                background:"transparent", color:C.gray, fontWeight:600, cursor:"pointer", fontSize:13,
              }}>Cancel</button>
              <button onClick={generateToken} style={{
                flex:2, padding:"12px 0", borderRadius:9, border:"none",
                background:C.navyDeep, color:C.white, fontWeight:800, cursor:"pointer", fontSize:13,
              }}>Generate Token</button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST ───────────────────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position:"fixed", bottom:28, left:"50%", transform:"translateX(-50%)",
          background:toast.type==="error"?C.red:C.navyDeep,
          color:C.white, padding:"12px 24px", borderRadius:10,
          fontSize:13, fontWeight:600, boxShadow:"0 4px 20px rgba(0,0,0,.2)",
          zIndex:600, whiteSpace:"nowrap",
        }}>{toast.msg}</div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function NotifPanel({ notifications, onChange, onClose }) {
  const markAll = () => onChange(p => p.map(n=>({...n,read:true})));
  const markOne = id => onChange(p => p.map(n=>n.id===id?{...n,read:true}:n));
  return (
    <div style={{
      position:"absolute", top:46, right:0, width:330,
      background:C.white, borderRadius:12, boxShadow:"0 8px 32px rgba(0,0,0,.18)",
      zIndex:200, overflow:"hidden",
    }}>
      <div style={{
        padding:"13px 16px", borderBottom:`1px solid ${C.slate}`,
        display:"flex", justifyContent:"space-between", alignItems:"center",
      }}>
        <span style={{ fontWeight:700, fontSize:13, color:C.navyDeep }}>Notifications</span>
        <button onClick={markAll} style={{ border:"none", background:"none", color:C.teal, fontSize:11, cursor:"pointer", fontWeight:600 }}>
          Mark all read
        </button>
      </div>
      <div style={{ maxHeight:310, overflowY:"auto" }}>
        {notifications.map(n=>(
          <div key={n.id} onClick={()=>markOne(n.id)} style={{
            padding:"12px 16px", borderBottom:`1px solid ${C.slate}`,
            background:n.read?C.white:C.amberSoft, cursor:"pointer",
            display:"flex", gap:10, alignItems:"flex-start",
          }}>
            <span style={{ fontSize:14, marginTop:1 }}>
              {n.type==="info"?"ℹ️":n.type==="warning"?"⚠️":n.type==="success"?"✅":"❗"}
            </span>
            <div>
              <div style={{ fontSize:12, color:C.navyDeep, lineHeight:1.45 }}>{n.msg}</div>
              <div style={{ fontSize:10, color:C.gray, marginTop:3 }}>{n.time}</div>
            </div>
            {!n.read && <div style={{ width:8, height:8, borderRadius:"50%", background:C.amber, flexShrink:0, marginTop:4 }}/>}
          </div>
        ))}
        {notifications.length===0 && (
          <div style={{ padding:32, textAlign:"center", color:C.gray, fontSize:13 }}>No notifications</div>
        )}
      </div>
    </div>
  );
}

function TokenRow({ token, pos, onStatus, isServing, counterColor }) {
  const posColor = isServing ? counterColor : C.navyMid;
  return (
    <div style={{
      background:isServing?`${counterColor}0D`:C.white,
      borderRadius:12, padding:"16px 20px",
      display:"flex", alignItems:"center", gap:16,
      boxShadow:isServing?`0 2px 16px ${counterColor}30`:"0 2px 8px rgba(10,22,40,.05)",
      border:isServing?`1.5px solid ${counterColor}`:"1.5px solid transparent",
      transition:"all .2s",
    }}>
      {/* Position */}
      <div style={{
        width:38, height:38, borderRadius:10, background:posColor,
        color:C.white, display:"flex", alignItems:"center", justifyContent:"center",
        fontWeight:800, fontSize:13, flexShrink:0,
      }}>{isServing?"▶":pos}</div>

      {/* Info */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
          <span style={{ fontWeight:800, color:C.navyDeep, fontSize:14 }}>{token.id}</span>
          {token.priority && (
            <span style={{
              fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:10,
              background:C.redSoft, color:C.red, letterSpacing:.5,
            }}>⚑ PRIORITY</span>
          )}
        </div>
        <div style={{ fontSize:13, color:C.navyMid, marginTop:2 }}>{token.customer}</div>
        {token.customer_email && <div style={{ fontSize:10, color:C.gray }}>{token.customer_email}</div>}
        <div style={{ fontSize:11, color:C.gray, marginTop:1 }}>
          {token.time}{token.note?` · 📝 ${token.note}`:""}
        </div>
      </div>

      <Badge status={token.status} />

      {/* Actions */}
      <div style={{ display:"flex", gap:6 }}>
        {token.status==="waiting" && <>
          <GhostBtn label="Serve" color={C.teal}  onClick={()=>onStatus(token.id,"serving")} />
          <GhostBtn label="Skip"  color={C.red}   onClick={()=>onStatus(token.id,"skipped")} />
        </>}
        {token.status==="serving" && <>
          <GhostBtn label="✓ Done" color={C.green} onClick={()=>onStatus(token.id,"completed")} />
          <GhostBtn label="Skip"   color={C.red}   onClick={()=>onStatus(token.id,"skipped")}   />
        </>}
      </div>
    </div>
  );
}

const Badge = ({ status }) => {
  const m = STATUS_META[status];
  return (
    <span style={{
      display:"inline-block", padding:"3px 10px", borderRadius:20,
      fontSize:11, fontWeight:700, letterSpacing:.5,
      color:m.color, background:m.bg, textTransform:"uppercase", whiteSpace:"nowrap",
    }}>{m.label}</span>
  );
};

const StatCard = ({ label, value, sub, accent }) => (
  <div style={{
    background:C.white, borderRadius:14, padding:"20px 24px",
    boxShadow:"0 2px 12px rgba(10,22,40,.07)", borderLeft:`4px solid ${accent}`,
    flex:1, minWidth:140,
  }}>
    <div style={{ fontSize:28, fontWeight:800, color:C.navyDeep }}>{value}</div>
    <div style={{ fontSize:12, fontWeight:600, color:C.gray, marginTop:2 }}>{label}</div>
    {sub && <div style={{ fontSize:11, color:accent, marginTop:4 }}>{sub}</div>}
  </div>
);

const Pill = ({ children, active, onClick }) => (
  <button onClick={onClick} style={{
    padding:"6px 16px", borderRadius:20, border:"none", cursor:"pointer",
    fontSize:12, fontWeight:600, transition:"all .15s",
    background:active?C.navyMid:C.white,
    color:active?C.white:C.gray,
    display:"flex", alignItems:"center",
  }}>{children}</button>
);

const GhostBtn = ({ label, color, onClick }) => (
  <button onClick={onClick} style={{
    padding:"6px 14px", borderRadius:8, border:"none", cursor:"pointer",
    background:color+"22", color, fontWeight:700, fontSize:12, transition:"all .15s",
  }}>{label}</button>
);

const SolidBtn = ({ label, bg, tc=C.white, onClick }) => (
  <button onClick={onClick} style={{
    padding:"10px 18px", borderRadius:8, border:"none", cursor:"pointer",
    background:bg, color:tc, fontWeight:700, fontSize:13,
  }}>{label}</button>
);

const labelStyle = { fontSize:12, fontWeight:600, color:C.gray, display:"block", marginBottom:5 };
const inputStyle = {
  display:"block", width:"100%", padding:"10px 12px", borderRadius:8,
  border:"1.5px solid #DDE3F0", fontSize:13, outline:"none",
  boxSizing:"border-box", background:C.white,
};
