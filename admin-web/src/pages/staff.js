import { useState, useEffect, useRef } from "react"; // Import React hooks: state, side effects, and refs
import { useNavigate } from "react-router-dom"; // Import useNavigate hook for programmatic navigation
import { io } from "socket.io-client"; // Import Socket.IO client for real-time server communication
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS framework styles
import 'bootstrap-icons/font/bootstrap-icons.css'; // Import Bootstrap Icons font for UI icons
import API, { getCountersAPI, getStaffTokensAPI, updateTokenStatusAPI, generateTokenAPI, requestTokenAPI } from "../api";
// ─────────────────────────────────────────────────────────────────────────────
// BOC BANK · Queue Management System · Staff Dashboard
// Each staff member is bound to ONE counter.
// ─────────────────────────────────────────────────────────────────────────────

// Define color palette constants used throughout the UI
const C = {
  navyDeep:  "#0A1628", // Dark navy for primary backgrounds and headings
  navyMid:   "#12285C", // Medium navy for secondary elements
  navyLight: "#1A3A7C", // Lighter navy for accents
  amber:     "#F5A623", // Amber/gold for highlights and CTAs
  amberSoft: "#FFF3D6", // Soft amber tint for backgrounds
  teal:      "#00B8A9", // Teal for success/active states
  tealSoft:  "#E0FAF8", // Soft teal tint for backgrounds
  red:       "#E8395A", // Red for errors, skipping, and warnings
  redSoft:   "#FDEAEE", // Soft red tint for backgrounds
  green:     "#1DB97A", // Green for completion and success
  greenSoft: "#E3FAF1", // Soft green tint for backgrounds
  slate:     "#F2F4F8", // Light slate gray for page backgrounds
  gray:      "#6B7A99", // Muted gray for secondary text
  white:     "#FFFFFF", // Pure white
}; // End color constants object

// Define counter types with their codes, labels, icons, colors, and service descriptions
const COUNTERS = {
  CD: { code: "CD", label: "Cash Deposit",           icon: "💵", color: "#1A8FE3", service: "Cash Deposit" }, // Cash Deposit counter config
  CW: { code: "CW", label: "Cash Withdrawal",         icon: "💴", color: "#7B5EA7", service: "Cash Withdrawal" }, // Cash Withdrawal counter config
  CS: { code: "CS", label: "Customer Service",        icon: "🎧", color: "#00B8A9", service: "Customer Service / Help Desk" }, // Customer Service counter config
  AO: { code: "AO", label: "Account Opening",         icon: "📋", color: "#1DB97A", service: "Account Opening" }, // Account Opening counter config
  LS: { code: "LS", label: "Loan Services",           icon: "🏦", color: "#F5A623", service: "Loan Services" }, // Loan Services counter config
  CHQ: { code: "CHQ", label: "Cheque Services",       icon: "🗒️", color: "#E8395A", service: "Cheque Services (Deposit & Clearing)" }, // Cheque Services counter config
  CARD: { code: "CARD", label: "Card Services",       icon: "💳", color: "#0A1628", service: "Card Services (ATM/Debit/Credit)" }, // Card Services counter config
}; // End counter types object

// Define the staff roster with id, name, assigned counter, role, and PIN for login
const STAFF_ROSTER = [
  { id: "S01", name: "K. Jayawardena",  counter: "CD",   role: "Teller",          pin: "2241" }, // Staff 01 - Cash Deposit teller
  { id: "S02", name: "P. Rathnayake",   counter: "CW",   role: "Teller",          pin: "3857" }, // Staff 02 - Cash Withdrawal teller
  { id: "S03", name: "A. Gunaratne",    counter: "CS",   role: "Customer Rep",    pin: "1193" }, // Staff 03 - Customer Service rep
  { id: "S04", name: "N. Perera",       counter: "AO",   role: "Account Officer", pin: "4762" }, // Staff 04 - Account Opening officer
  { id: "S05", name: "S. Fernando",     counter: "LS",   role: "Loans Officer",   pin: "9034" }, // Staff 05 - Loan Services officer
  { id: "S06", name: "R. Silva",        counter: "CHQ",  role: "Teller",          pin: "5581" }, // Staff 06 - Cheque Services teller
  { id: "S07", name: "L. Dissanayake",  counter: "CARD", role: "Card Officer",    pin: "6620" }, // Staff 07 - Card Services officer
]; // End staff roster array

// Define metadata for each token status: label, color, background, and Bootstrap icon class
const STATUS_META = {
  pending:   { label:"Pending",   color:C.navyLight, bg: "#E8ECF4", icon:"bi-clock" }, // Token is pending approval/review
  waiting:   { label:"Waiting",   color:C.amber, bg:C.amberSoft, icon:"bi-hourglass-split" }, // Token is waiting in queue
  serving:   { label:"Serving",   color:C.teal,  bg:C.tealSoft,  icon:"bi-person-check" }, // Token is currently being served
  completed: { label:"Completed", color:C.green, bg:C.greenSoft, icon:"bi-check-circle" }, // Token has been completed
  skipped:   { label:"Skipped",   color:C.red,   bg:C.redSoft,   icon:"bi-skip-forward" }, // Token was skipped
}; // End status metadata object

// ─────────────────────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────────────────────

// Default export: top-level App component managing login vs. dashboard state
export default function App() {
  const [loggedIn, setLoggedIn] = useState(null); // Track whether staff is logged in (null or staff object)
  if (!loggedIn) return <LoginScreen onLogin={setLoggedIn} />; // If not logged in, show login screen
  return <StaffDashboard staff={loggedIn} onLogout={() => setLoggedIn(null)} />; // If logged in, show dashboard
} // End App component

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN SCREEN (Bootstrap)
// ─────────────────────────────────────────────────────────────────────────────

