import React, { useMemo, useReducer } from 'react';

const initialState = {
  address: {},
  coords: [],
  dataForm: {},
  status: '',
};

function reducer(
  state: typeof initialState,
  action: { type: string; value: any }
) {
  switch (action.type) {
    case 'address':
      return { ...initialState, ...state, address: action.value };
    case 'coords':
      return { ...initialState, ...state, coords: action.value };
    case 'dataForm':
      return { ...initialState, ...state, dataForm: action.value };
    case 'reset':
      return { ...initialState };
    default:
      throw new Error();
  }
}

export const Context = React.createContext(initialState);

const EligibilityFormProvider: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const contextValue = useMemo(() => ({ ...state, dispatch }), [state]);

  return <Context.Provider value={contextValue}>{children}</Context.Provider>;
};

export default EligibilityFormProvider;
