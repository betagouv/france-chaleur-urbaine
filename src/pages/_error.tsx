import { type NextPageContext } from 'next';
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
  // This will contain the status code of the response
  return Error.getInitialProps(contextData);
};

export default CustomErrorComponent;
