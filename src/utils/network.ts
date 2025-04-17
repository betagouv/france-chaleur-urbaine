type FetchErrorOptions = {
  message: string;
  status: number;
};
export class FetchError extends Error {
  status: number;

  constructor(options: FetchErrorOptions) {
    super(options.message);
    this.name = 'FetchError';
    this.status = options.status;
  }
}
export const fetchMethod =
  <Method extends 'POST' | 'PUT' | 'DELETE'>(method: Method) =>
  async <Data = any, Body = any>(url: string, body?: Body): Promise<Data> => {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      await handleError(res, url);
    }
    return await res.json();
  };

/**
 * Converts an object to URLSearchParams
 * Handles nested objects by serializing them to JSON
 * @param obj The object to convert
 * @returns URLSearchParams instance
 */
export const objectToURLSearchParams = (obj: Record<string, any>): URLSearchParams => {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null) {
      continue;
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      params.append(key, String(value));
    } else if (typeof value === 'object') {
      // Serialize objects and arrays to JSON strings
      params.append(key, JSON.stringify(value));
    }
  }

  return params;
};

export const fetchJSON = async <Data = any>(
  url: string,
  variables: RequestInit & {
    params?: Record<string, any>;
  } = {}
): Promise<Data> => {
  const { params, ...init } = variables;

  const queryString = params ? `?${objectToURLSearchParams(params as Record<string, string>).toString()}` : '';

  const res = await fetch(`${url}${queryString}`, init);
  if (!res.ok) {
    await handleError(res, url);
  }
  return await res.json();
};

export const postFetchJSON = fetchMethod('POST');
export const putFetchJSON = fetchMethod('PUT');
export const deleteFetchJSON = fetchMethod('DELETE');

export const postFormDataFetchJSON = async <Data = any>(url: string, formState: object): Promise<Data> => {
  const formData = new FormData();
  for (const [key, value] of Object.entries(formState)) {
    if (value instanceof Array) {
      for (const part of Array.from(value)) {
        formData.append(key, part);
      }
    } else {
      formData.set(key, value as string);
    }
  }

  const res = await fetch(url, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    await handleError(res, url);
  }
  return await res.json();
};

export async function handleError(res: Response, url: string) {
  const isJson = res.headers.get('Content-Type')?.includes('application/json');
  const errorData = isJson ? await res.json().catch(() => null) : null;
  const errorMessage =
    res.status === 400 && errorData?.message ? errorData.message : `Failed to load data for ${url} (status ${res.status})`;
  throw new FetchError({ message: errorMessage, status: res.status });
}
