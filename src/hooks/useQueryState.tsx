import { useState } from 'react';

export const useQueryState = (key: string): [any, (value?: any) => void] => {
  const [value, setValue] = useState<string>('');
  return [value, setValue];
};

export const parseAsStringLiteral = (value: string) => {
  return value;
};

export const serializeAsStringLiteral = (value?: string) => {
  return value;
};

export const parseAsJson = (value?: string) => {
  return JSON.parse(value);
};

export const serializeAsJson = (value?: any) => {
  return JSON.stringify(value);
};
export const parseAsString = (value: any) => {
  return '';
};
export default useQueryState;
