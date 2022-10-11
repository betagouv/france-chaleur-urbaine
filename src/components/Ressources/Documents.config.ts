const data = [
  {
    title: 'ok 1',
    key: 'ok',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ',
    link: '/test',
  },
  {
    title: 'ok 2',
    key: 'ok',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ',
    link: '/test',
  },
  {
    title: 'ok 3',
    key: 'ok',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ',
    link: '/test',
  },
  {
    title: 'ok 4',
    key: 'ok',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ',
    link: '/test',
  },
  {
    title: 'ok',
    key: 'ok',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ',
    link: '/test',
  },
  {
    title: 'ok',
    key: 'ok',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ',
    link: '/test',
  },
  {
    title: 'ok',
    key: 'ok',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ',
    link: '/test',
  },
];

export const documentsData = data.concat(
  data.map((x) => ({ ...x, key: `${x.key}-2` }))
);
