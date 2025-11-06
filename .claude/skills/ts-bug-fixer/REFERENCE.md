# TypeScript Bug Fixer - Reference Guide

## Common TypeScript Error Patterns and Solutions

### Pattern 1: Array vs Single Item Mismatch

**Error:**
```
Type 'Item[]' is not assignable to type 'Item'
```

**Diagnosis:** Function returns array but type expects single item (or vice versa)

**Solution:**
```typescript
// Option 1: Update type to match implementation
type Config = {
  items: Item[];  // Add []
}

// Option 2: Change implementation
return items[0];  // Return first item instead of array
```

### Pattern 2: Missing Properties in Union Types

**Error:**
```
Type 'X' is not assignable to type 'Y'.
Property 'required_prop' is missing in type 'X'
```

**Diagnosis:** One variant of union is missing required properties

**Solution:**
```typescript
// Make property required in all variants
type Config =
  | { type: 'a'; required_prop: string; optional_a?: number }
  | { type: 'b'; required_prop: string; optional_b?: boolean };

// Or make it truly optional
type Config = {
  required_prop?: string;
  // ... other props
}
```

### Pattern 3: Discriminated Union Not Narrowing

**Error:**
```
Property 'specific_field' does not exist on type 'UnionType'
```

**Diagnosis:** TypeScript can't narrow union type automatically

**Solution:**
```typescript
// Add explicit discriminant
type Response =
  | { success: true; data: Data }
  | { success: false; error: Error };

// Use type guard
if (response.success) {
  console.log(response.data);  // TypeScript knows this is the success variant
} else {
  console.log(response.error);  // TypeScript knows this is the error variant
}

// Or use type assertion (less safe)
const data = (response as SuccessResponse).data;
```

### Pattern 4: Optional Property vs Null/Undefined

**Error:**
```
Type 'string | null' is not assignable to type 'string | undefined'
```

**Diagnosis:** Mismatch between `null` and `undefined` in optional types

**Solution:**
```typescript
// Option 1: Use undefined consistently for optional
type Config = {
  value?: string;  // string | undefined
}

// Option 2: Allow both null and undefined
type Config = {
  value: string | null | undefined;
}

// Option 3: Make property required but nullable
type Config = {
  value: string | null;  // Must be present, can be null
}
```

### Pattern 5: Conditional Types Based on Flags

**Error:**
```
Type 'null' is not assignable to parameter of type 'string'
```

**Context:** Property nullability depends on another property

**Solution:**
```typescript
// Make the entire type conditional
type Props =
  | { allowNull: true; value: string | null; onChange: (v: string | null) => void }
  | { allowNull?: false; value: string; onChange: (v: string) => void };

// Now TypeScript enforces consistency
const goodProps: Props = {
  allowNull: true,
  value: null,  // OK
  onChange: (v) => {}  // v has type string | null
};

const badProps: Props = {
  allowNull: false,
  value: null,  // Error: null not allowed when allowNull is false
  onChange: (v) => {}
};
```

### Pattern 6: Function Overloads vs Union Returns

**Error:**
```
Type 'string | number' is not assignable to type 'string'
```

**Context:** Function can return different types based on input

**Solution:**
```typescript
// Option 1: Use function overloads
function getData(id: string): Promise<string>;
function getData(id: number): Promise<number>;
function getData(id: string | number): Promise<string | number> {
  // implementation
}

// Option 2: Use generics with constraints
function getData<T extends string | number>(id: T): Promise<T> {
  // implementation
}

// Option 3: Use conditional types
type ReturnType<T> = T extends string ? string : number;
function getData<T extends string | number>(id: T): Promise<ReturnType<T>> {
  // implementation
}
```

### Pattern 7: Object Index Signatures

**Error:**
```
Element implicitly has an 'any' type because expression of type 'string' can't be used to index type 'X'
```

**Diagnosis:** Trying to access object property with dynamic key

**Solution:**
```typescript
// Option 1: Add index signature
type Config = {
  [key: string]: unknown;
  knownProp: string;
}

// Option 2: Use Record utility type
type Config = Record<string, unknown> & {
  knownProp: string;
}

// Option 3: Use type guard
function hasProperty<T extends object, K extends PropertyKey>(
  obj: T,
  key: K
): obj is T & Record<K, unknown> {
  return key in obj;
}

if (hasProperty(config, dynamicKey)) {
  const value = config[dynamicKey];  // OK
}

// Option 4: Use Map instead of object
const config = new Map<string, unknown>();
config.set('key', value);
```

### Pattern 8: Async Function Return Types

**Error:**
```
Type 'Promise<void>' is not assignable to type 'Promise<Data>'
```

**Diagnosis:** Async function missing return statement

