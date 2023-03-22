import test from './README.md';

const importFile = (file) => {
  const lines = file.split('---');
  console.log(lines);
};
console.log(importFile(test));

export const files = [
  {
    title: '',
    description: '',
    content: test.replace('(.gitbook/assets/', '(/contents/'),
  },
];
