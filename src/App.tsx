// src/App.tsx
import React from 'react'; // For JSX
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { Spinner } from "@heroui/react";

// Layouts
import DefaultLayout from "./defaultLayout";

// Pages
import HomePage from "./pages/homepage";
import SignUp from "./components/SignUp";
import Login from "./components/Login";
import ChatPage from "./pages/chatpage";
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
  const { session, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      {/* Public Route for HomePage - always accessible at "/" */}
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
      {/* This is now a "pathless" layout route. It provides the DefaultLayout
          for its children but doesn't claim a path itself (like "/").
          This allows the <Route path="/" element={<HomePage />} /> above to handle the root path.
      */}
      <Route
        element={session ? <DefaultLayout /> : <Navigate to="/login" replace />}
      >
        {/* Child routes will render inside DefaultLayout's <Outlet /> */}
        <Route path="chat" element={<ChatPage />} />
        <Route path="chat/:conversationId" element={<ChatPage />} />

        <Route path="settings" element={<SettingsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="friends" element={<FriendsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        
        {/*
          The original index route that redirected from "/" to "/chat"
          when inside the DefaultLayout (path="/") is no longer needed here because
          DefaultLayout no longer exclusively handles the "/" path for logged-in users.
          Navigation to "/chat" after login is handled by the redirects in the
          login/signup routes and the catch-all for logged-in users.
        */}
      </Route>

      {/* Catch-all for any other paths */}
      <Route path="*" element={<Navigate to={session ? "/chat" : "/login"} replace />} />
    </Routes>
  );
}

export default App;