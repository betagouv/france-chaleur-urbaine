import WrappedText from '@components/WrappedText/WrappedText';
import Link from 'next/link';
import { Image } from './City.styles';
import {
  DispositifsContainer,
  DispositifsColumn,
  Title,
} from './Dispositifs.styles';

export type DispositifsData = {
  title?: string;
  description: string;
  img?: {
    alt: string;
    src: string;
  };
  link?: {
    title: string;
    href: string;
    target?: string;
  };
};

const Dispositifs = ({
  city,
  dispositifsTitle,
  dispositifs,
}: {
  city: string;
  dispositifsTitle?: string;
  dispositifs: DispositifsData[];
}) => {
  return (
    <>
      {dispositifs.length > 0 ? (
        <>
          {dispositifsTitle && <Title>{dispositifsTitle}</Title>}
          <DispositifsContainer>
            {dispositifs.map((dispositif: any, i) => (
              <DispositifsColumn
                className="fr-col-md-6 fr-col-12"
                key={`${city}'-'+${i}`}
              >
                {dispositif.title && <h4>{dispositif.title}</h4>}
                {dispositif.img && (
                  <Image src={dispositif.img.src} alt={dispositif.img.alt} />
                )}
                <WrappedText body={dispositif.description} />
                {dispositif.link && (
                  <div className="fr-btn fr-mt-2w fr-ml-4w">
                    <Link
                      href={dispositif.link.href}
                      target={dispositif.link.target}
                      rel={
                        dispositif.link.target == '_blank'
                          ? 'noopener noreferrer'
                          : undefined
                      }
                    >
                      {dispositif.link.title}
                    </Link>
                  </div>
                )}
              </DispositifsColumn>
            ))}
          </DispositifsContainer>
        </>
      ) : (
        ''
      )}
    </>
  );
};

export default Dispositifs;
