import { useEffect } from 'react';

const getOsFromUserAgent = (ua: string): string => {
  if (/Mac/i.test(ua)) return 'mac';
  if (/Win/i.test(ua)) return 'windows';
  if (/Linux/i.test(ua)) return 'linux';
  return 'unknown';
};

function useHtmlAttributes(additionalAttributes: Record<string, string> = {}) {
  useEffect(() => {
    const html = document.documentElement;

    const attributes = {
      'data-os': getOsFromUserAgent(navigator.userAgent),
      ...additionalAttributes,
    };

    for (const [key, value] of Object.entries(attributes)) {
      html.setAttribute(key, value);
    }

    return () => {
      for (const key of Object.keys(additionalAttributes)) {
        html.removeAttribute(key);
      }
    };
  }, [JSON.stringify(additionalAttributes)]);
}

export default useHtmlAttributes;
