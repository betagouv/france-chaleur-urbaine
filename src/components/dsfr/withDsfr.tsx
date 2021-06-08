import { NextComponentType, NextPageContext } from 'next';
import React from 'react';

export default function WithDsfr(
  // eslint-disable-next-line @typescript-eslint/ban-types
  PageComponent: NextComponentType<NextPageContext, any, {}>
) {
  return function RenderWithModuleSript(
    props: JSX.IntrinsicAttributes & { children?: React.ReactNode }
  ) {
    React.useEffect(() => {
      const moduleScript = document.createElement('script');
      moduleScript.src = '@gouvfr/dsfr/dist/js/dsfr.module.min.js';
      moduleScript.type = 'module';
      document.body.appendChild(moduleScript);

      const noModuleScript = document.createElement('script');
      noModuleScript.type = 'text/javascript';
      noModuleScript.noModule = true;
      noModuleScript.src = '@gouvfr/dsfr/dist/js/dsfr.nomodule.min.js';
      document.body.appendChild(noModuleScript);
      return () => {
        document.body.removeChild(noModuleScript);
        document.body.removeChild(moduleScript);
      };
    }, []);
    return <PageComponent {...props} />;
  };
}
