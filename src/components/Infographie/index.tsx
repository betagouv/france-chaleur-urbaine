import { Icon } from '@dataesr/react-dsfr';
import Image from 'next/image';
import { Glass, ImageContainer } from './index.styles';

const Infographie = ({ src, alt }: { src: string; alt: string }) => {
  return (
    <ImageContainer href={src} target="_blank">
      <Image width={216} height={350} src={src} alt={alt} />
      <Glass>
        <Icon name="ri-search-eye-fill" size="2x" />
      </Glass>
    </ImageContainer>
  );
};

export default Infographie;
