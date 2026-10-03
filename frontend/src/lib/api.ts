export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

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

const isBrowser = () => typeof window !== "undefined";

export function getToken() {
  if (!isBrowser()) return null;
  return localStorage.getItem("accessToken");
}

export function getRefreshToken() {
  if (!isBrowser()) return null;
  return localStorage.getItem("refreshToken");
}

export function setSession(
  accessToken: string,
  refreshToken: string,
  user: unknown,
) {
  if (!isBrowser()) return;
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
  localStorage.setItem("user", JSON.stringify(user));
}

export function setUser(user: unknown) {
  if (!isBrowser()) return;
  localStorage.setItem("user", JSON.stringify(user));
}

export function getUser<T = unknown>(): T | null {
  if (!isBrowser()) return null;
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    localStorage.removeItem("user");
    return null;
  }
}

export function clearSession() {
  if (!isBrowser()) return;
  ["accessToken", "refreshToken", "user"].forEach((k) =>
    localStorage.removeItem(k),
  );
}

async function raw(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  const isForm = typeof FormData !== "undefined" && options.body instanceof FormData;

  if (options.body && !isForm && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      credentials: "include",
    });
  } catch {
    throw new ApiError(
      `Cannot reach the API at ${API_URL}. Is the backend running?`,
      0,
      "NETWORK_ERROR",
    );
  }

  if (res.status === 204) return {};

  const contentType = res.headers.get("content-type") || "";
  let data: Record<string, unknown> = {};
  if (contentType.includes("application/json")) {
    data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  } else {
    const text = await res.text().catch(() => "");
    if (!res.ok) {
      throw new ApiError(
        text?.slice(0, 200) || `Request failed with status ${res.status}`,
        res.status,
      );
    }
    return { data: text };
  }

  if (!res.ok) {
    const message =
      (data.message as string) ||
      (data.error as string) ||
      `Request failed with status ${res.status}`;
    throw new ApiError(message, res.status, data.code as string | undefined);
  }

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
    const isAuthError = e instanceof ApiError && e.status === 401;
    if (retry && isAuthError && getRefreshToken()) {
      try {
        const refresh = (await raw("/api/auth/refresh", {
          method: "POST",
          body: JSON.stringify({ refreshToken: getRefreshToken() }),
        })) as {
          data: { accessToken: string; refreshToken: string; user: unknown };
        };

        const d = refresh?.data;
        if (!d?.accessToken) throw new Error("Malformed refresh response");

        setSession(d.accessToken, d.refreshToken, d.user);
        return await api<T>(path, options, false);
      } catch {
        clearSession();
      }
    }
    throw e;
  }
}

export const apiBase = API_URL;
