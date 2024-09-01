import Box, { ResponsiveRow } from '@components/ui/Box';
import Heading from '@components/ui/Heading';
import Link from '@components/ui/Link';

import { Image } from './City.styles';

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
        <Box className="fr-container" mb="4w">
          {dispositifsTitle && (
            <Heading as="h3" legacyColor="white">
              {dispositifsTitle}
            </Heading>
          )}
          <ResponsiveRow>
            {dispositifs.map((dispositif: any, i) => (
              <Box flex key={`${city}'-'+${i}`}>
                {dispositif.title && (
                  <Heading as="h4" legacyColor="white">
                    {dispositif.title}
                  </Heading>
                )}
                {dispositif.img && <Image src={dispositif.img.src} alt={dispositif.img.alt} />}
                <Box flexDirection="column">{dispositif.description}</Box>
                {dispositif.link && (
                  <Box className="fr-btn fr-mt-2w fr-ml-4w">
                    <Link href={dispositif.link.href} isExternal={dispositif.link.target === '_blank' ? true : false}>
                      {dispositif.link.title}
                    </Link>
                  </Box>
                )}
              </Box>
            ))}
          </ResponsiveRow>
        </Box>
      ) : (
        ''
      )}
    </>
  );
};

export default Dispositifs;
