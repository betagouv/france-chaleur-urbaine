import { Icon } from '@dataesr/react-dsfr';
import { Glass, ImageContainer } from './index.styles';

const Infographie = ({
  src,
  alt,
  height,
}: {
  src: string;
  alt: string;
  height?: number;
}) => {
  return (
    <ImageContainer href={src} target="_blank">
      <img width={216} height={height || 350} src={src} alt={alt} />
      <Glass>
        <Icon name="ri-search-eye-fill" size="2x" />
      </Glass>
    </ImageContainer>
  );
};

export default Infographie;
