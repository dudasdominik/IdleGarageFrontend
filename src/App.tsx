import { useState } from "react";
import { getToken } from "./api";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Game } from "./pages/Game";
import "./App.css";

export default function App() {
  const [mode, setMode] = useState<"login" | "register" | "game">(
    getToken() ? "game" : "login"
  );

  if (mode === "game") return <Game onLogout={() => setMode("login")} />;

  return (
    <div>
      {mode === "login" ? (
        <>
          <Login onDone={() => setMode("game")} />
          <div style={{ textAlign: "center", fontFamily: "system-ui" }}>
            <button onClick={() => setMode("register")}>Go to Register</button>
          </div>
        </>
      ) : (
        <>
          <Register onDone={() => setMode("game")} />
          <div style={{ textAlign: "center", fontFamily: "system-ui" }}>
            <button onClick={() => setMode("login")}>Go to Login</button>
          </div>
        </>
      )}
    </div>
  );
}
