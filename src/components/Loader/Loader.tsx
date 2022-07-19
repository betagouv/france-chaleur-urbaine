import { LoaderAnim, LoaderWrapper } from './Loader.style';

const Loader = ({ show = false, color = '#fff' }) => (
  <LoaderWrapper show={show}>
    <LoaderAnim color={color} />
  </LoaderWrapper>
);

export default Loader;
