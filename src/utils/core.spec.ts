import { describe, expect, it } from 'vitest';

import type { TestCase } from '@/tests/trpc-helpers';

import { deepMergeObjects, setProperty, toggleBoolean } from './core';

describe('deepMergeObjects()', () => {
  type MergeTestCase = TestCase<{ obj1: any; obj2: any }, any>;

  const testCases: MergeTestCase[] = [
    {
      expectedOutput: {
        a: 2,
        b: 1,
        c: 1,
      },
      input: {
        obj1: {
          a: 1,
          b: 1,
        },
        obj2: {
          a: 2,
          c: 1,
        },
      },
      label: 'should merge simple objects',
    },
    {
      expectedOutput: {
        sub: {
          keep: {
            d: 1,
          },
          new: {
            e: 1,
          },
          subsub: {
            a: 2,
            b: 1,
            c: 1,
          },
        },
      },
      input: {
        obj1: {
          sub: {
            keep: {
              d: 1,
            },
            subsub: {
              a: 1,
              b: 1,
            },
          },
        },
        obj2: {
          sub: {
            new: {
              e: 1,
            },
            subsub: {
              a: 2,
              c: 1,
            },
          },
        },
      },
      label: 'should merge nested objects',
    },
    {
      expectedOutput: {
        limits: { max: 100, min: 0 },
      },
      input: {
        obj1: { limits: null },
        obj2: { limits: { max: 100, min: 0 } },
      },
      label: 'should replace null with an object (regression: typeof null === "object")',
    },
    {
      expectedOutput: {
        limits: null,
      },
      input: {
        obj1: { limits: { max: 100, min: 0 } },
        obj2: { limits: null },
      },
      label: 'should overwrite with null when explicitly provided',
    },
  ];

  it.each(testCases)('$label', ({ input, expectedOutput }) => {
    expect(deepMergeObjects(input.obj1, input.obj2)).toStrictEqual(expectedOutput);
  });
});

describe('toggleBoolean()', () => {
  it('toggles a deeply nested boolean value', () => {
    const obj = {
      sub: {
        subsub: {
          a: true,
          b: 1,
        },
      },
    };
    toggleBoolean(obj, 'sub.subsub.a');
    expect(obj.sub.subsub.a).toStrictEqual(false);
  });
});

describe('setProperty()', () => {
  it('sets a deeply nested property value', () => {
    const obj = {
      sub: {
        subsub: {
          a: [1, 2],
          b: 1,
        },
      },
    };
    setProperty(obj, 'sub.subsub.a', [3, 4]);
    expect(obj.sub.subsub.a).toStrictEqual([3, 4]);
  });
});
