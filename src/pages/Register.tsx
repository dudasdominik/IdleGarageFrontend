import { useMemo, useState } from "react";
import { api, setToken } from "../api";

type UiError = {
  title: string;
  details: string[];
};

function mapRegisterError(ex: any): UiError {
  const status = ex?.status as number | undefined;
  const raw = (ex?.message as string | undefined) ?? "Register failed.";

  const details: string[] = [];

  const body = ex?.body;
  if (body?.error) details.push(String(body.error));
  if (body?.message) details.push(String(body.message));
  if (Array.isArray(body?.errors))
    details.push(...body.errors.map((x: any) => String(x)));

  if (details.length === 0) details.push(raw);

  if (status === 400) {
    return {
      title: "Nem sikerült a regisztráció (400: Bad Request)",
      details: [
        "Valószínűleg az email formátum vagy a jelszó nem felel meg a szabályoknak.",
        ...details,
      ],
    };
  }

  if (status === 409) {
    return {
      title: "Nem sikerült a regisztráció (409: Conflict)",
      details: ["Ezzel az emaillel már létezik fiók.", ...details],
    };
  }

  if (status === 401) {
    return {
      title: "Nem sikerült a regisztráció (401: Unauthorized)",
      details: ["Nincs jogosultság / auth probléma.", ...details],
    };
  }

  if (status && status >= 500) {
    return {
      title: `Szerver hiba (${status})`,
      details: [
        "Backend oldali hiba történt. Nézd meg a backend logot.",
        ...details,
      ],
    };
  }

  return {
    title: status ? `Hiba (${status})` : "Hiba",
    details,
  };
}

export function Register({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<UiError | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => {
    return email.trim().length > 0 && password.trim().length > 0 && !loading;
  }, [email, password, loading]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await api.register(email.trim(), password);
      setToken(res.token);
      onDone();
    } catch (ex: any) {
      setErr(mapRegisterError(ex));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{ maxWidth: 420, margin: "40px auto", fontFamily: "system-ui" }}
    >
      <h2>Register</h2>

      <form onSubmit={submit}>
        <label>Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: 8, margin: "6px 0 12px" }}
          placeholder="test@test.com"
        />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: 8, margin: "6px 0 12px" }}
          placeholder="pl. Test1234!"
        />

        <button disabled={!canSubmit} style={{ width: "100%", padding: 10 }}>
          {loading ? "..." : "Create account"}
        </button>
      </form>

      {err && (
        <div
          style={{
            marginTop: 14,
            border: "1px solid #f3b1b8",
            background: "#fff5f6",
            padding: 10,
            borderRadius: 8,
            color: "#8a1220",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 6 }}>{err.title}</div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {err.details.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
