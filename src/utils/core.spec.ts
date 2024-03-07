import { describe, expect, test } from 'vitest';
import { deepMergeObjects, setProperty, toggleBoolean } from './core';

describe('deepMergeObjects()', () => {
  test('should merge simple objects', () => {
    expect(
      deepMergeObjects(
        {
          a: 1,
          b: 1,
        },
        {
          a: 2,
          c: 1,
        }
      )
    ).toStrictEqual({
      a: 2,
      b: 1,
      c: 1,
    });
  });

  test('should merge nested objects', () => {
    expect(
      deepMergeObjects(
        {
          sub: {
            subsub: {
              a: 1,
              b: 1,
            },
            keep: {
              d: 1,
            },
          },
        },
        {
          sub: {
            subsub: {
              a: 2,
              c: 1,
            },
            new: {
              e: 1,
            },
          },
        }
      )
    ).toStrictEqual({
      sub: {
        subsub: {
          a: 2,
          b: 1,
          c: 1,
        },
        keep: {
          d: 1,
        },
        new: {
          e: 1,
        },
      },
    });
  });
});

test('toggleBoolean()', () => {
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

test('setProperty()', () => {
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
