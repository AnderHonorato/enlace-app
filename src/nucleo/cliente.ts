"use client";

export async function api<T = any>(path: string, opts: RequestInit = {}): Promise<T> {
  const isFormData = typeof FormData !== "undefined" && opts.body instanceof FormData;
  const res = await fetch(path, {
    headers: opts.body && !isFormData ? { "content-type": "application/json" } : undefined,
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || `Erro (${res.status})`;
    const err = new Error(msg) as Error & { code?: string; status?: number };
    err.code = data?.error;
    err.status = res.status;
    throw err;
  }
  return data as T;
}
