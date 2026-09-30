const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status = 500, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export function getToken() {
  return typeof window === "undefined"
    ? null
    : localStorage.getItem("accessToken");
}
export function getRefreshToken() {
  return typeof window === "undefined"
    ? null
    : localStorage.getItem("refreshToken");
}
export function setSession(
  accessToken: string,
  refreshToken: string,
  user: unknown,
) {
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
  localStorage.setItem("user", JSON.stringify(user));
}
export function setUser(user: unknown) {
  localStorage.setItem("user", JSON.stringify(user));
}
export function getUser<T = unknown>(): T | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("user");
  return raw ? (JSON.parse(raw) as T) : null;
}
export function clearSession() {
  ["accessToken", "refreshToken", "user"].forEach((k) =>
    localStorage.removeItem(k),
  );
}

async function raw(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers.has("Content-Type")
  )
    headers.set("Content-Type", "application/json");
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new ApiError(
      data.message || data.error || "Request failed",
      res.status,
      data.code,
    );
  return data;
}

export async function api<T = unknown>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  try {
    return (await raw(path, options)) as T;
  } catch (e) {
    if (retry && (e as ApiError).status === 401 && getRefreshToken()) {
      try {
        const refresh = await raw("/api/auth/refresh", {
          method: "POST",
          body: JSON.stringify({ refreshToken: getRefreshToken() }),
        });
        setSession(
          refresh.data.accessToken,
          refresh.data.refreshToken,
          refresh.data.user,
        );
        return await api<T>(path, options, false);
      } catch {
        clearSession();
      }
    }
    throw e;
  }
}
export const apiBase = API_URL;
