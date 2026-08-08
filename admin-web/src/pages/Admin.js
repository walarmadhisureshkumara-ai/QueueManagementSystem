import React, { useEffect, useState } from "react"; // Import React core and hooks (useEffect, useState)
import { useNavigate } from "react-router-dom"; // Import navigation hook for programmatic routing
import { io } from "socket.io-client"; // Import socket.io client for real-time WebSocket communication
import { getStaffAPI, addStaffAPI, deleteStaffAPI, getCountersAPI,
         addCounterAPI, assignCounterAPI, updateCounterAPI,
         getReportsAPI, updateSettingsAPI } from "../api";

// Connect to your backend node server.
// Note: If testing from a real physical mobile device, replace 'localhost' with your local IPv4 address (e.g. 'http://192.168.56.1:3000')
const socket = io("http://localhost:3000"); // Create a socket.io connection to the backend server at port 3000

// ── DESIGN TOKENS ──────────────────────────────────────────
const T = { // Design tokens object containing all colors and theme values
  primary:      "#7C3AED",          // violet accent
  primaryDark:  "#5B21B6", // Darker violet for hover/states
  primaryLight: "#8B5CF6", // Lighter violet for highlights
  primaryMuted: "#EDE9FE",          // soft violet tint

  sidebarBg:    "#1E1B5E",          // deep indigo
  sidebarDeep:  "#14114A", // Deeper indigo for sidebar gradient

  emerald:      "#059669", // Green for success states
  emeraldLight: "#D1FAE5", // Light green background for badges
  gold:         "#D97706", // Amber/gold for warnings
  goldLight:    "#FEF3C7", // Light amber background for badges
  rose:         "#E11D48", // Rose/red for danger states
  roseMuted:    "#FFE4E6", // Light rose background for badges

  ink:          "#1E1B4B",          // indigo-tinted ink
  inkMid:       "#3730A3",          // medium indigo text
  inkSoft:      "#6B7280", // Soft gray for secondary text
  border:       "#DDD6FE",          // violet-tinted border
  bg:           "#F5F3FF",          // lavender background
  surface:      "#FFFFFF", // White card/panel background
  surfaceAlt:   "#F0EBFF",          // soft lavender surface
}; // Close design tokens object

const font = "'Inter', 'Segoe UI', system-ui, sans-serif"; // Default font stack for the application

const services = [ // Array of available banking service types
  "Cash Deposit", // Cash deposit service option
  "Withdrawal", // Withdrawal service option
  "Account Opening", // Account opening service option
  "Jewelry & Pawning", // Jewelry and pawning service option
  "Loans", // Loans service option
]; // Close services array