// Login screen component: staff selection and PIN entry
function LoginScreen({ onLogin }) {
  const [step, setStep] = useState("select"); // Current step: "select" for staff selection, "pin" for PIN entry
  const [sel, setSel] = useState(""); // Currently selected staff member ID
  const [pin, setPin] = useState(""); // PIN digits entered by staff
  const [err, setErr] = useState(""); // Error message to display
  const [attempts, setAttempts] = useState(0); // Count of failed PIN attempts
  const [locked, setLocked] = useState(false); // Whether login is locked due to too many failed attempts
  const [countdown, setCountdown] = useState(0); // Countdown timer for lockout duration

  // Derive the selected staff object from the roster by matching the selected ID
  const selectedStaff = STAFF_ROSTER.find(s => s.id === sel); // Find staff by selected ID
  // Derive the counter object for the selected staff member
  const counter = selectedStaff ? COUNTERS[selectedStaff.counter] : null; // Get counter config for selected staff

  // Effect: manage lockout countdown timer when locked state becomes true
  useEffect(() => {
    if (!locked) return; // Exit early if not locked
    setCountdown(30); // Set countdown to 30 seconds
    const iv = setInterval(() => { // Start interval that ticks every second
      setCountdown(c => { // Update countdown state with callback form
        if (c <= 1) { clearInterval(iv); setLocked(false); setAttempts(0); setPin(""); setErr(""); return 0; } // When countdown hits 0, unlock and reset all login state
        return c - 1; // Otherwise decrement countdown by 1
      }); // End setCountdown callback
    }, 1000); // Interval runs every 1000ms (1 second)
    return () => clearInterval(iv); // Cleanup: clear interval on unmount or when locked changes
  }, [locked]); // Re-run effect when locked state changes

  // Render the login screen UI
  return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundImage: 'url(/image.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}> 
      <div className="card border-0 shadow-lg" style={{ width: 400, borderRadius: 18 }}> 
        <div className="card-body p-4"> 
          <div className="d-flex align-items-center gap-3 mb-4"> 
            <div className="d-flex align-items-center justify-content-center rounded-3" style={{ width: 48, height: 48, background: C.amber, color: C.navyDeep, fontWeight: 900, fontSize: 16 }}>BOC</div> 
            <div> 
              <h5 className="mb-0 fw-bold" style={{ color: C.navyDeep }}>Staff Sign In</h5> 
              <small className="text-muted">Queue Management System</small> 
            </div> 
          </div> 

          
          {step === "select" ? ( // If in staff selection step
            <>
              <label className="form-label fw-semibold text-secondary small">Select your name</label> 
              <div className="d-flex flex-column gap-2 mb-3" style={{ maxHeight: 280, overflowY: "auto" }}> 
                {STAFF_ROSTER.map(s => { // Map over each staff member in roster
                  const c = COUNTERS[s.counter]; // Get the counter config for this staff member
                  const active = sel === s.id; // Check if this staff member is currently selected
                  return ( // Render staff member card
                    <div key={s.id} className={`d-flex align-items-center gap-3 p-3 rounded-3 border ${active ? 'border-2' : ''}`}
                      style={{ cursor: "pointer", background: active ? `${c.color}15` : "#fff", borderColor: active ? c.color : "#dee2e6" }}
                      onClick={() => { setSel(s.id); setErr(""); }}> 
                      <div className="d-flex align-items-center justify-content-center rounded-2" style={{ width: 40, height: 40, background: `${c.color}20`, fontSize: 20 }}>{c.icon}</div> 
                      <div className="flex-grow-1"> 
                        <div className="fw-bold" style={{ color: C.navyDeep, fontSize: 14 }}>{s.name}</div> 
                        <small className="text-muted">{s.role} · {c.label}</small> 
                      </div> 
                      {active && <i className="bi bi-check-circle-fill" style={{ color: c.color, fontSize: 18 }} />} 
                    </div> 
                  ); // End return
                })} 
              </div> 
              {err && <div className="alert alert-danger py-2 small">{err}</div>} 
              <button className="btn w-100 text-white fw-bold border-0 py-2" style={{ background: C.navyDeep, borderRadius: 10 }}
                disabled={!sel} onClick={() => { if (sel) { setErr(""); setPin(""); setStep("pin"); } else { setErr("Please select a staff member."); } }}> 
                Continue <i className="bi bi-arrow-right ms-1" /> 
              </button> 
            </> 
          ) : ( // Else, in PIN entry step
            <>
              <div className="d-flex align-items-center gap-3 mb-3 p-3 rounded-3" style={{ background: C.slate }}> 
                <span style={{ fontSize: 24 }}>{counter?.icon}</span> 
                <div> 
                  <div className="fw-bold" style={{ color: C.navyDeep }}>{selectedStaff?.name}</div> 
                  <small className="text-muted">{counter?.label} Counter</small> 
                </div> 
              </div> 
              <label className="form-label fw-semibold text-secondary small text-center d-block">Enter PIN</label> 
              
              <div className="d-flex justify-content-center gap-2 mb-3"> 
                {[0,1,2,3].map(i => ( // Map over 4 PIN digit positions
                    <div key={i} className="d-flex align-items-center justify-content-center rounded-3" style={{ width: 56, height: 60, fontSize: 24, fontWeight: 800, color: pin[i] ? C.navyDeep : "#ccc", background: pin[i] ? C.amberSoft : "#fff", border: `2px solid ${pin[i] ? C.amber : '#dee2e6'}`, boxShadow: pin[i] ? "0 2px 8px rgba(245,166,35,.3)" : "none" }}> 
                    {pin[i] ? "●" : "—"} 
                  </div> 
                ))} 
              </div> 
              
              <div className="d-flex flex-column align-items-center gap-1 mb-3"> 
                {[[1,2,3],[4,5,6],[7,8,9]].map((row, ri) => ( // Map over keypad rows
                  <div key={ri} className="d-flex gap-1"> 
                    {row.map(n => ( // Map over each digit in the row
                      <button key={n} className="btn border-0 fw-bold rounded-3 shadow-sm" style={{ width: 64, height: 52, fontSize: 20, background: "#f0f2f5", color: C.navyDeep }}
                        onClick={() => { if (!locked && pin.length < 4) { setPin(p => p + n); setErr(""); } }}>{n}</button> 
                    ))} 
                  </div> 
                ))} 
                <div className="d-flex gap-1"> 
                  <button className="btn border-0 fw-bold rounded-3 shadow-sm" style={{ width: 64, height: 52, background: "#f0f2f5", color: C.navyDeep, fontSize: 16 }}
                    onClick={() => { if (!locked) setPin(p => p.slice(0, -1)); setErr(""); }}><i className="bi bi-backspace" /></button> 
                  <button className="btn border-0 fw-bold rounded-3 shadow-sm" style={{ width: 64, height: 52, background: "#f0f2f5", color: C.navyDeep, fontSize: 20 }}
                    onClick={() => { if (!locked && pin.length < 4) { setPin(p => p + "0"); setErr(""); } }}>0</button> 
                  <button className="btn border-0 fw-bold rounded-3 shadow-sm" style={{ width: 64, height: 52, background: C.navyDeep, color: "#fff", fontSize: 20 }}
                    onClick={() => { if (locked) return; if (pin.length < 4) { setErr("Enter 4-digit PIN."); return; } if (pin !== selectedStaff?.pin) { const next = attempts + 1; setAttempts(next); setPin(""); if (next >= 3) { setLocked(true); setErr("Locked 30s."); } else { setErr(`Incorrect. ${3 - next} left.`); } return; } onLogin(selectedStaff); }}><i className="bi bi-check-lg" /></button> 
                </div> 
              </div> 
              {err && <div className="alert alert-danger py-2 small">{err}</div>} 
              {locked && <div className="text-center text-danger small fw-semibold">⏳ Locked {countdown}s</div>} 

              
              <details className="mt-2" style={{ fontSize: 11 }}> 
                <summary className="text-center text-secondary" style={{ cursor: "pointer", opacity: 0.6 }}><i className="bi bi-eye me-1" />Show PIN reference</summary> 
                <div className="mt-2 p-2 rounded-3" style={{ background: C.slate }}> 
                  {STAFF_ROSTER.map(s => { // Map over all staff to show their PINs
                    const c = COUNTERS[s.counter]; // Get counter config for this staff
                    const isSelected = sel === s.id; // Check if this staff is currently selected
                    return ( // Render PIN reference row
                      <div key={s.id} className="d-flex align-items-center gap-2 py-1 px-1 rounded-2" style={{ background: isSelected ? `${c.color}15` : "transparent" }}> 
                        <span>{c.icon}</span> 
                        <span className="flex-grow-1" style={{ color: isSelected ? C.navyDeep : C.gray, fontWeight: isSelected ? 700 : 400 }}>{s.name}</span> 
                        <span className="fw-bold font-monospace" style={{ color: C.navyDeep, fontSize: 12 }}>{s.pin}</span> 
                      </div> 
                    ); // End return
                  })} 
                </div> 
              </details> 

              <button className="btn btn-link text-decoration-none w-100 text-secondary small mt-2" onClick={() => { setStep("select"); setPin(""); setErr(""); }}><i className="bi bi-arrow-left me-1" /> Back to staff selection</button> 
            </> 
          )} 
        </div> 
      </div> 
    </div> 
  ); // End return
} // End LoginScreen component

