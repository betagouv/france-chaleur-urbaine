import { createGlobalStyle } from 'styled-components';

export const MapSearchFormGlobalStyle: any = createGlobalStyle` // TODO: Wait Fix from @types/styled-component : https://github.com/styled-components/styled-components/issues/3738
  .map-search-form {
    width: 100%;
  }
  .popover-map-search-form {
    z-index: 1000;
  }
`;
