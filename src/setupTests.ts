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

jest.spyOn(console, 'log').getMockImplementation();
afterAll(() => {
  jest.resetAllMocks();
});
// Env Variables
process.env.NEXT_PUBLIC_BAN_API_BASE_URL = 'http://suggestions-service/search/';
process.env.NEXT_PUBLIC_PYRIS_BASE_URL = 'https://pyris-api/api/';
process.env.NEXT_PUBLIC_HEAT_NETWORK_API_BASE_URL =
  'https://chauffurbain.herokuapp.com/distance';
