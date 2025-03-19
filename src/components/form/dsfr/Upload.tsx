import { Upload as DSFRUpload, type UploadProps as DSFRUploadProps } from '@codegouvfr/react-dsfr/Upload';

export type UploadProps = Omit<DSFRUploadProps, 'state'> & {
  state?: 'error' | 'default' | 'success' | 'info';
};

const Upload = ({ state, ...props }: UploadProps) => {
  return <DSFRUpload state={state === 'info' ? 'default' : state} {...props} />;
};

export default Upload;