// ─────────────────────────────────────────────────────────────────────────────
// STAFF DASHBOARD (Bootstrap)
// ─────────────────────────────────────────────────────────────────────────────

// Staff Dashboard component: main interface for managing tokens at a counter
function StaffDashboard({ staff, onLogout }) {
  const navigate = useNavigate(); // Hook for programmatic navigation
  const counter = COUNTERS[staff.counter]; // Get the counter config for the logged-in staff member
  const [tokens, setTokens] = useState([]); // Array of all tokens for this counter
  const [notifications, setNotifs] = useState([]); // Array of notification objects
  const [activeTab, setActiveTab] = useState("queue"); // Active tab: "queue" or "history"
  const [filter, setFilter] = useState("all"); // Current status filter for queue display
  const [showNotif, setShowNotif] = useState(false); // Whether the notification panel is visible
  const [showModal, setShowModal] = useState(false); // Whether the generate token modal is visible
  const [newTok, setNewTok] = useState({ customer:"", priority:false, note:"" }); // Form state for generating a new token
  const [toast, setToast] = useState(null); // Toast notification object (null when hidden)
  const [time, setTime] = useState(new Date()); // Current time for the clock display
  const [isOpen, setIsOpen] = useState(true); // Whether the counter is currently open
  const [dbCounterId, setDbCounterId] = useState(null); // Database counter ID fetched from API
  const notifRef = useRef(null); // Ref for the notification panel for click-outside handling
  const socketRef = useRef(null); // Ref to hold the Socket.IO connection instance

  // Effect: fetch the database counter ID on mount and when staff changes
  useEffect(() => {
      getCountersAPI().then(d => { // Fetch available counters from API
      if (d.success) { // If API call succeeded
        const match = d.data.find(c => c.counter_name?.toLowerCase().includes(counter.label.toLowerCase())); // Find counter matching this staff's assigned counter
        if (match) setDbCounterId(match.counter_id); // Set the database counter ID if match found
      } // End success handling
    }).catch(console.error); // Log any fetch errors
  }, [staff]); // Re-run when staff object changes

  // Effect: establish Socket.IO connection and subscribe to real-time events
  useEffect(() => {
    socketRef.current = io(API); // Connect to Socket.IO server at API URL
    const channel = `NEW_STAFF_NOTIFICATION_${dbCounterId}`; // Build channel name for this counter's notifications
    socketRef.current.on(channel, (data) => { // Listen for staff notification events on this channel
      fetchTokens(); // Refresh token list on notification
      const info = data.customerName ? `${data.customerName}${data.customerEmail ? ` (${data.customerEmail})` : ''}` : ''; // Build customer info string if available
      if (data.cancelled) { // If notification indicates a cancellation
        pushToast(`${info || 'Customer'} cancelled token ${data.ticketNumber}`, "error"); // Show error toast for cancellation
        addNotif("danger", `Token ${data.ticketNumber} cancelled by ${info || 'Customer'}`); // Add danger notification
      } else if (data.generated) { // If notification indicates token generation
        pushToast(`Token ${data.ticketNumber} generated`, "success"); // Show success toast
        addNotif("success", `Token ${data.ticketNumber} ready for service`); // Add success notification
      } else { // Otherwise, general notification
        pushToast(`Token ${data.ticketNumber} — ${info || 'Customer'}`, "info"); // Show info toast
        addNotif("info", `Token ${data.ticketNumber} requested ${info ? `by ${info}` : ''}`); // Add info notification
      } // End notification type branching
    }); // End socket event handler
    socketRef.current.on("TOKEN_STATUS_CHANGE", () => fetchTokens()); // Refresh tokens when any token status changes
    socketRef.current.on("NEW_CUSTOMER_REGISTERED", (data) => { // Listen for new customer registration events
      pushToast(`New customer: ${data.customerName} (${data.customerEmail})`, "info"); // Show info toast for new registration
      addNotif("info", `New registration — ${data.customerName} · ${data.customerEmail}`); // Add info notification
    }); // End NEW_CUSTOMER_REGISTERED handler
    return () => { if (socketRef.current) socketRef.current.disconnect(); }; // Cleanup: disconnect socket on unmount or dbCounterId change
  }, [dbCounterId]); // Re-run effect when dbCounterId changes

  // Effect: fetch tokens when dbCounterId is first set
  useEffect(() => { if (dbCounterId) fetchTokens(); }, [dbCounterId]); // Run fetchTokens when dbCounterId becomes available
  // Effect: set up periodic polling every 10 seconds to refresh token list
  useEffect(() => { const iv = setInterval(fetchTokens, 10000); return () => clearInterval(iv); }, [dbCounterId]); // Polling interval with cleanup
  // Effect: set up one-second clock tick to update displayed time
  useEffect(() => { const iv = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(iv); }, []); // Clock interval with cleanup

  // Fetch tokens from API for this counter and update state
  const fetchTokens = async () => {
    if (!dbCounterId) return; // Exit if no database counter ID
    try { // Wrap in try-catch for error handling
      const d = await getStaffTokensAPI(dbCounterId);
      if (d.success) { // If API call succeeded
        setTokens(d.data.map(t => ({ // Map API response to internal token format
          id: t.token_number || `T${t.token_id}`, // Use ticket number or fallback to T + token_id
          token_id: t.token_id, // Preserve database token ID
          customer: t.customer_name || "Customer", // Use customer name or default
          customer_email: t.customer_email || "", // Use customer email or empty string
          status: t.status, // Token status from API
          time: new Date(t.created_at || Date.now()).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"}), // Format creation time
          priority: false, note: "", // Default priority and note (placeholder)
        }))); // End setTokens
      } // End success handling
    } catch (e) { console.error(e); } // Log fetch errors
  }; // End fetchTokens

  // Show a toast notification that auto-dismisses after 3.5 seconds
  const pushToast = (msg, type) => {
    setToast({ msg, type, id: Date.now() }); // Set toast with message, type, and unique ID
    setTimeout(() => setToast(null), 3500); // Auto-dismiss toast after 3500ms
  }; // End pushToast

  // Add a notification to the notification list (newest first)
  const addNotif = (type, msg) => {
    const n = { id: Date.now() + Math.random(), type, msg, time: time.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}), read: false }; // Create notification object
    setNotifs(p => [n, ...p]); // Prepend notification to the list
  }; // End addNotif

  // Derived state calculations
  const unread = notifications.filter(n => !n.read).length; // Count of unread notifications
  const pending = tokens.filter(t => t.status === "pending"); // Tokens with "pending" status
  const serving = tokens.find(t => t.status === "serving"); // Token currently being served (or undefined)
  const waiting = tokens.filter(t => t.status === "waiting"); // Tokens in waiting status
  const completed = tokens.filter(t => t.status === "completed"); // Completed tokens
  const skipped = tokens.filter(t => t.status === "skipped"); // Skipped tokens
  const sortedWaiting = [...waiting.filter(t=>t.priority), ...waiting.filter(t=>!t.priority)]; // Waiting tokens sorted: priority first, then normal
  const filtered = filter === "all" // Determine filtered token list based on active filter
    ? [...tokens.filter(t=>t.status==="serving"), ...pending, ...sortedWaiting, ...tokens.filter(t=>["completed","skipped"].includes(t.status))] // Show all tokens in logical order
    : filter === "pending" ? pending // Only pending tokens
    : filter === "waiting" ? sortedWaiting // Only waiting tokens (priority sorted)
    : tokens.filter(t=>t.status===filter); // Filter by specific status string

  // Update the status of a token by making a PUT request to the API
  const updateStatus = async (id, status) => {
    const tok = tokens.find(t => t.id === id); // Find the token by its display ID
    try { // Wrap in try-catch
      await updateTokenStatusAPI(tok?.token_id, status);
      setTokens(p => p.map(t => t.id===id ? {...t, status} : t)); // Optimistically update local token state
      pushToast(`${id} → ${STATUS_META[status].label}`, status==="completed"?"success":"info"); // Show toast with status update
      addNotif(status==="completed"?"success":"info", `Token ${id} (${tok?.customer}) → ${STATUS_META[status].label}`); // Add notification for status change
    } catch (e) { pushToast("Update failed", "error"); } // Show error toast on failure
  }; // End updateStatus

  // Call the next waiting token (priority first) to the serving position
  const callNext = () => {
    const next = sortedWaiting[0]; // Get the first token from sorted waiting list
    if (next) updateTokenStatusAPI(next.token_id, "serving") // If there is a next token, send PUT to set it to serving
      .then(d=>{ if (d.success) fetchTokens(); pushToast(`${next.id} → Serving`,"info"); }) // On success, refresh tokens and show toast
      .catch(() => pushToast("Update failed","error")); // Show error on failure
  }; // End callNext

  // Approve a pending token request by generating an official token number
  const approveRequest = async (tokenId) => {
    try { // Wrap in try-catch
      const d = await generateTokenAPI(tokenId);
      if (d.success) { // If generation succeeded
        pushToast(`Token ${d.token_number} generated`, "success"); // Show success toast
        fetchTokens(); // Refresh token list
      } else { // If API returned failure
        pushToast(d.message || "Generate failed", "error"); // Show error toast with server message
      } // End success branch
    } catch (e) { // Catch network errors
      pushToast("Server error", "error"); // Show generic error toast
    } // End catch
  }; // End approveRequest

  // Generate a new walk-in token for a customer
  const generateToken = () => {
    if (!newTok.customer.trim()) { pushToast("Enter customer name", "error"); return; } // Validate customer name is not empty
    if (!dbCounterId) { pushToast("Counter not configured", "error"); return; } // Validate counter ID is available
    requestTokenAPI({ customer_id: 1, counter_id: dbCounterId, token_type_id: 1 }).then(data => {
      if (data.success) { // If token generation succeeded
        const now = new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"}); // Format current time
        setTokens(p => [...p, { id: data.token_number, customer: newTok.customer, status:"waiting", time: now, priority: newTok.priority, note: newTok.note }]); // Add new token to local state
        addNotif("success", `Token ${data.token_number} generated for ${newTok.customer}`); // Add success notification
        pushToast(`Token ${data.token_number} generated`, "success"); // Show success toast
        fetchTokens(); // Refresh full token list from API
      } else { pushToast("Failed to create token", "error"); } // Show error if API failed
    }).catch(() => pushToast("Server error", "error")); // Show error on network failure
    setNewTok({ customer:"", priority:false, note:"" }); // Reset new token form state
    setShowModal(false); // Close the generate token modal
  }; // End generateToken

  // Toggle the counter between open and closed state
  const toggleCounter = () => { setIsOpen(v=>!v); addNotif("info", `Counter ${isOpen?"closed":"opened"}`); pushToast(`Counter ${isOpen?"closed":"opened"}`, "info"); }; // Toggle, notify, and toast

  // Render the Staff Dashboard UI
  return (
    <div className="min-vh-100 d-flex flex-column" style={{ background: C.slate, fontFamily: "'Inter','Segoe UI',sans-serif" }}> 
      
      <nav className="navbar navbar-dark sticky-top px-3 py-2" style={{ background: C.navyDeep, minHeight: 56 }}> 
        <div className="d-flex align-items-center gap-3"> 
          <span className="d-flex align-items-center justify-content-center rounded-2" style={{ width: 32, height: 32, background: C.amber, color: C.navyDeep, fontWeight: 900, fontSize: 12 }}>BOC</span> 
          <div> 
            <button className="btn btn-sm text-white border-0 me-2" style={{ background: "rgba(255,255,255,.1)", borderRadius: 8, fontSize: 11 }}
            onClick={() => navigate('/')} title="Back to Login"> 
            <i className="bi bi-arrow-left" /> 
          </button> 
          <div> 
            <div className="fw-bold text-white" style={{ fontSize: 14 }}>Queue Management</div> 
            <div className="text-white-50" style={{ fontSize: 10 }}>Bank of Ceylon · Staff Portal</div> 
          </div> 
          <span className="badge rounded-pill d-flex align-items-center gap-1 px-3 py-1" style={{ background: `${counter.color}33`, color: counter.color, border: `1px solid ${counter.color}`, fontSize: 12 }}> 
            {counter.icon} {counter.label} 
          </span> 
          <span className={`badge rounded-pill ${isOpen ? 'bg-success' : 'bg-danger'}`} style={{ fontSize: 10 }}>{isOpen ? '● OPEN' : '● CLOSED'}</span> 
          </div> 
        </div> 
        <div className="d-flex align-items-center gap-3"> 
          <div className="text-end text-white-50" style={{ fontSize: 11 }}> 
            <div className="text-white fw-bold" style={{ fontSize: 15, fontVariantNumeric: "tabular-nums" }}> 
              {time.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",second:"2-digit"})} 
            </div> 
            <div>{time.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}</div> 
          </div> 
          <div className="position-relative" ref={notifRef}> 
            <button className="btn btn-sm position-relative text-white border-0" style={{ background: "rgba(255,255,255,.08)", borderRadius: 8, width: 36, height: 36 }}
              onClick={() => setShowNotif(v => !v)}> 
              <i className="bi bi-bell" style={{ fontSize: 16 }} /> 
              {unread > 0 && <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: 9, minWidth: 16 }}>{unread}</span>} 
            </button> 
            {showNotif && <NotifPanel notifications={notifications} onChange={setNotifs} onClose={() => setShowNotif(false)} />} 
          </div> 
          <div className="d-flex align-items-center gap-2"> 
            <div className="text-end"> 
              <div className="text-white fw-semibold" style={{ fontSize: 13 }}>{staff.name}</div> 
              <div className="text-white-50" style={{ fontSize: 10 }}>{staff.role}</div> 
            </div> 
            <button className="btn btn-sm btn-outline-light border-0" style={{ fontSize: 11 }} onClick={onLogout}> 
              <i className="bi bi-box-arrow-right" /> 
            </button> 
          </div> 
        </div> 
      </nav> 

      <div className="container-fluid p-4" style={{ maxWidth: 1400 }}> 
        
        <div className="row g-3 mb-4"> 
          <div className="col"> 
            <div className="card border-0 shadow-sm h-100" style={{ borderLeft: `4px solid ${C.teal}`, borderRadius: 12 }}> 
              <div className="card-body"> 
                <div className="fs-3 fw-bold" style={{ color: C.navyDeep }}>{serving ? serving.id : "—"}</div> 
                <div className="text-secondary small fw-semibold">Now Serving</div> 
                {serving && <div className="text-muted small">{serving.customer}</div>} 
              </div> 
            </div> 
          </div> 
          <div className="col"> 
            <div className="card border-0 shadow-sm h-100" style={{ borderLeft: `4px solid ${C.amber}`, borderRadius: 12 }}> 
              <div className="card-body"> 
                <div className="fs-3 fw-bold" style={{ color: C.navyDeep }}>{waiting.length}</div> 
                <div className="text-secondary small fw-semibold">Waiting</div> 
                <div className="text-muted small">{waiting.filter(t=>t.priority).length} priority</div> 
              </div> 
            </div> 
          </div> 
          <div className="col"> 
            <div className="card border-0 shadow-sm h-100" style={{ borderLeft: `4px solid ${C.green}`, borderRadius: 12 }}> 
              <div className="card-body"> 
                <div className="fs-3 fw-bold" style={{ color: C.navyDeep }}>{completed.length}</div> 
                <div className="text-secondary small fw-semibold">Completed</div> 
                <div className="text-muted small">today</div> 
              </div> 
            </div> 
          </div> 
          <div className="col"> 
            <div className="card border-0 shadow-sm h-100" style={{ borderLeft: `4px solid ${C.red}`, borderRadius: 12 }}> 
              <div className="card-body"> 
                <div className="fs-3 fw-bold" style={{ color: C.navyDeep }}>{skipped.length}</div> 
                <div className="text-secondary small fw-semibold">Skipped</div> 
                <div className="text-muted small">today</div> 
              </div> 
            </div> 
          </div> 
          <div className="col"> 
            <div className="card border-0 shadow-sm h-100" style={{ borderLeft: `4px solid ${C.navyMid}`, borderRadius: 12 }}> 
              <div className="card-body"> 
                <div className="fs-3 fw-bold" style={{ color: C.navyDeep }}>{completed.length + skipped.length}</div> 
                <div className="text-secondary small fw-semibold">Total</div> 
                <div className="text-muted small">tokens handled</div> 
              </div> 
            </div> 
          </div> 
        </div> 

        
        {serving && ( // Conditionally render banner if a token is being served
          <div className="card border-0 shadow mb-4 text-white" style={{ background: `linear-gradient(135deg, ${C.navyMid}, ${C.navyLight})`, borderRadius: 14 }}> 
            <div className="card-body p-4"> 
              <div className="row align-items-center"> 
                <div className="col"> 
                  <div className="small text-uppercase fw-bold" style={{ color: C.amber, letterSpacing: 1, fontSize: 10 }}> 
                    <i className="bi bi-megaphone me-1" /> Now Serving · {counter.icon} {counter.label} Counter 
                  </div> 
                  <div className="fw-black" style={{ fontSize: 32, letterSpacing: -1 }}>{serving.id}</div> 
                  <div className="fw-semibold" style={{ fontSize: 15, opacity: 0.85 }}>{serving.customer}</div> 
                  {serving.customer_email && <div className="small" style={{ opacity: 0.5 }}>{serving.customer_email}</div>} 
                  {serving.priority && <span className="badge bg-danger mt-2">⚑ PRIORITY</span>} 
                </div> 
                <div className="col-auto d-flex gap-2 flex-wrap"> 
                  <button className="btn text-white fw-bold border-0" style={{ background: C.green, borderRadius: 8 }} onClick={() => updateStatus(serving.id, "completed")}><i className="bi bi-check-lg me-1" />Complete</button> 
                  <button className="btn text-white fw-bold border-0" style={{ background: C.red, borderRadius: 8 }} onClick={() => updateStatus(serving.id, "skipped")}><i className="bi bi-skip-forward me-1" />Skip</button> 
                  <button className="btn fw-bold border-0" style={{ background: C.amber, color: C.navyDeep, borderRadius: 8 }} onClick={callNext}><i className="bi bi-skip-end me-1" />Next</button> 
                </div> 
              </div> 
            </div> 
          </div> 
        )} 

        
        <div className="d-flex align-items-center gap-2 mb-3 flex-wrap"> 
          <div className="btn-group btn-group-sm shadow-sm"> 
            {["queue","history"].map(t => ( // Map over tab options
              <button key={t} className={`btn ${activeTab === t ? 'btn-dark' : 'btn-light'} fw-semibold`} style={{ fontSize: 12, borderRadius: t==="queue"?"8px 0 0 8px":"0 8px 8px 0" }}
                onClick={() => setActiveTab(t)}>{t === "queue" ? <><i className="bi bi-list-ul me-1" />Queue</> : <><i className="bi bi-clock-history me-1" />History</>}</button> 
            ))} 
          </div> 
          <div className="ms-auto d-flex gap-2"> 
            {!serving && waiting.length > 0 && ( // Show "Call Next" button only when nothing is being served and there are waiting tokens
              <button className="btn btn-sm fw-bold border-0" style={{ background: `${C.teal}20`, color: C.teal, borderRadius: 8 }} onClick={callNext}> 
                <i className="bi bi-skip-end me-1" />Call Next 
              </button> 
            )} 
            <button className={`btn btn-sm fw-bold border-0 ${isOpen ? 'text-danger' : 'text-success'}`} style={{ background: isOpen ? C.redSoft : C.greenSoft, borderRadius: 8 }} onClick={toggleCounter}> 
              <i className={`bi ${isOpen ? 'bi-pause-circle' : 'bi-play-circle'} me-1`} />{isOpen ? 'Close' : 'Open'} 
            </button> 
            <button className="btn btn-sm fw-bold border-0 shadow-sm" style={{ background: C.amber, color: C.navyDeep, borderRadius: 8 }} onClick={() => setShowModal(true)}> 
              <i className="bi bi-plus-circle me-1" />Generate 
            </button> 
          </div> 
        </div> 

        
        {activeTab === "queue" && ( // Only show filter pills on the Queue tab
          <div className="d-flex gap-2 mb-3 flex-wrap"> 
            {["all","pending","waiting","serving","completed","skipped"].map(f => ( // Map over filter options
              <button key={f} className={`btn btn-sm fw-semibold ${filter === f ? 'btn-dark' : 'btn-light'}`} style={{ borderRadius: 20, fontSize: 11 }}
                onClick={() => setFilter(f)}> 
                {f === "all" ? "All" : STATUS_META[f]?.label} 
                {f === "pending" && pending.length > 0 && <span className="badge bg-secondary text-white ms-1" style={{ fontSize: 9 }}>{pending.length}</span>} 
                {f === "waiting" && waiting.length > 0 && <span className="badge bg-warning text-dark ms-1" style={{ fontSize: 9 }}>{waiting.length}</span>} 
              </button> 
            ))} 
          </div> 
        )} 

        
        {activeTab === "queue" ? ( // If Queue tab is active
          <div className="d-flex flex-column gap-2"> 
            {filtered.length === 0 ? ( // If no tokens match the filter
              <div className="card border-0 shadow-sm"> 
                <div className="card-body text-center py-5 text-secondary"> 
                  <i className="bi bi-inbox" style={{ fontSize: 32 }} /><br /> 
                  {filter === "all" ? "Queue is empty — generate a token to start." : "No tokens with this status."} 
                </div> 
              </div> 
            ) : filtered.map((t, i) => ( // Otherwise, map filtered tokens to TokenRow components
              <TokenRow key={t.id} token={t} pos={i + 1} onStatus={updateStatus} isServing={serving?.id === t.id} counterColor={counter.color} onGenerate={approveRequest} /> 
            ))} 
          </div> 
        ) : ( // Else, History tab is active
          <div className="card border-0 shadow-sm"> 
            <div className="card-header bg-transparent d-flex justify-content-between align-items-center py-3"> 
              <span className="fw-bold" style={{ color: C.navyDeep, fontSize: 14 }}>{counter.icon} {counter.label} — History</span> 
              <span className="small text-muted">{completed.length + skipped.length} today</span> 
            </div> 
            <div className="table-responsive"> 
              <table className="table table-hover align-middle mb-0 small"> 
                <thead className="table-dark" style={{ fontSize: 11 }}> 
                  <tr> 
                    <th className="py-2">Token</th> 
                    <th className="py-2">Customer</th> 
                    <th className="py-2">Email</th> 
                    <th className="py-2">Time</th> 
                    <th className="py-2">Priority</th> 
                    <th className="py-2">Note</th> 
                    <th className="py-2">Status</th> 
                  </tr> 
                </thead> 
                <tbody> 
                  {[...completed, ...skipped, ...serving ? [serving] : []].map(t => ( // Combine completed, skipped, and current serving tokens
                    <tr key={t.id}> 
                      <td className="fw-bold" style={{ color: C.navyMid }}>{t.id}</td> 
                      <td>{t.customer}</td> 
                      <td className="text-muted">{t.customer_email || "—"}</td> 
                      <td className="text-muted" style={{ fontVariantNumeric: "tabular-nums" }}>{t.time}</td> 
                      <td>{t.priority ? <span className="text-danger fw-bold small">⚑ Yes</span> : <span className="text-muted small">—</span>}</td> 
                      <td className="text-muted">{t.note || "—"}</td> 
                      <td><Badge status={t.status} /></td> 
                    </tr> 
                  ))} 
                  {completed.length + skipped.length === 0 && !serving && ( // If no history at all
                    <tr><td colSpan={7} className="text-center py-4 text-muted">No completed tokens yet.</td></tr> 
                  )} 
                </tbody> 
              </table> 
            </div> 
          </div> 
        )} 
      </div> 

      
      {showModal && ( // Conditionally render modal when visible
        <div className="modal d-block" tabIndex="-1" style={{ background: "rgba(10,22,40,.6)" }}> 
          <div className="modal-dialog modal-dialog-centered"> 
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 18 }}> 
              <div className="modal-body p-4"> 
                <div className="d-flex align-items-center gap-3 mb-3"> 
                  <span style={{ fontSize: 28 }}>{counter.icon}</span> 
                  <div> 
                    <h5 className="fw-bold mb-0" style={{ color: C.navyDeep }}>Generate Token</h5> 
                    <small className="text-muted">{counter.label} Counter · {staff.name}</small> 
                  </div> 
                </div> 
                <div className="alert py-2 small d-flex align-items-center gap-2" style={{ background: C.tealSoft, color: C.teal, border: "none", borderRadius: 8 }}> 
                  <i className="bi bi-lock" /> Service: <strong>{counter.service}</strong> 
                </div> 
                <div className="mb-3"> 
                  <label className="form-label fw-semibold small text-secondary">Customer Name *</label> 
                  <input className="form-control" placeholder="e.g. Anura Bandara" value={newTok.customer}
                    onChange={e => setNewTok(p => ({...p, customer: e.target.value}))} /> 
                </div> 
                <div className="mb-3"> 
                  <label className="form-label fw-semibold small text-secondary">Staff Note (optional)</label> 
                  <input className="form-control" placeholder="e.g. Large denomination" value={newTok.note}
                    onChange={e => setNewTok(p => ({...p, note: e.target.value}))} /> 
                </div> 
                <div className="form-check mb-3"> 
                  <input className="form-check-input" type="checkbox" id="priority" checked={newTok.priority}
                    onChange={e => setNewTok(p => ({...p, priority: e.target.checked}))} /> 
                  <label className="form-check-label fw-semibold small" htmlFor="priority" style={{ color: C.navyDeep }}> 
                    ⚑ Priority (elderly / differently-abled / VIP) 
                  </label> 
                </div> 
                <div className="d-flex gap-2"> 
                  <button className="btn flex-fill" style={{ border: "1.5px solid #DDE3F0", color: C.gray, borderRadius: 9 }}
                    onClick={() => setShowModal(false)}>Cancel</button> 
                  <button className="btn flex-fill text-white fw-bold border-0" style={{ background: C.navyDeep, borderRadius: 9 }}
                    onClick={generateToken}><i className="bi bi-plus-circle me-1" />Generate</button> 
                </div> 
              </div> 
            </div> 
          </div> 
        </div> 
      )} 

      
      {toast && ( // Conditionally render toast notification
        <div className="position-fixed start-50 translate-middle-x" style={{ bottom: 28, zIndex: 600 }}> 
          <div className={`toast show border-0 shadow-lg ${toast.type === 'error' ? 'bg-danger' : toast.type === 'success' ? 'bg-success' : 'bg-dark'} text-white`} style={{ borderRadius: 10, minWidth: 250 }}> 
            <div className="toast-body d-flex align-items-center gap-2 fw-semibold" style={{ fontSize: 13 }}> 
              <i className={`bi ${toast.type === 'error' ? 'bi-exclamation-triangle' : toast.type === 'success' ? 'bi-check-circle' : 'bi-info-circle'}`} /> 
              {toast.msg} 
            </div> 
          </div> 
        </div> 
      )} 
    </div> 
  ); // End return
} // End StaffDashboard component

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

