import Image from 'next/image';

import Link from '@/components/ui/Link';
import type { EcoreseauLabel } from '@/modules/reseaux/types';

export const isEcoreseauPlus = (ecoreseau: EcoreseauLabel) => ecoreseau === 'ecoreseau + 2025';
export const getEcoreseauImageSrc = (ecoreseau: EcoreseauLabel) =>
  isEcoreseauPlus(ecoreseau) ? '/img/ecoreseauplus2025.png' : '/img/ecoreseau2025.png';

export const ECORESEAU_LINK = 'https://amorce.asso.fr/boite-a-outils-energie-label-ecoreseau-de-chaleur';

function EcoreseauLabelBlock({ ecoreseau }: { ecoreseau: EcoreseauLabel }) {
  return (
    <div className="flex w-full items-center">
      <Image src={getEcoreseauImageSrc(ecoreseau)} alt="Logo Ecoréseau par amorce" width={56} height={56} className="shrink-0" />
      <b className="fr-ml-1w shrink-0">
        LABEL
        <br />
        ÉCORÉSEAU {isEcoreseauPlus(ecoreseau) ? '+' : ''}
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

export function EcoreseauInfo({ ecoreseau }: { ecoreseau: EcoreseauLabel }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <Image src={getEcoreseauImageSrc(ecoreseau)} alt="Logo Ecoréseau par amorce" width={56} height={56} className="shrink-0" />
      <div>
        <strong>Label Écoréseau {isEcoreseauPlus(ecoreseau) ? '+' : ''} </strong>: ce réseau a reçu le label Écoréseau de chaleur pour
        valoriser ses performances environnementales, économiques et sociales.
        <br /> Ce label est attribué par AMORCE, en partenariat avec l’ADEME.{' '}
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

export default EcoreseauLabelBlock;
