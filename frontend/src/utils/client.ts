export async function api<T>(url: string, options: RequestInit = {}) {
    try {
      const res = await fetch(url, options);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || res.statusText);
      return data as T;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network error';
      throw new Error(message);
    }
  }