import { useState } from "react";
import { api, setToken } from "../api";

export function Login({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState("test@test.com");
  const [password, setPassword] = useState("Test1234!");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await api.login(email, password);
      setToken(res.token);
      onDone();
    } catch (ex: any) {
      setErr(ex.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        maxWidth: 420,
        margin: "40px auto",
        fontFamily: "system-ui",
      }}
    >
      <h2>Login</h2>
      <form onSubmit={submit}>
        <label>Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: 8, margin: "6px 0 12px" }}
        />
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: 8, margin: "6px 0 12px" }}
        />

        <button disabled={loading} style={{ width: "100%", padding: 10 }}>
          {loading ? "..." : "Login"}
        </button>
      </form>

      {err && <p style={{ color: "crimson" }}>{err}</p>}
    </div>
  );
}
