const BASE = (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:5026";


export function getToken() {
  return localStorage.getItem("token");
}

export function setToken(token: string) {
  localStorage.setItem("token", token);
}

export function clearToken() {
  localStorage.removeItem("token");
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as any),
  };

  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...init, headers });

  if (res.status === 204) return undefined as T;

  const contentType = res.headers.get("content-type") || "";
  const text = await res.text();

  let data: any = null;
  if (text) {
    try {
      data = contentType.includes("application/json") ? JSON.parse(text) : { message: text };
    } catch {
      data = { message: text };
    }
  }

  if (!res.ok) {
    const parts: string[] = [];

    if (data?.error) parts.push(String(data.error));
    if (data?.message) parts.push(String(data.message));
    if (Array.isArray(data?.errors)) parts.push(...data.errors.map((x: any) => String(x)));

    const message = parts.length ? parts.join(" | ") : `HTTP ${res.status}`;

    const err: any = new Error(message);
    err.status = res.status;
    err.body = data;
    throw err;
  }

  return data as T;
}

export const api = {
  async register(email: string, password: string): Promise<{ token: string }> {
    return request("/api/Auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  async login(email: string, password: string): Promise<{ token: string }> {
    return request("/api/Auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  async getState() {
    return request("/api/Workshop/state", { method: "GET" });
  },

  async startJob(jobDefinitionId: string) {
    return request<void>("/api/Workshop/start-job", {
      method: "POST",
      body: JSON.stringify({ jobDefinitionId }),
    });
  },

  async claim() {
    return request<{ reward: number }>("/api/Workshop/claim", { method: "POST" });
  },

  async buyUpgrade(upgradeDefinitionId: string) {
    return request<void>("/api/Workshop/buy-upgrade", {
      method: "POST",
      body: JSON.stringify({ upgradeDefinitionId }),
    });
  },
};
