import WrappedText from '@components/WrappedText/WrappedText';
import Link from 'next/link';
import { ContainerDispositifs, Image, Title } from './City.styles';

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
          {dispositifsTitle && (
            <Title>
              <h3>{dispositifsTitle}</h3>
            </Title>
          )}
          <ContainerDispositifs>
            {dispositifs.map((dispositif: any, i) => (
              <div
                className="dispositif-column fr-col-lg-6 fr-col-md-6 fr-col-sm-12 fr-col-xs-12"
                key={`${city}'-'+${i}`}
              >
                {dispositif.title && (
                  <Title>
                    <h3>{dispositif.title}</h3>
                  </Title>
                )}
                {dispositif.img && (
                  <Image src={dispositif.img.src} alt={dispositif.img.alt} />
                )}
                <WrappedText body={dispositif.description} />
                {dispositif.link && (
                  <div className="fr-btn fr-mt-2w fr-ml-4w">
                    <Link
                      href={dispositif.link.href}
                      target={dispositif.link.target}
                    >
                      {dispositif.link.title}
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </ContainerDispositifs>
        </>
      ) : (
        ''
      )}
    </>
  );
};

export default Dispositifs;
