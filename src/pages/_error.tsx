import { captureUnderscoreErrorException } from '@sentry/nextjs';
import type { NextPageContext } from 'next';
import Error, { type ErrorProps } from 'next/error';

type CustomErrorComponentProps = ErrorProps;

interface CustomErrorComponent {
  (props: CustomErrorComponentProps): JSX.Element;
  getInitialProps?(context: NextPageContext): Promise<ErrorProps>;
}

const CustomErrorComponent: CustomErrorComponent = (props) => {
  return <Error statusCode={props.statusCode} />;
};

CustomErrorComponent.getInitialProps = async (contextData: NextPageContext): Promise<ErrorProps> => {
  // In case this is running in a serverless function, await this in order to give Sentry
  // time to send the error before the lambda exits
  await captureUnderscoreErrorException(contextData);

  // This will contain the status code of the response
  return Error.getInitialProps(contextData);
};

export default CustomErrorComponent;
