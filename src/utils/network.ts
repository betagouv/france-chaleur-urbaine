export const fetchJSON = async <Data = any>(url: string): Promise<Data> => {
  const res = await fetch(url);
  if (res.status !== 200) {
    // improvement idea: retrieve the message if status 400 or defaults to unknown message
    console.error(`failed to load data for ${url}`);
    throw new Error(`failed to load data for ${url}`);
  }
  return await res.json();
};

export const postFetchJSON = async <Data = any>(
  url: string,
  body: any
): Promise<Data> => {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status !== 200) {
    // improvement idea: retrieve the message if status 400 or defaults to unknown message
    console.error(`failed to load data for ${url}`);
    throw new Error(`failed to load data for ${url}`);
  }
  return await res.json();
};

export const deleteFetchJSON = async <Data = any>(
  url: string
): Promise<Data> => {
  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (res.status !== 200) {
    // improvement idea: retrieve the message if status 400 or defaults to unknown message
    console.error(`failed to load data for ${url}`);
    throw new Error(`failed to load data for ${url}`);
  }
  return await res.json();
};
