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
    >
      <div className="flex flex-col gap-1 pt-2 pl-3 pr-1">
        {ressourcesGeothermalesNappesConfig.map((item) => (
          <div key={item.value} className="flex items-center gap-2 text-xs">
            <LegendIcon type="polygon" stroke={item.color} fillOpacity={ressourcesGeothermalesNappesOpacity} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </LegendSection>
  );
}