// Notification panel dropdown component
function NotifPanel({ notifications, onChange, onClose }) {
  const markAll = () => onChange(p => p.map(n => ({...n, read: true}))); // Mark all notifications as read
  const markOne = id => onChange(p => p.map(n => n.id === id ? {...n, read: true} : n)); // Mark a single notification as read by ID
  return ( // Render notification panel
    <div className="position-absolute end-0 shadow-lg border-0" style={{ top: 44, width: 340, background: "#fff", borderRadius: 12, zIndex: 200, overflow: "hidden" }}> 
      <div className="d-flex justify-content-between align-items-center px-3 py-2" style={{ borderBottom: `1px solid ${C.slate}` }}> 
        <span className="fw-bold" style={{ fontSize: 13, color: C.navyDeep }}>Notifications</span> 
        <button className="btn btn-sm btn-link text-decoration-none p-0 fw-semibold" style={{ color: C.teal, fontSize: 11 }} onClick={markAll}>Mark all read</button> 
      </div> 
      <div style={{ maxHeight: 310, overflowY: "auto" }}> 
        {notifications.length === 0 ? ( // If no notifications
          <div className="text-center py-4 text-muted" style={{ fontSize: 13 }}>No notifications</div> 
        ) : notifications.map(n => ( // Otherwise map over notifications
          <div key={n.id} onClick={() => markOne(n.id)}
            className="d-flex gap-2 px-3 py-2 align-items-start" style={{ cursor: "pointer", background: n.read ? "#fff" : C.amberSoft, borderBottom: `1px solid ${C.slate}` }}> 
            <span style={{ fontSize: 14, marginTop: 2 }}> 
              {n.type === "info" ? "ℹ️" : n.type === "warning" ? "⚠️" : n.type === "success" ? "✅" : "❗"} 
            </span> 
            <div className="flex-grow-1"> 
              <div style={{ fontSize: 12, color: C.navyDeep, lineHeight: 1.4 }}>{n.msg}</div> 
              <div style={{ fontSize: 10, color: C.gray, marginTop: 2 }}>{n.time}</div> 
            </div> 
            {!n.read && <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.amber, flexShrink: 0, marginTop: 4 }} />} 
          </div> 
        ))} 
      </div> 
    </div> 
  ); // End return
} // End NotifPanel component

