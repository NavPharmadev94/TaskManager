const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface User {
  id: number;
  email: string;
}

export interface Task {
  id: number;
  title: string;
  completed: boolean;
}

// ── Error parsing ─────────────────────────────────────────────────────────────

/** Parse FastAPI errors — detail can be a string or a Pydantic validation array. */
function parseError(err: Record<string, unknown>, fallback: string): string {
  if (!err.detail) return fallback;
  if (typeof err.detail === "string") return err.detail;
  if (Array.isArray(err.detail)) {
    return err.detail
      .map((e: unknown) => (e as { msg?: string }).msg ?? "")
      .filter(Boolean)
      .join(", ");
  }
  return fallback;
}

// ── Auth helpers ──────────────────────────────────────────────────────────────

async function attemptRefresh(): Promise<void> {
  const res = await fetch(`${BASE}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Unauthorized");
}

/** Fetch wrapper that silently refreshes the access token once on 401. */
async function fetchWithAuth(url: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(url, { ...init, credentials: "include" });
  if (res.status !== 401) return res;
  await attemptRefresh();
  return fetch(url, { ...init, credentials: "include" });
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function register(email: string, password: string): Promise<User> {
  const res = await fetch(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(parseError(err, "Registration failed"));
  }
  return res.json();
}

export async function login(email: string, password: string): Promise<User> {
  const body = new URLSearchParams({ username: email, password });
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    credentials: "include",
    body: body.toString(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(parseError(err, "Login failed"));
  }
  return res.json();
}

export async function logout(): Promise<void> {
  await fetch(`${BASE}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
}

export async function getMe(): Promise<User> {
  const res = await fetchWithAuth(`${BASE}/auth/me`);
  if (!res.ok) throw new Error("Unauthorized");
  return res.json();
}

export async function getTasks(): Promise<Task[]> {
  const res = await fetchWithAuth(`${BASE}/tasks`);
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Failed to fetch tasks");
  return res.json();
}

export async function createTask(title: string): Promise<Task> {
  const res = await fetchWithAuth(`${BASE}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(parseError(err, "Failed to create task"));
  }
  return res.json();
}

export async function updateTask(
  id: number,
  data: { title?: string; completed?: boolean }
): Promise<Task> {
  const res = await fetchWithAuth(`${BASE}/tasks/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(parseError(err, "Failed to update task"));
  }
  return res.json();
}

export async function deleteTask(id: number): Promise<void> {
  const res = await fetchWithAuth(`${BASE}/tasks/${id}`, {
    method: "DELETE",
  });
  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({}));
    throw new Error(parseError(err, "Failed to delete task"));
  }
}