**Solution:**
```typescript
// Add return statement
async function fetchData(): Promise<Data> {
  const response = await fetch(url);
  const data = await response.json();
  return data;  // Don't forget this!
}

// Or change return type
async function fetchData(): Promise<void> {
  const response = await fetch(url);
  await response.json();
  // No return needed
}
```

### Pattern 9: Generic Constraints with Extends

**Error:**
```
Type 'T' is not assignable to type 'string'
```

**Context:** Generic type used where specific type expected

**Solution:**
```typescript
// Add constraint to generic
function process<T extends string>(value: T): string {
  return value.toLowerCase();  // OK, we know T extends string
}

// Or use union constraint
function process<T extends string | number>(value: T): string {
  return String(value);
}

// For object types
function process<T extends { id: string }>(item: T): string {
  return item.id;  // OK, we know T has id property
}
```

### Pattern 10: Nested Optional Properties

**Error:**
```
Cannot read property 'nested' of undefined
```

**Solution:**
```typescript
// Use optional chaining
const value = obj?.nested?.deep?.property;

// With nullish coalescing
const value = obj?.nested?.property ?? defaultValue;

// Or update type to reflect reality
type Config = {
  nested?: {
    property: string;
  };
}

// Or make nested properties required when parent exists
type Config = {
  nested?: {
    property: string;    // If nested exists, property must exist
  };
}
```

## Advanced Techniques

### Branded Types for Validation

```typescript
// Create branded type for validated values
type Email = string & { readonly __brand: 'Email' };

function validateEmail(str: string): Email | null {
  if (/@/.test(str)) {
    return str as Email;
  }
  return null;
}

// Now Email can only be created through validation
function sendEmail(to: Email) {
  // Implementation
}

sendEmail('test@example.com');  // Error
const email = validateEmail('test@example.com');
if (email) {
  sendEmail(email);  // OK
}
```

### Template Literal Types

```typescript
// Type-safe string patterns
type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
type Endpoint = `/api/${string}`;
type Route = `${HTTPMethod} ${Endpoint}`;

const route: Route = 'GET /api/users';  // OK
const invalid: Route = 'PATCH /api/users';  // Error
```

### Const Assertions for Literal Types

```typescript
// Without const assertion
const config = {
  mode: 'production',  // type: string
  port: 3000           // type: number
};

// With const assertion
const config = {
  mode: 'production',  // type: 'production'
  port: 3000           // type: 3000
} as const;

// Make readonly optional
type Config = typeof config;  // { readonly mode: 'production', readonly port: 3000 }
```

### Recursive Types

```typescript
// Type for nested structures
type NestedData = {
  value: string;
  children?: NestedData[];
};

// Recursive validation
function validateNested(data: unknown): data is NestedData {
  if (typeof data !== 'object' || data === null) return false;

  const obj = data as any;
  if (typeof obj.value !== 'string') return false;

  if (obj.children !== undefined) {
    if (!Array.isArray(obj.children)) return false;
    return obj.children.every(validateNested);
  }

  return true;
}
```

## Debugging Strategies

### 1. Use TypeScript Hover Information

Hover over variables in your IDE to see inferred types and understand what TypeScript thinks the type is.

### 2. Add Type Annotations Temporarily

```typescript
// Add explicit type to see what TypeScript infers
const result: HOVER_HERE = someComplexExpression();
```

### 3. Use Type Assertions Sparingly

```typescript
// Only when you know more than TypeScript
const element = document.getElementById('id') as HTMLInputElement;

// Better: use type guard
if (element instanceof HTMLInputElement) {
  element.value = 'test';
}
```

### 4. Check with `satisfies` Operator

```typescript
// Ensure type compatibility without widening
const config = {
  mode: 'production',
  port: 3000
} satisfies Config;  // Error if doesn't match Config, but preserves literal types
```

### 5. Use `@ts-expect-error` for Testing

```typescript
// Document that this SHOULD error
// @ts-expect-error - Testing invalid input
functionThatRequiresString(123);
```

## Quick Reference: Type Utility Functions

```typescript
// Extract keys from object type
type Keys = keyof MyType;

// Extract value types from object type
type Values = MyType[keyof MyType];

// Make all properties optional
type Partial<T> = { [P in keyof T]?: T[P] };

// Make all properties required
type Required<T> = { [P in keyof T]-?: T[P] };

// Make all properties readonly
type Readonly<T> = { readonly [P in keyof T]: T[P] };

// Pick specific properties
type Picked = Pick<MyType, 'prop1' | 'prop2'>;

// Omit specific properties
type Omitted = Omit<MyType, 'prop1' | 'prop2'>;

// Extract from union
type Extracted = Extract<Union, Type>;

// Exclude from union
type Excluded = Exclude<Union, Type>;

// Non-nullable type
type NonNullable<T> = T extends null | undefined ? never : T;

// Return type of function
type Return = ReturnType<typeof myFunction>;

// Parameters of function as tuple
type Params = Parameters<typeof myFunction>;
```
