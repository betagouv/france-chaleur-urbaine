import '@testing-library/jest-dom/extend-expect';

jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '',
      query: {},
      asPath: '',
      /* eslint-disable @typescript-eslint/no-empty-function */
      push: jest.fn(),
      replace: jest.fn(),
    };
  },
}));

// Env Variables
process.env.NEXT_PUBLIC_BAN_API_BASE_URL = 'http://suggestions-service/search/';
