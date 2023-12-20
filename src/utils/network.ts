export const fetchJSON = async <Data = any>(url: string): Promise<Data> => {
  const res = await fetch(url);
  if (res.status !== 200) {
    // improvement idea: retrieve the message if status 400 or defaults to unknown message
    throw new Error('failed to load data');
  }
  return await res.json();
};
