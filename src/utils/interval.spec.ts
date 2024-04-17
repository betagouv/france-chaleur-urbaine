import { expect, test } from 'vitest';
import { Interval, intervalsEqual } from './interval';

test('intervalsEqual()', () => {
  const tests: Array<{ a: Interval; b: Interval; expectedResult: boolean }> = [
    {
      a: [1, 2],
      b: [1, 2],
      expectedResult: true,
    },
    {
      a: [1, 2],
      b: [1, 3],
      expectedResult: false,
    },
    {
      a: [2, 2],
      b: [1, 3],
      expectedResult: false,
    },
    {
      a: [2, 2],
      b: [1, 3],
      expectedResult: false,
    },
  ];

  tests.forEach((test) => {
    expect(intervalsEqual(test.a, test.b)).toStrictEqual(test.expectedResult);
  });
});
