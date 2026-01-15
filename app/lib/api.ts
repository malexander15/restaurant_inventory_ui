// app/lib/api.ts
export async function apiFetch<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("token="))
    ?.split("=")[1];

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}${url}`,
    { ...options, headers }
  );

  // 🔐 auth guard
  if (res.status === 401) {
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  // ❌ other errors
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Request failed");
  }

  // 🧼 DELETE / empty responses
  if (res.status === 204) {
    return null as T;
  }

  return (await res.json()) as T;
}
