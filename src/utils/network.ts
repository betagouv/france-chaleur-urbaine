export async function fetchJSON<Data>(url: string): Promise<Data> {
  const res = await fetch(url);
  return (await res.json()) as Data;
}
