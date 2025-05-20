// src/App.tsx
import {
  BrowserRouter as Router,
  Routes,
  Route
} from "react-router-dom";
import Homepge from "./pages/homepage";
import SignUp from "./components/SignUp";
import Login from "./components/Login";
import Chat from "./pages/chatpage";

function App() {
  return (
      <Router>
          <Routes>
              <Route
                  path="/"
                  element={<Homepge />}
              />
              <Route
                  path="/signup"
                  element={<SignUp />}
              />
              <Route
                  path="/login"
                  element={<Login />}
              />
              <Route
                  path="/chat"
                  element={<Chat />}
              />
          </Routes>
      </Router>
  );
}

export default App;

