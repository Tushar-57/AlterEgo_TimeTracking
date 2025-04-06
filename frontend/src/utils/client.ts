export async function api<T>(url: string, options: RequestInit = {}) {
    try {
      const res = await fetch(url, options);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || res.statusText);
      return data as T;
    } catch (err: any) {
      throw new Error(err.message || 'Network error');
    }
  }