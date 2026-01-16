export async function apiFetch<T = any>(
  url: string,
  options: RequestInit & { skipAuth?: boolean } = {}
): Promise<T> {
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("token="))
    ?.split("=")[1];

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(!options.skipAuth && token
      ? { Authorization: `Bearer ${token}` }
      : {}),
    ...options.headers,
  };

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}${url}`,
    {
      ...options,
      headers,
    }
  );

  // 🔐 auth guard (only if not skipped)
  if (res.status === 401 && !options.skipAuth) {
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(
      error.error || error.errors?.[0] || "Request failed"
    );
  }

  if (res.status === 204) {
    return null as T;
  }

  return (await res.json()) as T;
}
