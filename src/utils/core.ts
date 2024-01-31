export function isDefined<Type>(value: Type | undefined | null): value is Type {
  return value !== undefined && value !== null;
}
