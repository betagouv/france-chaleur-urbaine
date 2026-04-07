import Image from 'next/image';

import Link from '@/components/ui/Link';

export const getEcoreseauImageSrc = (ecoreseau: string) => {
  switch (ecoreseau) {
    case 'ecoreseau 2025':
      return '/img/ecoreseau2025.png';
    case 'ecoreseau + 2025':
      return '/img/ecoreseauplus2025.png';
    default:
      return `/img/${ecoreseau}.png`;
  }
};

const ECORESEAU_LINK = 'https://amorce.asso.fr/boite-a-outils-energie-label-ecoreseau-de-chaleur';

function EcoreseauLabel({ ecoreseau }: { ecoreseau: string }) {
  return (
    <div className="flex w-full items-center">
      <Image src={getEcoreseauImageSrc(ecoreseau)} alt="Logo Ecoréseau par amorce" width={56} height={56} className="shrink-0" />
      <b className="fr-ml-1w">
        LABEL
        <br />
        ÉCORÉSEAU
      </b>
      <div className="mx-4 h-14 w-px shrink-0 bg-[#dddddd]" />
      <div>
        Attribué par AMORCE en partenariat avec l’ADEME, ce label valorise les performances environnementales, économiques et sociales des
        réseaux de chaleur.{' '}
        <Link
          href={ECORESEAU_LINK}
          isExternal
          postHogEventKey="link:click"
          postHogEventProps={{ link_name: 'label_ecoreseau', source: 'fiche-reseau' }}
        >
          En savoir plus
        </Link>
      </div>
    </div>
  );
}

export function EcoreseauInfo({ ecoreseau }: { ecoreseau: string }) {
  return (
    <div className="mt-4 flex items-start gap-4 text-sm">
      <Image src={getEcoreseauImageSrc(ecoreseau)} alt="Logo Ecoréseau par amorce" width={56} height={56} className="shrink-0" />
      <div>
        <strong>Label Écoréseau :</strong> ce réseau a reçu le label Écoréseau de chaleur pour valoriser ses performances environnementales,
        économiques et sociales. Ce label est attribué par AMORCE, en partenariat avec l’ADEME.{' '}
        <Link
          href={ECORESEAU_LINK}
          isExternal
          postHogEventKey="link:click"
          postHogEventProps={{ link_name: 'label_ecoreseau', source: 'fiche-reseau' }}
        >
          En savoir plus
        </Link>
      </div>
    </div>
  );
}

export default EcoreseauLabel;
