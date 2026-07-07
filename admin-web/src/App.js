// Import BrowserRouter, Routes, and Route from react-router-dom package
// These are used for page navigation in React
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Import Login component from pages folder
import Login from "./pages/Login";

// Import AdminDashboard component
import AdminDashboard from "./pages/Admin";

// Import StaffDashboard component
import StaffDashboard from "./pages/staff";

// Main App component
function App() {

  // Return UI
  return (

    // BrowserRouter enables routing/navigation in the app
    <BrowserRouter>

      {/* Routes container holds all Route paths */}
      <Routes>

        {/* Route for Login page */}
        {/* When URL path is "/" it shows Login component */}
        <Route path="/" element={<Login />} />

        {/* Route for Admin Dashboard */}
        {/* When URL path is "/admin" it shows AdminDashboard component */}
        <Route path="/admin" element={<AdminDashboard />} />

        {/* Route for Staff Dashboard */}
        {/* When URL path is "/staff" it shows StaffDashboard component */}
        <Route path="/staff" element={<StaffDashboard />} />

      </Routes>

    </BrowserRouter>
  );
}

// Export App component so it can be used in index.js
export default App;