import Layout from '@components/layout/layout';
import React from 'react';
type AlertProps = {
  type: 'error' | 'success';
};

const Alert: React.FC<AlertProps> = ({ children, type }) => {
  return (
    <div className="alert" data-type={type}>
      {children}
    </div>
  );
};
export default function EligibilityResult() {
  return (
    <Layout>
      <Alert type="error">Something went wrong !</Alert>
    </Layout>
  );
}
