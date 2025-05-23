// src/App.tsx
import {
  BrowserRouter as Router,
  Routes,
  Route
} from "react-router-dom";

// --------- Pages ----------
import Homepge from "./pages/homepage";
import SignUp from "./components/SignUp";
import Login from "./components/Login";
import Chat from "./pages/chatpage";
import DefaultLayout from "./defaultLayout";
import ProfilePage from "./pages/profile/ProfilePage";

function App() {
  return (
    <Route>
        {/* no h-nav */}
            <Route path="/" element={<Homepge />} />
            <Route path="signup" element={<SignUp />} />
            <Route path="login" element={<Login />} />

        {/* h-nav */}
        <Route element={<DefaultLayout />}>
            <Route path="chat" element={<Chat />} />
            <Route path="profile" element={<ProfilePage />} />
        </Route>
    </Route>
  );
}

export default App;



