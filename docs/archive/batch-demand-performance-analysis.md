# Batch Demand Creation Performance Analysis (Client-Side)

**Subject**: Chrome hangs when opening Step 2 form with all addresses checked (before any API call)

**Solution**: Schema mismatch between form data structure (flat keys) and Zod schema (array). Plus excessive re-renders from `useValue()` subscriptions in each `AddressSection`.

## Root Cause Analysis

### Problem 1: Schema Structure Mismatch

**Form data structure** (flat keys):
```typescript
{
  "uuid1_heatingType": "collectif",
  "uuid1_heatingEnergy": "gaz",
  "uuid2_heatingType": "individuel",
  "uuid2_heatingEnergy": "fioul",
  // ... N addresses × 6 fields
}
```

**Schema expects** (array of objects):
```typescript
// zBatchDemandStep2Schema = z.array(zBatchDemandStep2AddressSchema)
[
  { addressId: "uuid1", heatingType: "collectif", heatingEnergy: "gaz", ... },
  { addressId: "uuid2", heatingType: "individuel", heatingEnergy: "fioul", ... },
]
```

**Impact**: On every keystroke, `useForm` runs `zBatchDemandStep2Schema.parse(formValues)` which:
1. Tries to validate a flat object `{}` as an array
2. Fails with "Expected array, received object"
3. Generates validation errors for every field
4. Triggers error state updates

### Problem 2: Excessive Re-renders

Each `AddressSection` component calls:
```typescript
const demandCompanyType = useValue(`${address.id}_demandCompanyType`);
```

This creates **N subscriptions** to the form store. When any field changes:
1. Form state updates
2. Zod validation runs (and fails due to schema mismatch)
3. All N components re-render due to their subscriptions
4. Each re-render triggers more state calculations

**With 100 addresses**: 100+ component re-renders × validation × state updates per keystroke

### Problem 3: No Default Values

The `Step2Form` has no `defaultValues`:
```typescript
const { Form, Field, ... } = useForm({
  onSubmit: ...,
  schema: zBatchDemandStep2Schema,
  // Missing: defaultValues
});
```

TanStack Form initializes with empty state, causing:
- Initial validation failures
- Uncontrolled → controlled input warnings
- Additional state synchronization overhead

## Code References

- `BatchDemandMultiStepForm.tsx:188-205` - Step2Form useForm setup
- `BatchDemandMultiStepForm.tsx:262` - useValue subscription in AddressSection
- `constants.ts:316` - `zBatchDemandStep2Schema` expects array
- `useForm.tsx:193-195` - Schema becomes `onChange` validator

## Options to Fix

### Option 1: Remove Schema from Step 2 (Quick Fix)

Remove the mismatched schema, validate manually on submit:

```typescript
const { Form, Field, ... } = useForm({
  defaultValues: addresses.reduce((acc, addr) => ({
    ...acc,
    [`${addr.id}_heatingType`]: '',
    [`${addr.id}_heatingEnergy`]: '',
  }), {}),
  onSubmit: async ({ value }) => {
    // Transform and validate here
    const addressesData = addresses.map((addr) => ({...}));
    const result = zBatchDemandStep2Schema.safeParse(addressesData);
    if (!result.success) {
      // Handle errors
      return;
    }
    await mutateAsync({ addressesData, commonInfo: commonData });
  },
  // Remove: schema: zBatchDemandStep2Schema,
});
```

- **Pros**: Minimal changes, immediate fix
- **Cons**: Loses real-time validation feedback

### Option 2: Create Matching Flat Schema (Better)

Create a schema that matches the flat form structure:

```typescript
// In constants.ts
export const createBatchDemandStep2FlatSchema = (addressIds: string[]) =>
  z.object(
    addressIds.reduce((acc, id) => ({
      ...acc,
      [`${id}_heatingType`]: z.string().min(1, 'Champ requis'),
      [`${id}_heatingEnergy`]: z.string().min(1, 'Champ requis'),
      [`${id}_demandArea`]: z.number().optional(),
      [`${id}_nbLogements`]: z.number().optional(),
      [`${id}_demandCompanyType`]: z.string().optional(),
      [`${id}_demandCompanyName`]: z.string().optional(),
    }), {})
  );
```

```typescript
// In BatchDemandMultiStepForm.tsx
const schema = useMemo(
  () => createBatchDemandStep2FlatSchema(addresses.map(a => a.id)),
  [addresses]
);

const { Form, Field, ... } = useForm({
  defaultValues: addresses.reduce((acc, addr) => ({
    ...acc,
    [`${addr.id}_heatingType`]: '',
    [`${addr.id}_heatingEnergy`]: '',
  }), {}),
  schema,
  onSubmit: ...
});
```

- **Pros**: Real-time validation works, proper type checking
- **Cons**: More code, dynamic schema generation

### Option 3: Restructure Form to Use Array (Best Long-term)

Use TanStack Form's array field support:

```typescript
const { Form, Field, ... } = useForm({
  defaultValues: {
    addresses: addresses.map(addr => ({
      addressId: addr.id,
      heatingType: '',
      heatingEnergy: '',
      // ...
    }))
  },
  schema: z.object({ addresses: zBatchDemandStep2Schema }),
  onSubmit: async ({ value }) => {
    await mutateAsync({ addressesData: value.addresses, commonInfo: commonData });
  },
});

// Then use Field arrays:
<form.Field name="addresses" mode="array">
  {(field) => field.state.value.map((_, index) => (
    <AddressSection key={index} index={index} Field={Field} />
  ))}
</form.Field>
```

- **Pros**: Proper schema match, cleaner architecture, better performance with TanStack optimizations
- **Cons**: More significant refactor

## Recommendation

**Implemented**: Option 3 (array-based form structure) has been applied.

## Performance Impact

| Addresses | Current (broken) | After Fix (est.) |
|-----------|------------------|------------------|
| 10 | Slow | Instant |
| 50 | Hangs 5-10s | ~100ms |
| 100 | Chrome crash | ~200ms |
| 500 | Crash | ~500ms |
