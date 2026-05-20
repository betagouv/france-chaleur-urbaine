import Link from '@/components/ui/Link';

import { LegendIcon } from '../../legend/LegendIcon';
import { LegendSection } from '../../legend/LegendSection';
import { ressourcesGeothermalesNappesConfig, ressourcesGeothermalesNappesOpacity } from './ressourcesGeothermalesNappes';

/** Ressources géothermales sur nappes — toggle + colour legend per aquifere kind. */
export function RessourcesGeothermalesNappesLegend() {
  return (
    <LegendSection
      id="enrr-ressources-geothermales-nappes"
      title="Ressources géothermales sur nappes"
      togglePath="ressourcesGeothermalesNappes"
      trackingEvent="Carto|Ressources géothermales nappes"
      tooltip={
        <>
          Potentiel de géothermie sur nappes pour la production de chaleur ou de froid.
          <br />
          Source :{' '}
          <Link href="https://www.geothermies.fr/espace-cartographique" isExternal>
            BRGM-Ademe
          </Link>
        </>
      }
      contentClassName="text-xs"
    >
      {ressourcesGeothermalesNappesConfig.map((item) => (
        <div key={item.value} className="flex items-baseline gap-2">
          <LegendIcon type="polygon" stroke={item.color} fillOpacity={ressourcesGeothermalesNappesOpacity} />
          <span>{item.label}</span>
        </div>
      ))}
    </LegendSection>
  );
}
