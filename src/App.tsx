// src/App.tsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { Spinner } from "@heroui/react"; // Import Spinner

// Layouts
import DefaultLayout from "./defaultLayout";

// Pages
import Homepge from "./pages/homepage";
import SignUp from "./components/SignUp";
import Login from "./components/Login";
import Chat from "./pages/chatpage";
import ProfilePage from "./pages/profile/ProfilePage";
import FriendsPage from "./features/friends/FriendsPage";
import SettingsPage from "./pages/SettingsPage";
import NotificationsPage from "./pages/NotificationsPage"; // <-- Import new page

// Loading Component (Optional, but good practice)
const LoadingScreen = () => (
  <div className="flex justify-center items-center h-screen bg-base-100">
    <Spinner size="lg" color="primary" />
  </div>
);

function App() {
  // Assuming useAuth provides a 'loading' state. If not, session being 'undefined'
  // might indicate loading, but an explicit 'loading' state is better.
  const { session, loading } = useAuth(); 

  // Show a loading screen while session status is being determined
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Homepge />} />
        
        {/* Auth Routes: Redirect if logged in */}
        <Route
          path="login"
          element={session ? <Navigate to="/chat" /> : <Login />}
        />
        <Route
          path="signup"
          element={session ? <Navigate to="/chat" /> : <SignUp />}
        />

        {/* Protected Routes: Require login, use DefaultLayout */}
        <Route
          element={session ? <DefaultLayout /> : <Navigate to="/login" />}
        >
          <Route path="chat" element={<Chat />} />
          <Route path="settings" element={<SettingsPage />} /> {/* Corrected 'sitting' to 'settings' */}
          <Route path="profile" element={<ProfilePage />} />
          <Route path="friends" element={<FriendsPage />} /> {/* Added FriendsPage route */}
          <Route path="notifications" element={<NotificationsPage />} /> {/* <-- Added NotificationsPage route */}
          
          {/* Add a default protected route, e.g., redirect chat */}
          <Route index element={<Navigate to="/chat" />} /> 
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" />} /> 
      </Routes>
    </Router>
  );
}

export default App;