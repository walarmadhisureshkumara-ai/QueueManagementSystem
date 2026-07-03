import React, { useEffect, useState } from "react";
// Import the socket client library
import { io } from "socket.io-client";

// Connect to your backend node server. 
// Note: If testing from a real physical mobile device, replace 'localhost' with your local IPv4 address (e.g. 'http://192.168.56.1:3000')
const socket = io("http://localhost:3000");

// ── DESIGN TOKENS ──────────────────────────────────────────
const T = {
  primary:      "#7C3AED",          // violet accent
  primaryDark:  "#5B21B6",
  primaryLight: "#8B5CF6",
  primaryMuted: "#EDE9FE",          // soft violet tint

  sidebarBg:    "#1E1B5E",          // deep indigo
  sidebarDeep:  "#14114A",

  emerald:      "#059669",
  emeraldLight: "#D1FAE5",
  gold:         "#D97706",
  goldLight:    "#FEF3C7",
  rose:         "#E11D48",
  roseMuted:    "#FFE4E6",

  ink:          "#1E1B4B",          // indigo-tinted ink
  inkMid:       "#3730A3",          // medium indigo text
  inkSoft:      "#6B7280",
  border:       "#DDD6FE",          // violet-tinted border
  bg:           "#F5F3FF",          // lavender background
  surface:      "#FFFFFF",
  surfaceAlt:   "#F0EBFF",          // soft lavender surface
};

const font = "'Inter', 'Segoe UI', system-ui, sans-serif";

const services = [
  "Cash Deposit",
  "Withdrawal",
  "Account Opening",
  "Jewelry & Pawning",
  "Loans",
];

