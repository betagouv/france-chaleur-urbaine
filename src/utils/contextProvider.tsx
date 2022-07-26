import { renderHook } from '@testing-library/react-hooks';
import { render } from '@utils/test-utils';
import {
  HeatNetworkService,
  ServicesContext,
  SuggestionService,
} from 'src/services';
import { FakeHttpClient } from './fakeHttpClient';

export const customRender = (
  ui: React.ReactNode,
  { overrideProps, ...renderOptions }: any
) => {
  return render(
    <ServicesContext.Provider
      value={{
        suggestionService: new SuggestionService(FakeHttpClient),
        heatNetworkService: new HeatNetworkService(FakeHttpClient),
        ...overrideProps,
      }}
    >
      {ui}
    </ServicesContext.Provider>,
    renderOptions
  );
};
export const customRenderHook = (hook: any, overrideProps?: any) => {
  const Wrapper: React.FC<{
    children: React.ReactNode;
    overrideProps: any;
  }> = ({ children, ...overrideProps }) => {
    return (
      <ServicesContext.Provider
        value={{
          suggestionService: new SuggestionService(FakeHttpClient),
          heatNetworkService: new HeatNetworkService(FakeHttpClient),
          ...overrideProps,
        }}
      >
        {children}
      </ServicesContext.Provider>
    );
  };

  return renderHook(() => hook(), {
    wrapper: Wrapper,
    initialProps: {
      ...overrideProps,
    },
  });
};
