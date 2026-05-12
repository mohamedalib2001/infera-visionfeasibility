export async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || "Request failed");
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

export const api = {
  get: <T>(url: string) => apiRequest<T>(url),
  post: <T>(url: string, data: unknown) => apiRequest<T>(url, { method: "POST", body: JSON.stringify(data) }),
  put: <T>(url: string, data: unknown) => apiRequest<T>(url, { method: "PUT", body: JSON.stringify(data) }),
  delete: <T>(url: string) => apiRequest<T>(url, { method: "DELETE" }),
};