// Single token row component for the queue display
function TokenRow({ token, pos, onStatus, isServing, counterColor, onGenerate }) {
  return ( // Render token card
    <div className={`card border-0 shadow-sm ${isServing ? '' : ''}`} style={{ borderRadius: 12, border: isServing ? `2px solid ${counterColor}` : "none", background: isServing ? `${counterColor}08` : "#fff" }}> 
      <div className="card-body d-flex align-items-center gap-3 py-3 px-3"> 
        <div className="d-flex align-items-center justify-content-center rounded-2 fw-bold flex-shrink-0" style={{ width: 38, height: 38, background: isServing ? counterColor : (token.status === "pending" ? C.navyLight : C.navyMid), color: "#fff", fontSize: 13 }}>{isServing ? "▶" : (token.status === "pending" ? "⏳" : pos)}</div> 
        <div className="flex-grow-1 min-w-0"> 
          <div className="d-flex align-items-center gap-2 flex-wrap"> 
            <span className="fw-bold" style={{ color: C.navyDeep, fontSize: 14 }}>{token.id}</span> 
            {token.priority && <span className="badge bg-danger" style={{ fontSize: 9 }}>⚑ PRIORITY</span>} 
          </div> 
          <div style={{ fontSize: 13, color: C.navyMid }}>{token.customer}</div> 
          {token.customer_email && <div className="text-muted" style={{ fontSize: 10 }}>{token.customer_email}</div>} 
          <div className="text-muted" style={{ fontSize: 11 }}>{token.time}{token.note ? ` · 📝 ${token.note}` : ""}</div> 
        </div> 
        <Badge status={token.status} /> 
        <div className="d-flex gap-1"> 
          {token.status === "pending" && <> 
            <button className="btn btn-sm fw-bold border-0" style={{ background: C.greenSoft, color: C.green, borderRadius: 8, fontSize: 11 }} onClick={() => onGenerate(token.token_id)}>Generate Token</button> 
            <button className="btn btn-sm fw-bold border-0" style={{ background: C.redSoft, color: C.red, borderRadius: 8, fontSize: 11 }} onClick={() => onStatus(token.id, "cancelled")}>Decline</button> 
          </>} 
          {token.status === "waiting" && <> 
            <button className="btn btn-sm fw-bold border-0" style={{ background: `${C.teal}20`, color: C.teal, borderRadius: 8, fontSize: 11 }} onClick={() => onStatus(token.id, "serving")}>Serve</button> 
            <button className="btn btn-sm fw-bold border-0" style={{ background: C.redSoft, color: C.red, borderRadius: 8, fontSize: 11 }} onClick={() => onStatus(token.id, "skipped")}>Skip</button> 
          </>} 
          {token.status === "serving" && <> 
            <button className="btn btn-sm fw-bold border-0" style={{ background: C.greenSoft, color: C.green, borderRadius: 8, fontSize: 11 }} onClick={() => onStatus(token.id, "completed")}>✓ Done</button> 
            <button className="btn btn-sm fw-bold border-0" style={{ background: C.redSoft, color: C.red, borderRadius: 8, fontSize: 11 }} onClick={() => onStatus(token.id, "skipped")}>Skip</button> 
          </>} 
        </div> 
      </div> 
    </div> 
  ); // End return
} // End TokenRow component

// Badge component displaying a colored status pill
function Badge({ status }) {
  const m = STATUS_META[status]; // Look up status metadata for this status
  if (!m) return null; // Return nothing if status is unknown
  return <span className="badge rounded-pill fw-bold" style={{ background: m.bg, color: m.color, fontSize: 10, padding: "4px 10px" }}>{m.label}</span>; // Rendered status badge pill
} // End Badge component
