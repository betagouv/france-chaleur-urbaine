import { createContext, ReactNode, useContext } from 'react';

import usePublicodesEngine from '@helpers/publicodes/usePublicodesEngine';

export type UseEngine = ReturnType<typeof usePublicodesEngine<string | any>>;
export type FormContextType = { engine: UseEngine };

const FormContext = createContext<FormContextType>({ engine: {} as UseEngine });

type FormProviderProps = {
  engine: UseEngine;
  children: ReactNode;
};

export const FormProvider = ({ engine, children }: FormProviderProps) => {
  return <FormContext.Provider value={{ engine }}>{children}</FormContext.Provider>;
};

export const usePublicodesFormContext = (): FormContextType => {
  const context = useContext(FormContext);
  if (context === undefined) {
    throw new Error('usePublicodesFormContext must be used within a FormProvider');
  }
  return context;
};