// ── MAIN COMPONENT ─────────────────────────────────────────
export default function AdminDashboard() { // Export the main admin dashboard component
  const navigate = useNavigate(); // Hook to navigate between routes programmatically
  const [page, setPage] = useState("dashboard"); // State: currently active page/tab (default: 'dashboard')

  const [staffList, setStaffList] = useState([]); // State: list of staff members fetched from backend
  const [counterList, setCounterList] = useState([]); // State: list of counters fetched from backend
  const [reports, setReports] = useState([]); // State: list of daily reports fetched from backend
  
  // Real-time notification data stack state
  const [liveNotifications, setLiveNotifications] = useState([]); // State: stack of real-time ticket notifications

  const [name, setName] = useState(""); // State: staff full name input field
  const [email, setEmail] = useState(""); // State: staff email input field
  const [phone, setPhone] = useState(""); // State: staff phone input field
  const [role, setRole] = useState("staff"); // State: staff role selector (default: 'staff')
  const [password, setPassword] = useState(""); // State: staff password input field

  const [counterId, setCounterId] = useState(""); // State: counter ID input for staff assignment
  const [status, setStatus] = useState("active"); // State: staff status selector (default: 'active')

  const [selectedCounter, setSelectedCounter] = useState(""); // State: selected counter in assignment dropdown
  const [selectedStaff, setSelectedStaff] = useState(""); // State: selected staff in assignment dropdown

  const [counterName, setCounterName] = useState(""); // State: counter name input for new counter
  const [location, setLocation] = useState(""); // State: counter location input
  const [description, setDescription] = useState(""); // State: counter description input

  const [maxQueue, setMaxQueue] = useState(""); // State: max queue size setting input
  const [openTime, setOpenTime] = useState(""); // State: branch open time setting input
  const [closeTime, setCloseTime] = useState(""); // State: branch close time setting input
  const [clock, setClock] = useState(""); // State: live clock display string
  const [editCounter, setEditCounter] = useState(null); // State: counter ID being edited (null = none)

  // ---------------- LOAD DATA FUNCTIONS ----------------
  const loadStaff = async () => { // Async function to fetch staff list from backend
    try { // Begin try block for error handling
      const data = await getStaffAPI(); // Fetch staff list from API
      if (data.success) setStaffList(data.data); // If successful, update staff list state with response data
    } catch (err) { // Catch any network or server errors
      console.error("Error loading staff:", err); // Log error to console for debugging
    } // Close catch block
  }; // Close loadStaff function
  
  const loadCounters = async () => { // Async function to fetch counter list from backend
    try { // Begin try block for error handling
      const data = await getCountersAPI(); // Fetch counter list from API
      if (data.success) setCounterList(data.data); // If successful, update counter list state with response data
    } catch (err) { // Catch any network or server errors
      console.error("Error loading counters:", err); // Log error to console for debugging
    } // Close catch block
  }; // Close loadCounters function

  const loadReports = async () => { // Async function to fetch reports from backend
    try {  // Begin try block for error handling
      const d = await getReportsAPI();  // Fetch reports from API
      if (d.success) setReports(d.data);  // If successful, update reports state with response data
    } catch {  // Catch any errors (no variable needed)
      setReports([]);  // On failure, set empty reports array
    } // Close catch block
  }; // Close loadReports function

  // ---------------- LIFECYCLE EFFECT ----------------
  useEffect(() => { // Run side effects on component mount
    // Initial fetch
    loadStaff(); // Fetch staff list on mount
    loadCounters(); // Fetch counter list on mount

    // Setup real-time incoming websocket notification listener
    socket.on("NEW_STAFF_NOTIFICATION", (data) => { // Listen for new staff notifications via socket
      setLiveNotifications((prev) => [data, ...prev]); // Prepend new notification to the live list

      // Sound notification alert ring
      try { // Begin try block for audio playback
        const alertAudio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav"); // Create audio element for notification sound
        alertAudio.play(); // Play the notification sound
      } catch (e) { // Catch audio playback errors
        console.log("Audio notification blocked until user profile interaction."); // Log that audio was blocked
      } // Close catch block
    }); // Close socket.on listener

    // Clock Interval
    const tick = () => // Define tick function to update clock
      setClock(new Date().toLocaleTimeString("en-LK", { hour: "2-digit", minute: "2-digit" })); // Update clock state with formatted local time
    tick(); // Run tick immediately to set initial clock value
    const id = setInterval(tick, 1000); // Set interval to update clock every second

    return () => { // Cleanup function on component unmount
      clearInterval(id); // Clear the clock interval
      socket.off("NEW_STAFF_NOTIFICATION"); // Remove the socket notification listener
    }; // Close cleanup function
  }, []); // Empty dependency array: run effect only once on mount

  // Sync data dynamically based on active nav tab switching
  useEffect(() => { // Run side effects when page changes
    if (page === "staff")    loadStaff(); // Load staff data when navigating to staff page
    if (page === "reports")  loadReports(); // Load reports when navigating to reports page
    if (page === "counters") loadCounters(); // Load counters when navigating to counters page
  }, [page]); // Re-run effect whenever page state changes

  // ---------------- ACTIONS ────────────────
  const addStaff = async () => { // Async function to add a new staff member
    if (!name || !email || !phone || !password) { // Validate that all required fields are filled
      alert("Please fill all fields"); // Show alert if any field is empty
      return; // Exit function early
    } // Close validation if block
    if (name.trim().length < 2) { alert("Name must be at least 2 characters"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { alert("Please enter a valid email"); return; }
    if (phone.length < 10) { alert("Phone must be at least 10 digits"); return; }
    if (password.length < 4) { alert("Password must be at least 4 characters"); return; }

    try { // Begin try block for API call
      const d = await addStaffAPI({ // Send POST request to add staff endpoint
        name, // Include staff name
        email, // Include staff email
        phone, // Include staff phone
        role, // Include staff role
        password, // Include staff password
        counter_id: counterId, // Include assigned counter ID
        status, // Include staff status
      });
      alert(d.message); // Show server response message to user

      setName(""); // Reset name input to empty
      setEmail(""); // Reset email input to empty
      setPhone(""); // Reset phone input to empty
      setPassword(""); // Reset password input to empty
      setRole("staff"); // Reset role selector to default
      setCounterId(""); // Reset counter ID input to empty
      setStatus("active"); // Reset status selector to default

      loadStaff(); // Refresh staff list to show new entry
    } catch (err) { // Catch any network or server errors
      alert("Server error"); // Show generic server error alert
      console.log(err); // Log error details to console
    } // Close catch block
  }; // Close addStaff function

  const deleteStaff = async (id) => { // Async function to delete a staff member by ID
    if (!window.confirm("Delete this staff member?")) return; // Confirm deletion with user, exit if cancelled
    try {  // Begin try block for API call
      const d = await deleteStaffAPI(id);  // Send DELETE request to staff endpoint
      alert(d.message);  // Show server response message
      loadStaff();  // Refresh staff list after deletion
    } catch {  // Catch any errors
      alert("Server error");  // Show generic server error alert
    } // Close catch block
  }; // Close deleteStaff function

  const updateCounter = async (counter) => { // Async function to update a counter's assignment
    try { // Begin try block for API call
      const d = await updateCounterAPI(counter.counter_id, { staff_name: counter.staff_name, service_type: counter.service_type });
      alert(d.message);  // Show server response message
      setEditCounter(null);  // Exit edit mode for the counter
      loadCounters(); // Refresh counter list to reflect changes
    } catch {  // Catch any errors
      alert("Server error");  // Show generic server error alert
    } // Close catch block
  }; // Close updateCounter function

  const saveSettings = async () => { // Async function to save system settings
    if (!maxQueue || isNaN(maxQueue) || parseInt(maxQueue) < 1) { alert("Enter a valid max queue size"); return; }
    try { // Begin try block for API call
      const d = await updateSettingsAPI({ max_queue: maxQueue, open_time: openTime, close_time: closeTime });
      alert(d.message); // Show server response message
    } catch {  // Catch any errors
      alert("Server error");  // Show generic server error alert
    } // Close catch block
  }; // Close saveSettings function

  const addCounter = async () => { // Async function to add a new counter
    if (!counterName.trim()) { alert("Counter name is required"); return; }
    const data = await addCounterAPI({ // Send POST request to add counter endpoint
      counter_name: counterName, // Include counter name
      location, // Include counter location
      description, // Include counter description
      status, // Include counter status
    });
    alert(data.message); // Show server response message

    setCounterName(""); // Reset counter name input to empty
    setLocation(""); // Reset location input to empty
    setDescription(""); // Reset description input to empty

    loadCounters(); // Refresh counter list to show new entry
  }; // Close addCounter function

  const assignCounter = async () => { // Async function to assign staff to a counter
    if (!selectedCounter) { alert("Please select a counter"); return; }
    if (!selectedStaff) { alert("Please select a staff member"); return; }
    const data = await assignCounterAPI(parseInt(selectedCounter), parseInt(selectedStaff));
    alert(data.message); // Show server response message

    loadCounters(); // Refresh counter list to reflect assignment
  }; // Close assignCounter function
  
  const navItems = [ // Array defining sidebar navigation structure
    { section: "Overview",   items: [{ icon: "⊞", label: "Dashboard",    key: "dashboard" }] }, // Overview section with Dashboard link
    { section: "Management", items: [ // Management section with sub-items
      { icon: "👥", label: "Manage Staff", key: "staff" }, // Staff management navigation item
      { icon: "🏦", label: "Counters",     key: "counters" }, // Counters management navigation item
    ]}, // Close Management section
    { section: "Analytics",  items: [ // Analytics section with sub-items
      { icon: "📊", label: "Reports",  key: "reports" }, // Reports navigation item
      { icon: "⚙",  label: "Settings", key: "settings" }, // Settings navigation item
    ]}, // Close Analytics section
  ]; // Close navItems array

  // ── SINGLE STRUCTURAL RETURN ──
  return ( // Render the entire admin dashboard UI
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: font, background: T.bg }}> 

      
      <aside style={S.sidebar}> 
        <div style={S.logoWrap}> 
          <div style={S.logoBadge}>BOC</div> 
          <div> 
            <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", letterSpacing: ".3px" }}>Bank of Ceylon</p> 
            <p style={{ fontSize: 11, color: "rgba(255,255,255,.5)", marginTop: 2 }}>Admin Portal</p> 
          </div> 
        </div> 

        <nav style={{ flex: 1, padding: "8px 0" }}> 
          {navItems.map(({ section, items }) => ( // Iterate over navigation sections
            <div key={section}> 
              <p style={S.navLabel}>{section}</p> 
              {items.map(({ icon, label, key }) => ( // Iterate over items in the section
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
          <div style={{ flex: 1 }}> 
            <p style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>Admin</p> 
            <p style={{ fontSize: 11, color: "rgba(255,255,255,.5)" }}>admin@boc.lk</p> 
          </div> 
          <button onClick={() => navigate('/')} style={{ // Logout button that navigates to login page
            background: "rgba(255,255,255,.1)", border: "none", borderRadius: 8, // Transparent background, no border, rounded corners
            width: 32, height: 32, color: "#fff", cursor: "pointer", fontSize: 14, // Fixed size, white text, pointer cursor
            display: "flex", alignItems: "center", justifyContent: "center", // Flexbox centering for icon
          }} title="Back to Login"> 
            <i className="bi bi-box-arrow-left" /> 
          </button> 
        </div> 
      </aside> 

      
      <main style={{ flex: 1, overflowY: "auto" }}> 

        
        <header style={S.topbar}> 
          <div> 
            <h1 style={S.pageTitle}> 
              {page === "dashboard" && "Dashboard"}{/* Show dashboard if active */}
              {page === "staff"     && "Manage Staff"}{/* Show Manage Staff if active */}
              {page === "counters"  && "Counters"}{/* Show Counters if active */}
              {page === "reports"   && "Reports"}{/* Show Reports if active */}
              {page === "settings"  && "Settings"}{/* Show Settings if active */}
            </h1> 
            <p style={S.pageSub}>Bank of Ceylon — Token Queue System</p> 
          </div> 
          <div style={S.clockPill}>{clock}</div> 
        </header> 

        <div style={{ padding: "0 28px 32px" }}> 

          
          {liveNotifications.length > 0 && ( // Conditionally render notification panel if there are alerts
            <div style={S.notificationPanel}> 
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}> 
                <p style={{ ...S.panelTitle, margin: 0, color: T.gold }}>🔔 Real-time Terminal Broadcasts</p> 
                <button onClick={() => setLiveNotifications([])} style={S.clearNotifBtn}>Clear Logs</button> 
              </div> 
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}> 
                {liveNotifications.map((notif, index) => ( // Iterate over live notifications
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

          
          {page === "dashboard" && ( // Conditionally render dashboard view
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
                  {[ // Array of quick action buttons
                    { label: "➕ Add Staff",     key: "staff",    primary: true }, // Add Staff button config
                    { label: "🏦 Manage Counters", key: "counters", primary: false }, // Manage Counters button config
                    { label: "📊 View Reports",    key: "reports",  primary: false }, // View Reports button config
                    { label: "⚙ Settings",         key: "settings", primary: false }, // Settings button config
                  ].map(({ label, key, primary }) => ( // Iterate over button configs
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

          
          {page === "staff" && ( // Conditionally render staff management view
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
                    {staffList.length === 0 ? ( // Check if staff list is empty
                      <tr><td colSpan={4} style={S.emptyCell}>No staff found. Add your first staff member above.</td></tr> 
                    ) : ( // Otherwise render staff rows
                      staffList.map((st) => ( // Iterate over staff members
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

          
          {page === "counters" && ( // Conditionally render counters management view
            <> 
              <div style={S.panel}> 
                <p style={S.panelTitle}>🔗 Assign Staff to Counter</p> 
                <div style={{ display: "flex", gap: 15, alignItems: "flex-end" }}> 
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}> 
                    <label style={S.fieldLabel}>Counter</label> 
                    <select style={S.select} value={selectedCounter} onChange={(e) => setSelectedCounter(e.target.value)}> 
                      <option value="">Select Counter</option> 
                      {counterList.map((c) => ( // Iterate over counters for options
                        <option key={c.counter_id} value={c.counter_id}>{c.counter_name}</option> 
                      ))} 
                    </select> 
                  </div> 
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}> 
                    <label style={S.fieldLabel}>Staff Member</label> 
                    <select style={S.select} value={selectedStaff} onChange={(e) => setSelectedStaff(e.target.value)}> 
                      <option value="">Select Staff</option> 
                      {staffList.map((s) => ( // Iterate over staff for options
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
                    {counterList.map((c) => { // Iterate over counters
                      const statusColor = // Determine status color scheme
                        c.status === "Active" || c.status === "active" ? { bg: T.emeraldLight, fg: T.emerald } : // Green for active
                        c.status === "Break"  ? { bg: T.goldLight,    fg: T.gold    } : // Gold for break
                                                { bg: T.roseMuted,    fg: T.rose    }; // Rose for inactive/other
                      return ( // Return the table row
                        <tr key={c.counter_id} style={S.tableRow}> 
                          <Td><span style={{ fontWeight: 700, fontSize: 14, color: T.ink }}>{c.counter_name}</span></Td> 
                          <Td> 
                            {editCounter === c.counter_id ? ( // If this counter is in edit mode
                              <select defaultValue={c.service_type} style={S.select}
                                onChange={(e) => setCounterList(counterList.map(x => x.counter_id === c.counter_id ? { ...x, service_type: e.target.value } : x))}> 
                                {services.map((sv) => <option key={sv}>{sv}</option>)} 
                              </select> 
                            ) : c.service_type || "General"}
                          </Td> 
                          <Td> 
                            {editCounter === c.counter_id ? ( // If this counter is in edit mode
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
                            {editCounter === c.counter_id ? ( // If in edit mode
                              <div style={{ display: "flex", gap: 6 }}> 
                                <button style={S.btnPrimary} onClick={() => updateCounter(c)}>💾 Save</button> 
                                <button style={S.btnSecondary} onClick={() => setEditCounter(null)}>Cancel</button> 
                              </div> 
                            ) : ( // If not editing
                              <button style={S.btnEdit} onClick={() => setEditCounter(c.counter_id)}>✏ Edit</button> 
                            )} 
                          </Td> 
                        </tr> 
                      ); // Close return
                    })} 
                  </tbody> 
                </table> 
              </div> 
            </> 
          )} 

          
          {page === "reports" && ( // Conditionally render reports view
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
                    {reports.length === 0 ? ( // Check if reports list is empty
                      <tr><td colSpan={4} style={S.emptyCell}>No report data available yet.</td></tr> 
                    ) : ( // Otherwise render report rows
                      reports.map((r, i) => ( // Iterate over reports
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

          
          {page === "settings" && ( // Conditionally render settings view
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
  ); // Close return statement
} // Close AdminDashboard component

// ── HELPER COMPONENTS ──────────────────────────────────────
function StatCard({ icon, label, value, sub, accent, bg }) { // Stat card component for displaying metric tiles
  return ( // Render the stat card
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: "20px 22px", position: "relative", overflow: "hidden" }}> 
      <div style={{ position: "absolute", top: 0, right: 0, width: 80, height: 80, background: bg, borderRadius: "0 16px 0 100%" }} /> 
      <div style={{ fontSize: 22, marginBottom: 12 }}>{icon}</div> 
      <p style={{ fontSize: 13, color: T.inkSoft, marginBottom: 6 }}>{label}</p> 
      <p style={{ fontSize: 32, fontWeight: 700, color: T.ink, lineHeight: 1, marginBottom: 6 }}>{value}</p> 
      <p style={{ fontSize: 12, color: accent, fontWeight: 500 }}>{sub}</p> 
    </div> 
  ); // Close return
} // Close StatCard component

function Field({ label, value, onChange, placeholder, type = "text" }) { // Form field component with label and input
  return ( // Render the field
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}> 
      <label style={S.fieldLabel}>{label}</label> 
      <input type={type} value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)} style={S.input} /> 
    </div> 
  ); // Close return
} // Close Field component

// Header cell configuration helper
function Th({ children }) { // Table header cell component
  return ( // Render the header cell
    <th style={{ textAlign: "left", padding: "12px 16px", fontSize: 12, fontWeight: 600, color: T.inkSoft, letterSpacing: ".4px", textTransform: "uppercase" }}> 
      {children} 
    </th> 
  ); // Close return
} // Close Th component

// Data cell configuration helper
function Td({ children }) { // Table data cell component
  return ( // Render the data cell
    <td style={{ padding: "14px 16px", borderBottom: `1px solid ${T.border}`, fontSize: 14, color: T.inkMid, verticalAlign: "middle" }}> 
      {children} 
    </td> 
  ); // Close return
} // Close Td component

// ── STYLES ─────────────────────────────────────────────────
const S = { // Styles object containing all component style definitions
  sidebar: { // Sidebar container styles
    width: 240, // Fixed sidebar width in pixels
    background: T.sidebarBg, // Deep indigo background
    backgroundImage: `linear-gradient(160deg, ${T.sidebarDeep} 0%, ${T.sidebarBg} 55%, #2D2A80 100%)`, // Gradient overlay for depth effect
    display: "flex", // Flexbox layout
    flexDirection: "column", // Stack children vertically
    boxShadow: "4px 0 24px rgba(30,27,94,.35)", // Right-side shadow for depth
    position: "sticky", // Stick to viewport on scroll
    top: 0, // Stick to top of viewport
    height: "100vh", // Full viewport height
    flexShrink: 0, // Prevent flex shrink
  }, // Close sidebar
  logoWrap: { // Logo wrapper styles
    padding: "22px 18px", // Vertical and horizontal padding
    borderBottom: "1px solid rgba(255,255,255,.1)", // Subtle bottom border
    display: "flex", // Flexbox layout
    alignItems: "center", // Vertically center children
    gap: 12, // Gap between logo and text
  }, // Close logoWrap
  logoBadge: { // Logo badge styles
    width: 44, // Badge width
    height: 44, // Badge height
    borderRadius: 12, // Rounded corners
    background: T.primary, // Violet background
    border: "1px solid rgba(255,255,255,.2)", // Semi-transparent white border
    display: "flex", // Flexbox layout
    alignItems: "center", // Vertically center content
    justifyContent: "center", // Horizontally center content
    color: "white", // White text color
    fontWeight: 800, // Extra bold text
    fontSize: 13, // Font size
    letterSpacing: ".5px", // Letter spacing for monogram
    flexShrink: 0, // Prevent flex shrink
    boxShadow: `0 2px 12px rgba(124,58,237,.6)`, // Violet glow shadow
  }, // Close logoBadge
  navLabel: { // Navigation section label styles
    padding: "16px 18px 5px", // Padding around label
    fontSize: 10, // Small font size
    color: "rgba(255,255,255,.35)", // Very faint white
    textTransform: "uppercase", // Uppercase text
    letterSpacing: "1px", // Wide letter spacing
    fontWeight: 600, // Semi-bold
  }, // Close navLabel
  navItem: { // Navigation item base styles
    display: "flex", // Flexbox layout
    alignItems: "center", // Vertically center children
    gap: 10, // Gap between icon and label
    padding: "10px 18px", // Padding around item
    margin: "2px 10px", // Vertical and horizontal margin
    borderRadius: 10, // Rounded corners
    cursor: "pointer", // Pointer cursor on hover
    fontSize: 13, // Font size
    fontWeight: 500, // Medium weight
    color: "rgba(255,255,255,.6)", // Semi-transparent white
    position: "relative", // For positioning active dot
  }, // Close navItem
  navItemActive: { // Active navigation item styles
    background: "rgba(124,58,237,.4)", // Semi-transparent violet background
    color: "white", // White text
    fontWeight: 600, // Semi-bold
    boxShadow: "inset 0 0 0 1px rgba(167,139,250,.3)", // Inner border glow
  }, // Close navItemActive
  navDot: { // Active indicator dot styles
    position: "absolute", // Absolute positioning
    right: 12, // Positioned to the right
    width: 6, // Dot width
    height: 6, // Dot height
    borderRadius: "50%", // Circular shape
    background: T.primaryLight, // Light violet color
    boxShadow: `0 0 6px ${T.primaryLight}`, // Glow effect matching color
  }, // Close navDot
  sidebarFooter: { // Sidebar footer styles
    padding: "14px 18px", // Padding around footer
    borderTop: "1px solid rgba(255,255,255,.1)", // Subtle top border
    display: "flex", // Flexbox layout
    alignItems: "center", // Vertically center children
    gap: 10, // Gap between avatar and text
  }, // Close sidebarFooter
  adminAvatar: { // Admin avatar styles
    width: 34, // Avatar width
    height: 34, // Avatar height
    borderRadius: 10, // Rounded corners
    background: "rgba(124,58,237,.5)", // Semi-transparent violet
    border: "1px solid rgba(167,139,250,.4)", // Light violet border
    display: "flex", // Flexbox layout
    alignItems: "center", // Vertically center initials
    justifyContent: "center", // Horizontally center initials
    color: "white", // White text
    fontSize: 12, // Font size
    fontWeight: 700, // Bold initials
    flexShrink: 0, // Prevent flex shrink
  }, // Close adminAvatar
  topbar: { // Top header bar styles
    display: "flex", // Flexbox layout
    justifyContent: "space-between", // Space between title and clock
    alignItems: "flex-start", // Align to top
    padding: "24px 28px 20px", // Padding around bar
    background: T.surface, // White background
    borderBottom: `1px solid ${T.border}`, // Bottom border
    marginBottom: 28, // Bottom margin
  }, // Close topbar
  pageTitle: { // Page title heading styles
    fontSize: 22, // Title font size
    fontWeight: 700, // Bold weight
    color: T.ink, // Dark ink color
    marginBottom: 4, // Small bottom margin
  }, // Close pageTitle
  pageSub: { // Page subtitle styles
    fontSize: 13, // Subtitle font size
    color: T.inkSoft, // Soft gray color
  }, // Close pageSub
  clockPill: { // Live clock display styles
    background: T.surfaceAlt, // Light lavender background
    border: `1px solid ${T.border}`, // Violet-tinted border
    borderRadius: 8, // Rounded corners
    padding: "6px 16px", // Padding inside pill
    fontSize: 14, // Font size
    fontWeight: 600, // Semi-bold
    color: T.primary, // Violet text color
    fontVariantNumeric: "tabular-nums", // Monospaced numbers for clock stability
  }, // Close clockPill
  heroBanner: { // Hero welcome banner styles
    background: T.sidebarBg, // Deep indigo background
    backgroundImage: `linear-gradient(120deg, ${T.sidebarDeep} 0%, ${T.sidebarBg} 50%, ${T.primary} 130%)`, // Gradient with violet accent
    borderRadius: 16, // Rounded corners
    padding: "28px 32px", // Padding inside banner
    color: "white", // White text
    display: "flex", // Flexbox layout
    justifyContent: "space-between", // Space between text and stats
    alignItems: "center", // Vertically center content
    marginBottom: 24, // Bottom margin
    position: "relative", // For decorative orbs positioning
    overflow: "hidden", // Clip decorative elements
    boxShadow: `0 6px 28px rgba(30,27,94,.35)`, // Shadow for depth
  }, // Close heroBanner
  heroBannerOrb1: { // First decorative orb styles
    position: "absolute", // Absolute positioning
    right: -30, // Offset to the right
    top: -30, // Offset upward
    width: 180, // Large orb size
    height: 180, // Large orb size
    borderRadius: "50%", // Circular shape
    background: "rgba(124,58,237,.25)", // Semi-transparent violet
  }, // Close heroBannerOrb1
  heroBannerOrb2: { // Second decorative orb styles
    position: "absolute", // Absolute positioning
    right: 80, // Positioned left of orb1
    bottom: -50, // Offset downward
    width: 140, // Medium orb size
    height: 140, // Medium orb size
    borderRadius: "50%", // Circular shape
    background: "rgba(167,139,250,.15)", // Semi-transparent light violet
  }, // Close heroBannerOrb2
  heroStats: { // Hero stats section styles
    display: "flex", // Flexbox layout
    gap: 32, // Large gap between stat items
    alignItems: "center", // Vertically center
    background: "rgba(0,0,0,.2)", // Semi-transparent black overlay
    border: "1px solid rgba(255,255,255,.12)", // Subtle white border
    borderRadius: 12, // Rounded corners
    padding: "16px 28px", // Padding inside
    position: "relative", // Stacking context
  }, // Close heroStats
  heroStatItem: { // Individual stat item styles
    display: "flex", // Flexbox layout
    flexDirection: "column", // Stack value above label
    alignItems: "center", // Center align
    gap: 2, // Small gap
  }, // Close heroStatItem
  cardGrid: { // Stat card grid layout styles
    display: "grid", // CSS grid layout
    gridTemplateColumns: "repeat(4, 1fr)", // Four equal columns
    gap: 16, // Gap between cards
    marginBottom: 24, // Bottom margin
  }, // Close cardGrid
  panel: { // Generic panel card styles
    background: T.surface, // White background
    border: `1px solid ${T.border}`, // Violet-tinted border
    borderRadius: 16, // Rounded corners
    padding: "22px 24px", // Padding inside
    marginBottom: 24, // Bottom margin
    boxShadow: "0 1px 6px rgba(124,58,237,.06)", // Subtle violet shadow
  }, // Close panel
  panelTitle: { // Panel title styles
    fontSize: 16, // Title font size
    fontWeight: 700, // Bold weight
    color: T.ink, // Dark ink color
    marginBottom: 18, // Bottom margin
  }, // Close panelTitle
  formGrid: { // Two-column form grid styles
    display: "grid", // CSS grid layout
    gridTemplateColumns: "1fr 1fr", // Two equal columns
    gap: 16, // Gap between fields
    marginBottom: 18, // Bottom margin
  }, // Close formGrid
  fieldLabel: { // Form field label styles
    fontSize: 12, // Small label font
    fontWeight: 600, // Semi-bold
    color: T.inkSoft, // Soft gray color
    letterSpacing: ".2px", // Slight letter spacing
  }, // Close fieldLabel
  input: { // Text input styles
    padding: "10px 12px", // Padding inside input
    border: `1.5px solid ${T.border}`, // Violet-tinted border
    borderRadius: 10, // Rounded corners
    fontSize: 14, // Font size
    color: T.ink, // Dark text color
    background: T.surface, // White background
    outline: "none", // Remove default outline
    fontFamily: font, // Use app font family
  }, // Close input
  select: { // Dropdown select styles
    padding: "10px 12px", // Padding inside select
    border: `1.5px solid ${T.border}`, // Violet-tinted border
    borderRadius: 10, // Rounded corners
    fontSize: 14, // Font size
    color: T.ink, // Dark text color
    background: T.surface, // White background
    fontFamily: font, // Use app font family
    width: "100%", // Full width
  }, // Close select
  table: { // Table styles
    width: "100%", // Full width
    borderCollapse: "collapse", // Collapse borders
    borderRadius: 10, // Rounded corners
    overflow: "hidden", // Clip overflow for rounded corners
  }, // Close table
  tableRow: { transition: "background .1s" }, // Table row with quick hover transition
  emptyCell: { // Empty table cell placeholder styles
    textAlign: "center", // Center text
    padding: 32, // Large padding
    color: T.inkSoft, // Soft gray text
    fontSize: 14, // Font size
  }, // Close emptyCell
  chip: { // Badge/chip styles
    display: "inline-block", // Inline block for wrapping
    padding: "3px 10px", // Small padding
    borderRadius: 20, // Fully rounded pill shape
    fontSize: 12, // Small font
    fontWeight: 600, // Semi-bold
  }, // Close chip
  countBadge: { // Count badge styles
    background: T.primaryMuted, // Soft violet background
    border: `1px solid ${T.border}`, // Violet-tinted border
    borderRadius: 20, // Fully rounded pill
    padding: "4px 14px", // Padding inside
    fontSize: 12, // Small font
    fontWeight: 600, // Semi-bold
    color: T.primary, // Violet text
  }, // Close countBadge
  btnPrimary: { // Primary button styles
    padding: "10px 20px", // Button padding
    border: "none", // No border
    borderRadius: 10, // Rounded corners
    cursor: "pointer", // Pointer cursor
    fontSize: 13, // Font size
    fontWeight: 600, // Semi-bold
    background: T.primary, // Violet background
    color: "white", // White text
    boxShadow: `0 2px 10px rgba(124,58,237,.4)`, // Violet glow shadow
    fontFamily: font, // Use app font
  }, // Close btnPrimary
  btnSecondary: { // Secondary button styles
    padding: "10px 20px", // Button padding
    border: `1.5px solid ${T.border}`, // Violet-tinted border
    borderRadius: 10, // Rounded corners
    cursor: "pointer", // Pointer cursor
    fontSize: 13, // Font size
    fontWeight: 600, // Semi-bold
    background: T.surface, // White background
    color: T.inkMid, // Medium indigo text
    fontFamily: font, // Use app font
  }, // Close btnSecondary
  btnDanger: { // Danger/destructive button styles
    padding: "6px 12px", // Small button padding
    background: T.roseMuted, // Light rose background
    color: T.rose, // Rose text
    border: "none", // No border
    borderRadius: 8, // Rounded corners
    cursor: "pointer", // Pointer cursor
    fontSize: 12, // Small font
    fontWeight: 600, // Semi-bold
    fontFamily: font, // Use app font
  }, // Close btnDanger
  btnEdit: { // Edit button styles
    padding: "6px 12px", // Small button padding
    background: T.primaryMuted, // Soft violet background
    color: T.primary, // Violet text
    border: "none", // No border
    borderRadius: 8, // Rounded corners
    cursor: "pointer", // Pointer cursor
    fontSize: 12, // Small font
    fontWeight: 600, // Semi-bold
    fontFamily: font, // Use app font
  }, // Close btnEdit
  
  // Real-time Notification Styles
  notificationPanel: { // Notification panel container styles
    background: T.surface, // White background
    border: `1px solid ${T.border}`, // Violet-tinted border
    borderTop: `4px solid ${T.gold}`, // Gold top accent border
    borderRadius: 16, // Rounded corners
    padding: "20px 24px", // Padding inside
    marginBottom: 24, // Bottom margin
    boxShadow: "0 10px 15px -3px rgba(217,119,6,0.1)", // Gold-tinted shadow
  }, // Close notificationPanel
  clearNotifBtn: { // Clear notifications button styles
    background: "none", // Transparent background
    border: "none", // No border
    color: T.inkSoft, // Soft gray text
    cursor: "pointer", // Pointer cursor
    fontSize: 12, // Small font
    fontWeight: 600, // Semi-bold
    textDecoration: "underline", // Underline for link appearance
    fontFamily: font, // Use app font
  }, // Close clearNotifBtn
  notificationCard: { // Individual notification card styles
    display: "flex", // Flexbox layout
    justifyContent: "space-between", // Space between content sides
    alignItems: "center", // Vertically center
    backgroundColor: T.bg, // Lavender background
    padding: "12px 18px", // Padding inside
    borderRadius: 10, // Rounded corners
    borderLeft: "5px solid", // Thick left border for color accent
    boxShadow: "0 1px 3px rgba(0,0,0,0.02)", // Subtle shadow
  }, // Close notificationCard
  notifCounterBadge: { // Counter badge inside notification styles
    backgroundColor: T.surface, // White background
    color: T.ink, // Dark text
    border: `1px solid ${T.border}`, // Violet-tinted border
    padding: "3px 10px", // Small padding
    borderRadius: 20, // Fully rounded pill
    fontSize: 12, // Small font
    fontWeight: 700, // Bold text
  } // Close notifCounterBadge
}; // Close styles object S
