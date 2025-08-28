declare module '*.md';

// Utility type to remove the `$` prefix from keys
type RemoveDollar<T> = {
  [K in keyof T as K extends `$${infer R}` ? R : K]: T[K];
};

declare module 'dayjs' {
  /**
   * @deprecated Utilisez `import { dayjs } from '@/utils/date'` au lieu d'importer dayjs directement.
   */
  const dayjs: any;
  export = dayjs;
}
