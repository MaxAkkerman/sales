export type ClientStatus =
  | "new"
  | "in_progress"
  | "qualification"
  | "negotiation"
  | "rejected"
  | "client";

export type Client = {
  id: number;
  segment: string | null;
  priority: string | null;
  company: string;
  city: string | null;
  region: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  inn: string | null;
  contact_name: string | null;
  contact_role: string | null;
  source: string | null;
  status: ClientStatus;
  collection_notes: string | null;
  comments_count?: number;
  comments?: Comment[];
};

export type Comment = {
  id: number;
  client_id: number;
  body: string;
  created_at: string;
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  if (res.status === 401) {
    throw Object.assign(new Error("unauthorized"), { status: 401 });
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Ошибка запроса");
  }
  return res.json();
}

export const api = {
  me: () => request<{ user: string }>("/api/me"),
  login: (username: string, password: string) =>
    request<{ user: string }>("/api/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  logout: () => request("/api/logout", { method: "POST" }),
  clients: (params: Record<string, string>) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v) q.set(k, v);
    });
    return request<Client[]>(`/api/clients?${q.toString()}`);
  },
  client: (id: number) => request<Client>(`/api/clients/${id}`),
  create: (body: Partial<Client>) =>
    request<Client>("/api/clients", { method: "POST", body: JSON.stringify(body) }),
  update: (id: number, body: Partial<Client>) =>
    request<Client>(`/api/clients/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  addComment: (id: number, body: string) =>
    request<Comment>(`/api/clients/${id}/comments`, {
      method: "POST",
      body: JSON.stringify({ body }),
    }),
};
