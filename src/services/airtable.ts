import type { Airtable } from '@/types/enum/Airtable';

export const submitToAirtable = async (values: any, type: Airtable): Promise<Response> => {
  const res = await fetch('/api/airtable/records', {
    body: JSON.stringify({ ...values, type }),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });
  if (!res.ok) {
    throw new Error(`wrong status ${res.status}`);
  }
  return res;
};