// ── MAIN COMPONENT ─────────────────────────────────────────
export default function AdminDashboard() {
  const [page, setPage] = useState("dashboard");

  const [staffList, setStaffList] = useState([]);
  const [counterList, setCounterList] = useState([]);
  const [reports, setReports] = useState([]);
  
  // Real-time notification data stack state
  const [liveNotifications, setLiveNotifications] = useState([]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("staff");
  const [password, setPassword] = useState("");

  const [counterId, setCounterId] = useState("");
  const [status, setStatus] = useState("active");

  const [selectedCounter, setSelectedCounter] = useState("");
  const [selectedStaff, setSelectedStaff] = useState("");

  const [counterName, setCounterName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  const [maxQueue, setMaxQueue] = useState("");
  const [openTime, setOpenTime] = useState("");
  const [closeTime, setCloseTime] = useState("");
  const [clock, setClock] = useState("");
  const [editCounter, setEditCounter] = useState(null);

  // ---------------- LOAD DATA FUNCTIONS ----------------
  const loadStaff = async () => {
    try {
      const res = await fetch("http://localhost:3000/staff");
      const data = await res.json();
      if (data.success) setStaffList(data.data);
    } catch (err) {
      console.error("Error loading staff:", err);
    }
  };
  
  const loadCounters = async () => {
    try {
      const res = await fetch("http://localhost:3000/counters");
      const data = await res.json();
      if (data.success) setCounterList(data.data);
    } catch (err) {
      console.error("Error loading counters:", err);
    }
  };

  const loadReports = async () => {
    try { 
      const r = await fetch("http://localhost:3000/report"); 
      const d = await r.json(); 
      if (d.success) setReports(d.data); 
    } catch { 
      setReports([]); 
    }
  };

  // ---------------- LIFECYCLE EFFECT ----------------
  useEffect(() => {
    // Initial fetch
    loadStaff();
    loadCounters();

    // Setup real-time incoming websocket notification listener
    socket.on("NEW_STAFF_NOTIFICATION", (data) => {
      setLiveNotifications((prev) => [data, ...prev]);

      // Sound notification alert ring
      try {
        const alertAudio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav");
        alertAudio.play();
      } catch (e) {
        console.log("Audio notification blocked until user profile interaction.");
      }
    });

    // Clock Interval
    const tick = () =>
      setClock(new Date().toLocaleTimeString("en-LK", { hour: "2-digit", minute: "2-digit" }));
    tick();
    const id = setInterval(tick, 1000);

    return () => {
      clearInterval(id);
      socket.off("NEW_STAFF_NOTIFICATION");
    };
  }, []);

  // Sync data dynamically based on active nav tab switching
  useEffect(() => {
    if (page === "staff")    loadStaff();
    if (page === "reports")  loadReports();
    if (page === "counters") loadCounters();
  }, [page]);

  // ---------------- ACTIONS ────────────────
  const addStaff = async () => {
    if (!name || !email || !phone || !password) {
      alert("Please fill all fields");
      return;
    }

    try {
      const r = await fetch("http://localhost:3000/staff/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          role,
          password,
          counter_id: counterId,
          status,
        }),
      });

      const d = await r.json();
      alert(d.message);

      setName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setRole("staff");
      setCounterId("");
      setStatus("active");

      loadStaff();
    } catch (err) {
      alert("Server error");
      console.log(err);
    }
  };

  const deleteStaff = async (id) => {
    if (!window.confirm("Delete this staff member?")) return;
    try { 
      const r = await fetch(`http://localhost:3000/staff/delete/${id}`, { method: "DELETE" }); 
      const d = await r.json(); 
      alert(d.message); 
      loadStaff(); 
    } catch { 
      alert("Server error"); 
    }
  };

  const updateCounter = async (counter) => {
    try {
      const r = await fetch(`http://localhost:3000/counters/update/${counter.counter_id}`, {
        method: "PUT", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staff_name: counter.staff_name, service_type: counter.service_type }),
      });
      const d = await r.json(); 
      alert(d.message); 
      setEditCounter(null); 
      loadCounters();
    } catch { 
      alert("Server error"); 
    }
  };

  const saveSettings = async () => {
    try {
      const r = await fetch("http://localhost:3000/settings/update", {
        method: "PUT", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ max_queue: maxQueue, open_time: openTime, close_time: closeTime }),
      });
      const d = await r.json(); 
      alert(d.message);
    } catch { 
      alert("Server error"); 
    }
  };

  const addCounter = async () => {
    const res = await fetch("http://localhost:3000/counter/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        counter_name: counterName,
        location,
        description,
        status,
      }),
    });

    const data = await res.json();
    alert(data.message);

    setCounterName("");
    setLocation("");
    setDescription("");

    loadCounters();
  };

  const assignCounter = async () => {
    const res = await fetch("http://localhost:3000/counter/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        counter_id: selectedCounter,
        staff_id: selectedStaff,
      }),
    });

    const data = await res.json();
    alert(data.message);

    loadCounters();
  };
  
  const navItems = [
    { section: "Overview",   items: [{ icon: "⊞", label: "Dashboard",    key: "dashboard" }] },
    { section: "Management", items: [
      { icon: "👥", label: "Manage Staff", key: "staff" },
      { icon: "🏦", label: "Counters",     key: "counters" },
    ]},
    { section: "Analytics",  items: [
      { icon: "📊", label: "Reports",  key: "reports" },
      { icon: "⚙",  label: "Settings", key: "settings" },
    ]},
  ];

  // ── SINGLE STRUCTURAL RETURN ──
  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: font, background: T.bg }}>

      {/* ── SIDEBAR ── */}
      <aside style={S.sidebar}>
        <div style={S.logoWrap}>
          <div style={S.logoBadge}>BOC</div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", letterSpacing: ".3px" }}>Bank of Ceylon</p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,.5)", marginTop: 2 }}>Admin Portal</p>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "8px 0" }}>
          {navItems.map(({ section, items }) => (
            <div key={section}>
              <p style={S.navLabel}>{section}</p>
              {items.map(({ icon, label, key }) => (
                <div key={key} onClick={() => setPage(key)}
                  style={{ ...S.navItem, ...(page === key ? S.navItemActive : {}) }}>
                  <span style={{ fontSize: 15 }}>{icon}</span>
                  <span>{label}</span>
                  {page === key && <div style={S.navDot} />}
                </div>
              ))}
            </div>
          ))}
        </nav>

        <div style={S.sidebarFooter}>
          <div style={S.adminAvatar}>AD</div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>Admin</p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,.5)" }}>admin@boc.lk</p>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ── */}
      <main style={{ flex: 1, overflowY: "auto" }}>

        {/* Top bar */}
        <header style={S.topbar}>
          <div>
            <h1 style={S.pageTitle}>
              {page === "dashboard" && "Dashboard"}
              {page === "staff"     && "Manage Staff"}
              {page === "counters"  && "Counters"}
              {page === "reports"   && "Reports"}
              {page === "settings"  && "Settings"}
            </h1>
            <p style={S.pageSub}>Bank of Ceylon — Token Queue System</p>
          </div>
          <div style={S.clockPill}>{clock}</div>
        </header>

        <div style={{ padding: "0 28px 32px" }}>

          {/* ── LIVE NOTIFICATION WIDGET (Renders dynamically over individual pages if alerts exist) ── */}
          {liveNotifications.length > 0 && (
            <div style={S.notificationPanel}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <p style={{ ...S.panelTitle, margin: 0, color: T.gold }}>🔔 Real-time Terminal Broadcasts</p>
                <button onClick={() => setLiveNotifications([])} style={S.clearNotifBtn}>Clear Logs</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {liveNotifications.map((notif, index) => (
                  <div key={index} style={{ ...S.notificationCard, borderLeftColor: notif.colorTheme || T.primary }}>
                    <div>
                      <span style={{ fontWeight: 800, fontSize: 15, color: T.ink, marginRight: 12 }}>{notif.ticketNumber}</span>
                      <span style={{ color: T.inkMid, fontSize: 13.5 }}>Requested service for <strong>{notif.serviceName}</strong></span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={S.notifCounterBadge}>Counter {notif.counterId}</span>
                      <p style={{ fontSize: 11, color: T.inkSoft, marginTop: 4, margin: 0 }}>{notif.timeRequested}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── DASHBOARD VIEW ── */}
          {page === "dashboard" && (
            <>
              <div style={S.heroBanner}>
                <div style={S.heroBannerOrb1} />
                <div style={S.heroBannerOrb2} />
                <div style={{ position: "relative" }}>
                  <p style={{ fontSize: 12, opacity: .75, marginBottom: 6, letterSpacing: "1px", textTransform: "uppercase" }}>
                    Good morning
                  </p>
                  <h2 style={{ fontSize: 26, fontWeight: 700, marginBottom: 6 }}>Welcome back, Admin</h2>
                  <p style={{ fontSize: 14, opacity: .8 }}>Here's what's happening at the branch today.</p>
                </div>
                <div style={S.heroStats}>
                  <div style={S.heroStatItem}>
                    <span style={{ fontSize: 30, fontWeight: 700 }}>28</span>
                    <span style={{ fontSize: 12, opacity: .7, marginTop: 2 }}>Active tokens</span>
                  </div>
                  <div style={{ width: 1, background: "rgba(255,255,255,.2)", alignSelf: "stretch" }} />
                  <div style={S.heroStatItem}>
                    <span style={{ fontSize: 30, fontWeight: 700 }}>15</span>
                    <span style={{ fontSize: 12, opacity: .7, marginTop: 2 }}>Waiting</span>
                  </div>
                </div>
              </div>

              <div style={S.cardGrid}>
                <StatCard icon="👥" label="Total Staff"   value={staffList.length} sub="+2 this week"   accent={T.primary}  bg={T.primaryMuted} />
                <StatCard icon="🏦" label="Counters"      value={counterList.length}  sub="All assigned"   accent={T.emerald}  bg={T.emeraldLight} />
                <StatCard icon="🎫" label="Active Tokens" value={28}               sub="Right now"      accent={T.rose}     bg={T.roseMuted} />
                <StatCard icon="⏳" label="Avg Wait Time" value="8m"               sub="Below target"   accent={T.gold}     bg={T.goldLight} />
              </div>

              <div style={S.panel}>
                <p style={S.panelTitle}>Quick Actions & Fast Add</p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
                  {[
                    { label: "➕ Add Staff",     key: "staff",    primary: true },
                    { label: "🏦 Manage Counters", key: "counters", primary: false },
                    { label: "📊 View Reports",    key: "reports",  primary: false },
                    { label: "⚙ Settings",         key: "settings", primary: false },
                  ].map(({ label, key, primary }) => (
                    <button key={key} onClick={() => setPage(key)} style={primary ? S.btnPrimary : S.btnSecondary}>
                      {label}
                    </button>
                  ))}
                </div>

                <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 20 }}>
                  <h3 style={{ fontSize: 14, color: T.ink, marginBottom: 12 }}>Quick Counter Register</h3>
                  <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                    <input style={S.input} placeholder="Counter Name" value={counterName} onChange={(e) => setCounterName(e.target.value)} />
                    <input style={S.input} placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
                    <button style={S.btnPrimary} onClick={addCounter}>Save Counter</button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── STAFF VIEW ── */}
          {page === "staff" && (
            <>
              <div style={S.panel}>
                <p style={S.panelTitle}>➕ Add New Staff Member</p>
                <div style={S.formGrid}>
                  <Field label="Full Name" value={name} onChange={setName} placeholder="e.g. Kasun Perera" />
                  <Field label="Email" value={email} onChange={setEmail} placeholder="kasun@boc.lk" />
                  <Field label="Phone" value={phone} onChange={setPhone} placeholder="0771234567" />      
                  <Field label="Password" value={password} onChange={setPassword} placeholder="••••••" type="password" />

                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={S.fieldLabel}>Role</label>
                    <select style={S.select} value={role} onChange={(e) => setRole(e.target.value)}>
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <Field label="Counter ID" value={counterId} onChange={setCounterId} placeholder="1" />

                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={S.fieldLabel}>Status</label>
                    <select style={S.select} value={status} onChange={(e) => setStatus(e.target.value)}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <button style={S.btnPrimary} onClick={addStaff}>✅ Add Staff</button>
              </div>

              <div style={S.panel}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <p style={S.panelTitle}>Staff Directory</p>
                  <span style={S.countBadge}>{staffList.length} members</span>
                </div>
                <table style={S.table}>
                  <thead>
                    <tr style={{ background: T.surfaceAlt }}>
                      <Th>Name</Th><Th>Email</Th><Th>Role</Th><Th>Action</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffList.length === 0 ? (
                      <tr><td colSpan={4} style={S.emptyCell}>No staff found. Add your first staff member above.</td></tr>
                    ) : (
                      staffList.map((st) => (
                        <tr key={st.staff_id || st.id} style={S.tableRow}>
                          <Td><span style={{ fontWeight: 600, color: T.ink }}>{st.name}</span></Td>
                          <Td>{st.email}</Td>
                          <Td>
                            <span style={{ ...S.chip, background: st.role === "admin" ? T.primaryMuted : T.surfaceAlt, color: st.role === "admin" ? T.primary : T.inkSoft }}>
                              {st.role}
                            </span>
                          </Td>
                          <Td>
                            <button style={S.btnDanger} onClick={() => deleteStaff(st.staff_id || st.id)}>🗑 Delete</button>
                          </Td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── COUNTERS VIEW ── */}
          {page === "counters" && (
            <>
              <div style={S.panel}>
                <p style={S.panelTitle}>🔗 Assign Staff to Counter</p>
                <div style={{ display: "flex", gap: 15, alignItems: "flex-end" }}>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={S.fieldLabel}>Counter</label>
                    <select style={S.select} value={selectedCounter} onChange={(e) => setSelectedCounter(e.target.value)}>
                      <option value="">Select Counter</option>
                      {counterList.map((c) => (
                        <option key={c.counter_id} value={c.counter_id}>{c.counter_name}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={S.fieldLabel}>Staff Member</label>
                    <select style={S.select} value={selectedStaff} onChange={(e) => setSelectedStaff(e.target.value)}>
                      <option value="">Select Staff</option>
                      {staffList.map((s) => (
                        <option key={s.staff_id || s.id} value={s.staff_id || s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <button style={S.btnPrimary} onClick={assignCounter}>Assign</button>
                </div>
              </div>

              <div style={S.panel}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <p style={S.panelTitle}>Counter Assignments</p>
                  <span style={S.countBadge}>{counterList.length} counters</span>
                </div>
                <table style={S.table}>
                  <thead>
                    <tr style={{ background: T.surfaceAlt }}>
                      <Th>Counter</Th><Th>Service Type</Th><Th>Assigned Staff</Th><Th>Status</Th><Th>Action</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {counterList.map((c) => {
                      const statusColor =
                        c.status === "Active" || c.status === "active" ? { bg: T.emeraldLight, fg: T.emerald } :
                        c.status === "Break"  ? { bg: T.goldLight,    fg: T.gold    } :
                                                { bg: T.roseMuted,    fg: T.rose    };
                      return (
                        <tr key={c.counter_id} style={S.tableRow}>
                          <Td><span style={{ fontWeight: 700, fontSize: 14, color: T.ink }}>{c.counter_name}</span></Td>
                          <Td>
                            {editCounter === c.counter_id ? (
                              <select defaultValue={c.service_type} style={S.select}
                                onChange={(e) => setCounterList(counterList.map(x => x.counter_id === c.counter_id ? { ...x, service_type: e.target.value } : x))}>
                                {services.map((sv) => <option key={sv}>{sv}</option>)}
                              </select>
                            ) : c.service_type || "General"}
                          </Td>
                          <Td>
                            {editCounter === c.counter_id ? (
                              <select defaultValue={c.staff_name} style={S.select}
                                onChange={(e) => setCounterList(counterList.map(x => x.counter_id === c.counter_id ? { ...x, staff_name: e.target.value } : x))}>
                                <option value="">— Unassigned —</option>
                                {staffList.map((st) => <option key={st.staff_id || st.id} value={st.name}>{st.name}</option>)}
                              </select>
                            ) : (c.staff_name || <span style={{ color: T.inkSoft, fontStyle: "italic" }}>Unassigned</span>)}
                          </Td>
                          <Td>
                            <span style={{ ...S.chip, background: statusColor.bg, color: statusColor.fg }}>{c.status || "active"}</span>
                          </Td>
                          <Td>
                            {editCounter === c.counter_id ? (
                              <div style={{ display: "flex", gap: 6 }}>
                                <button style={S.btnPrimary} onClick={() => updateCounter(c)}>💾 Save</button>
                                <button style={S.btnSecondary} onClick={() => setEditCounter(null)}>Cancel</button>
                              </div>
                            ) : (
                              <button style={S.btnEdit} onClick={() => setEditCounter(c.counter_id)}>✏ Edit</button>
                            )}
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── REPORTS VIEW ── */}
          {page === "reports" && (
            <>
              <div style={S.cardGrid}>
                <StatCard icon="🎫" label="Today — Total"  value={84} sub="All tokens issued"   accent={T.primary}  bg={T.primaryMuted} />
                <StatCard icon="✅" label="Completed"      value={69} sub="82% completion rate" accent={T.emerald}  bg={T.emeraldLight} />
                <StatCard icon="⏳" label="Pending"        value={15} sub="In queue"             accent={T.gold}     bg={T.goldLight} />
                <StatCard icon="⏱" label="Avg Wait Time"  value="8m" sub="Below 10m target"    accent={T.rose}     bg={T.roseMuted} />
              </div>
              <div style={S.panel}>
                <p style={S.panelTitle}>Daily Report</p>
                <table style={S.table}>
                  <thead>
                    <tr style={{ background: T.surfaceAlt }}>
                      <Th>Date</Th><Th>Total</Th><Th>Completed</Th><Th>Pending</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.length === 0 ? (
                      <tr><td colSpan={4} style={S.emptyCell}>No report data available yet.</td></tr>
                    ) : (
                      reports.map((r, i) => (
                        <tr key={i} style={S.tableRow}>
                          <Td>{r.date}</Td>
                          <Td><span style={{ fontWeight: 600 }}>{r.total_queues}</span></Td>
                          <Td><span style={{ color: T.emerald, fontWeight: 600 }}>{r.completed}</span></Td>
                          <Td><span style={{ color: T.gold,    fontWeight: 600 }}>{r.pending}</span></Td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── SETTINGS VIEW ── */}
          {page === "settings" && (
            <div style={S.panel}>
              <p style={S.panelTitle}>System Settings</p>
              <div style={S.formGrid}>
                <Field label="Max Queue Size" value={maxQueue}  onChange={setMaxQueue}  placeholder="e.g. 100" />
                <Field label="Branch Name"    value="Colombo Main"           onChange={() => {}}     placeholder="e.g. Colombo Main" />
                <Field label="Open Time"      value={openTime}  onChange={setOpenTime}  placeholder="08:30" />
                <Field label="Close Time"     value={closeTime} onChange={setCloseTime} placeholder="15:00" />
              </div>
              <button style={S.btnPrimary} onClick={saveSettings}>💾 Save Settings</button>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

// ── HELPER COMPONENTS ──────────────────────────────────────
function StatCard({ icon, label, value, sub, accent, bg }) {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: "20px 22px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, right: 0, width: 80, height: 80, background: bg, borderRadius: "0 16px 0 100%" }} />
      <div style={{ fontSize: 22, marginBottom: 12 }}>{icon}</div>
      <p style={{ fontSize: 13, color: T.inkSoft, marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 32, fontWeight: 700, color: T.ink, lineHeight: 1, marginBottom: 6 }}>{value}</p>
      <p style={{ fontSize: 12, color: accent, fontWeight: 500 }}>{sub}</p>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={S.fieldLabel}>{label}</label>
      <input type={type} value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)} style={S.input} />
    </div>
  );
}

// Header cell configuration helper
function Th({ children }) {
  return (
    <th style={{ textAlign: "left", padding: "12px 16px", fontSize: 12, fontWeight: 600, color: T.inkSoft, letterSpacing: ".4px", textTransform: "uppercase" }}>
      {children}
    </th>
  );
}

// Data cell configuration helper
function Td({ children }) {
  return (
    <td style={{ padding: "14px 16px", borderBottom: `1px solid ${T.border}`, fontSize: 14, color: T.inkMid, verticalAlign: "middle" }}>
      {children}
    </td>
  );
}

// ── STYLES ─────────────────────────────────────────────────
const S = {
  sidebar: {
    width: 240,
    background: T.sidebarBg,
    backgroundImage: `linear-gradient(160deg, ${T.sidebarDeep} 0%, ${T.sidebarBg} 55%, #2D2A80 100%)`,
    display: "flex",
    flexDirection: "column",
    boxShadow: "4px 0 24px rgba(30,27,94,.35)",
    position: "sticky",
    top: 0,
    height: "100vh",
    flexShrink: 0,
  },
  logoWrap: {
    padding: "22px 18px",
    borderBottom: "1px solid rgba(255,255,255,.1)",
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: T.primary,
    border: "1px solid rgba(255,255,255,.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontWeight: 800,
    fontSize: 13,
    letterSpacing: ".5px",
    flexShrink: 0,
    boxShadow: `0 2px 12px rgba(124,58,237,.6)`,
  },
  navLabel: {
    padding: "16px 18px 5px",
    fontSize: 10,
    color: "rgba(255,255,255,.35)",
    textTransform: "uppercase",
    letterSpacing: "1px",
    fontWeight: 600,
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 18px",
    margin: "2px 10px",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
    color: "rgba(255,255,255,.6)",
    position: "relative",
  },
  navItemActive: {
    background: "rgba(124,58,237,.4)",
    color: "white",
    fontWeight: 600,
    boxShadow: "inset 0 0 0 1px rgba(167,139,250,.3)",
  },
  navDot: {
    position: "absolute",
    right: 12,
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: T.primaryLight,
    boxShadow: `0 0 6px ${T.primaryLight}`,
  },
  sidebarFooter: {
    padding: "14px 18px",
    borderTop: "1px solid rgba(255,255,255,.1)",
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  adminAvatar: {
    width: 34,
    height: 34,
    borderRadius: 10,
    background: "rgba(124,58,237,.5)",
    border: "1px solid rgba(167,139,250,.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontSize: 12,
    fontWeight: 700,
    flexShrink: 0,
  },
  topbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "24px 28px 20px",
    background: T.surface,
    borderBottom: `1px solid ${T.border}`,
    marginBottom: 28,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: T.ink,
    marginBottom: 4,
  },
  pageSub: {
    fontSize: 13,
    color: T.inkSoft,
  },
  clockPill: {
    background: T.surfaceAlt,
    border: `1px solid ${T.border}`,
    borderRadius: 8,
    padding: "6px 16px",
    fontSize: 14,
    fontWeight: 600,
    color: T.primary,
    fontVariantNumeric: "tabular-nums",
  },
  heroBanner: {
    background: T.sidebarBg,
    backgroundImage: `linear-gradient(120deg, ${T.sidebarDeep} 0%, ${T.sidebarBg} 50%, ${T.primary} 130%)`,
    borderRadius: 16,
    padding: "28px 32px",
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    position: "relative",
    overflow: "hidden",
    boxShadow: `0 6px 28px rgba(30,27,94,.35)`,
  },
  heroBannerOrb1: {
    position: "absolute",
    right: -30,
    top: -30,
    width: 180,
    height: 180,
    borderRadius: "50%",
    background: "rgba(124,58,237,.25)",
  },
  heroBannerOrb2: {
    position: "absolute",
    right: 80,
    bottom: -50,
    width: 140,
    height: 140,
    borderRadius: "50%",
    background: "rgba(167,139,250,.15)",
  },
  heroStats: {
    display: "flex",
    gap: 32,
    alignItems: "center",
    background: "rgba(0,0,0,.2)",
    border: "1px solid rgba(255,255,255,.12)",
    borderRadius: 12,
    padding: "16px 28px",
    position: "relative",
  },
  heroStatItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
  },
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 16,
    marginBottom: 24,
  },
  panel: {
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: 16,
    padding: "22px 24px",
    marginBottom: 24,
    boxShadow: "0 1px 6px rgba(124,58,237,.06)",
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: T.ink,
    marginBottom: 18,
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: T.inkSoft,
    letterSpacing: ".2px",
  },
  input: {
    padding: "10px 12px",
    border: `1.5px solid ${T.border}`,
    borderRadius: 10,
    fontSize: 14,
    color: T.ink,
    background: T.surface,
    outline: "none",
    fontFamily: font,
  },
  select: {
    padding: "10px 12px",
    border: `1.5px solid ${T.border}`,
    borderRadius: 10,
    fontSize: 14,
    color: T.ink,
    background: T.surface,
    fontFamily: font,
    width: "100%",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    borderRadius: 10,
    overflow: "hidden",
  },
  tableRow: { transition: "background .1s" },
  emptyCell: {
    textAlign: "center",
    padding: 32,
    color: T.inkSoft,
    fontSize: 14,
  },
  chip: {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
  },
  countBadge: {
    background: T.primaryMuted,
    border: `1px solid ${T.border}`,
    borderRadius: 20,
    padding: "4px 14px",
    fontSize: 12,
    fontWeight: 600,
    color: T.primary,
  },
  btnPrimary: {
    padding: "10px 20px",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    background: T.primary,
    color: "white",
    boxShadow: `0 2px 10px rgba(124,58,237,.4)`,
    fontFamily: font,
  },
  btnSecondary: {
    padding: "10px 20px",
    border: `1.5px solid ${T.border}`,
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    background: T.surface,
    color: T.inkMid,
    fontFamily: font,
  },
  btnDanger: {
    padding: "6px 12px",
    background: T.roseMuted,
    color: T.rose,
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
    fontFamily: font,
  },
  btnEdit: {
    padding: "6px 12px",
    background: T.primaryMuted,
    color: T.primary,
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
    fontFamily: font,
  },
  
  // Real-time Notification Styles
  notificationPanel: {
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderTop: `4px solid ${T.gold}`,
    borderRadius: 16,
    padding: "20px 24px",
    marginBottom: 24,
    boxShadow: "0 10px 15px -3px rgba(217,119,6,0.1)",
  },
  clearNotifBtn: {
    background: "none",
    border: "none",
    color: T.inkSoft,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
    textDecoration: "underline",
    fontFamily: font,
  },
  notificationCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: T.bg,
    padding: "12px 18px",
    borderRadius: 10,
    borderLeft: "5px solid",
    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
  },
  notifCounterBadge: {
    backgroundColor: T.surface,
    color: T.ink,
    border: `1px solid ${T.border}`,
    padding: "3px 10px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 700,
  }
};