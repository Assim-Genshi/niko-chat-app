// src/App.tsx
import React from 'react'; // For JSX
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext"; // This will now work
import { Spinner } from "@heroui/react";

// Layouts
import DefaultLayout from "./defaultLayout";

// Pages (ensure these components exist and are correctly imported)
import HomePage from "./pages/homepage"; // Corrected typo from Homepge
import SignUp from "./components/SignUp";
import Login from "./components/Login";
import ChatPage from "./pages/chatpage"; // Your chat page component
import ProfilePage from "./pages/profile/ProfilePage";
import FriendsPage from "./features/friends/FriendsPage";
import SettingsPage from "./pages/SettingsPage";
import NotificationsPage from "./pages/NotificationsPage";

const LoadingScreen = () => (
  <div className="flex justify-center items-center h-screen bg-base-100">
    <Spinner size="lg" color="primary" />
  </div>
);

function App() {
  // useAuth() is now correctly called within the AuthProvider context (from providers.tsx)
  const { session, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    // The <Router> (BrowserRouter) is now in main.tsx, wrapping everything
    // The other providers are also in main.tsx (via Providers.tsx), wrapping App
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />

      {/* Auth Routes: Redirect if logged in */}
      <Route
        path="login"
        element={session ? <Navigate to="/chat" replace /> : <Login />}
      />
      <Route
        path="signup"
        element={session ? <Navigate to="/chat" replace /> : <SignUp />}
      />

      {/* Protected Routes: Require login, use DefaultLayout */}
      <Route
        path="/" // Layout route will match any nested path if not more specific
        element={session ? <DefaultLayout /> : <Navigate to="/login" replace />}
      >
        {/* ChatPage will render ChatLayout, which uses useParams for :conversationId */}
        <Route path="chat" element={<ChatPage />} />
        <Route path="chat/:conversationId" element={<ChatPage />} />

        <Route path="settings" element={<SettingsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="friends" element={<FriendsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />

        {/* Default route when logged in and at "/" inside DefaultLayout */}
        <Route index element={<Navigate to="/chat" replace />} />
      </Route>

      {/* Catch-all for any other paths */}
      <Route path="*" element={<Navigate to={session ? "/chat" : "/login"} replace />} />
    </Routes>
  );
}

export default App;