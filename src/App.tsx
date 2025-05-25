// src/App.tsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";

// Pages
import Homepge from "./pages/homepage";
import SignUp from "./components/SignUp";
import Login from "./components/Login";
import Chat from "./pages/chatpage";
import DefaultLayout from "./defaultLayout";
import ProfilePage from "./pages/profile/ProfilePage";

function App() {
  const { session } = useAuth(); // Get auth session from context

  return (
    <Router>
      <Routes>
        {/* Public Routes (available to everyone) */}
        <Route path="/" element={<Homepge />} />
        
        {/* Login/Signup Routes with Auth Check */}
        <Route
          path="login"
          element={session ? <Navigate to="/chat" /> : <Login />} // Redirect if authenticated
        />
        <Route
          path="signup"
          element={session ? <Navigate to="/chat" /> : <SignUp />} // Redirect if authenticated
        />

        {/* Protected Routes (require authentication) */}
        <Route
          element={session ? <DefaultLayout /> : <Navigate to="/login" />} // Redirect to login if not authenticated
        >
          <Route path="chat" element={<Chat />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* Catch-all for unknown routes */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
