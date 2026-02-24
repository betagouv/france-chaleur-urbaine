import React, { useCallback } from 'react';

import { getCostPrecisionRange } from '@/components/ComparateurPublicodes/Graph';
import { type DPE, DPE_BG, improveDpe, type ModeDeChauffageEnriched } from '@/components/choix-chauffage/modesChauffageData';
import Accordion from '@/components/ui/Accordion';
import Button from '@/components/ui/Button';
import Image from '@/components/ui/Image';
import Link from '@/components/ui/Link';
import cx from '@/utils/cx';

function DpeTag({ letter }: { letter: DPE }) {
  return (
    <div
      className={cx('h-10 w-10 rounded-sm flex items-center justify-center', DPE_BG[letter])}
      aria-label={`Classe énergétique ${letter}`}
    >
      <div className="h-6 w-6 rounded-full bg-white flex items-center justify-center">
        <span className="text-sm font-bold text-(--text-title-grey)">{letter}</span>
      </div>
    </div>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`${value} étoiles`}>
      {Array.from({ length: value }).map((_, i) => (
        <Image key={i} src="/icons/icon-star.png" alt="icone étoile" aria-hidden="true" width="24" height="24" />
      ))}
    </div>
  );
}

function getGainVsGaz(item: ModeDeChauffageEnriched, coutParAnGaz: number): React.ReactNode {
  const coutParAn = item.coutParAn ?? 0;

  const percentVsGaz = item.gainVsGaz !== undefined ? item.gainVsGaz : Math.round(((coutParAn - coutParAnGaz) / coutParAnGaz) * 100);

  let className = '';
  let iconClass = '';
  let label = '';

  if (percentVsGaz === 0) {
    className = 'text-(--text-title-blue-france)';
    iconClass = 'fr-icon-arrow-right-circle-fill';
    label = '0%';
  } else if (percentVsGaz < 0) {
    className = 'text-(--text-default-success)';
    iconClass = 'fr-icon-arrow-down-circle-fill';
    label = `Moins ${Math.abs(percentVsGaz)}%`;
  } else {
    className = 'text-(--text-default-error)';
    iconClass = 'fr-icon-arrow-up-circle-fill';
    label = `Plus ${percentVsGaz}%`;
  }

  return (
    <div className={cx(className)}>
      <span className={cx('fr-mr-1w', iconClass)} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

function MobileStats({
  item,
  dpeFrom,
  dpeTo,
  gainVsGaz,
}: {
  item: ModeDeChauffageEnriched;
  dpeFrom: DPE;
  dpeTo: DPE;
  gainVsGaz: React.ReactNode;
}): React.ReactNode {
  const { lowerBoundString, upperBoundString } = getCostPrecisionRange(item.coutParAn ?? 0);

  return (
    <div className="md:hidden">
      <div className="flex justify-between fr-mb-3w">
        <div>Coût annuel/logement</div>
        <div className="text-(--text-title-blue-france)">
          {lowerBoundString} à {upperBoundString}
        </div>
      </div>
      <div className="flex justify-between fr-mb-3w">
        <div>Coût par rapport au gaz</div>
        {gainVsGaz}
      </div>
      <div className="flex justify-between fr-mb-3w">
        <div>Gain DPE</div>
        <div className="flex items-center gap-3">
          <DpeTag letter={dpeFrom} />
          <span className="text-(--text-default-grey)">→</span>
          <DpeTag letter={dpeTo} />
        </div>
      </div>
      <hr />
    </div>
  );
}

export function ScrollToHelpButton() {
  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const elt = document.getElementById('help-ademe');
    if (elt) {
      elt.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  return (
    <div className="fr-my-3w flex justify-center md:justify-end">
      <Button
        className="flex-1 md:flex-none md:flex justify-center"
        iconId="fr-icon-arrow-right-line"
        iconPosition="right"
        onClick={handleClick}
      >
        Je souhaite être accompagné
      </Button>
    </div>
  );
}

export type ResultRowAccordionProps = {
  item: ModeDeChauffageEnriched;
  variant: 'recommended' | 'other';
  index: number;
  dpeFrom: DPE;
  coutParAnGaz: number;
  isOpen: boolean;
  onOpenChange: (expanded: boolean) => void;
};

export const ResultRowAccordion = React.memo(function ResultRowAccordion({
  item,
  variant,
  index,
  dpeFrom,
  coutParAnGaz,
  isOpen,
  onOpenChange,
}: ResultRowAccordionProps) {
  const dpeTo = improveDpe(dpeFrom, item.gainClasse);
  const stars = typeof item.pertinence === 'number' ? item.pertinence : 0;
  const { lowerBoundString, upperBoundString } = getCostPrecisionRange(item.coutParAn ?? 0);
  const gainVsGaz = getGainVsGaz(item, coutParAnGaz);
  return (
    <Accordion
      expanded={isOpen}
      onExpandedChange={(expanded) => onOpenChange(expanded)}
      label={
        <div className={cx('w-full flex gap-4 md:items-center')}>
          <div className="flex-3">
            <div className="flex items-center gap-2">{item.label}</div>
            <Stars value={stars} />
          </div>
          <div className="flex-2 md:text-center hidden md:block">
            <div className="text-(--text-title-blue-france)">
              {lowerBoundString} à {upperBoundString}
            </div>
            <div className="text-sm font-normal text-(--text-default-grey)">coût par an par logement</div>
          </div>
          <div className="flex-2 md:text-center hidden md:block">
            {gainVsGaz}
            <div className="text-sm font-normal text-(--text-default-grey)">par rapport au gaz</div>
          </div>
          <div className="flex-1 justify-center items-center gap-3 hidden md:flex">
            <DpeTag letter={dpeFrom} />
            <span className="text-(--text-default-grey)">→</span>
            <DpeTag letter={dpeTo} />
          </div>
        </div>
      }
      className={cx(index === 0 && 'fr-pt-3w')}
    >
      <MobileStats item={item} dpeFrom={dpeFrom} dpeTo={dpeTo} gainVsGaz={gainVsGaz} />
      <div>{item.description}</div>
      <div className="flex flex-col md:flex-row fr-mt-3w gap-5">
        <div className="flex-1">
          <div className="bg-green-100 rounded fr-p-1w flex items-center">
            <Image src="/icons/icon-thumbs-up.png" alt="icone pouce levé" aria-hidden="true" width="24" height="24" /> Avantages
          </div>
          <ul>
            {item.avantages.map((avantage, key) => (
              <li key={key}>{avantage}</li>
            ))}
          </ul>
        </div>
        <div className="flex-1">
          <div className="bg-yellow-50 rounded fr-p-1w flex items-center">
            <Image src="/icons/icon-thumbs-up.png" alt="icone pouce baissé" aria-hidden="true" width="24" height="24" /> Inconvénients
          </div>
          <ul>
            {item.inconvenients.map((inconvenient, key) => (
              <li key={key}>{inconvenient}</li>
            ))}
          </ul>
        </div>
        <div className="flex-1">
          <div className="bg-yellow-50 rounded fr-p-1w flex items-center">
            <Image src="/icons/icon-wheel.png" alt="icone d'engrenage" aria-hidden="true" width="24" height="24" /> Contraintes techniques
          </div>
          <ul>
            {item.contraintesTechniques.map((contrainteTechnique, key) => (
              <li key={key}>{contrainteTechnique}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="bg-yellow-50 fr-p-1w flex flex-col md:flex-row justify-between items-start">
        <p className="fr-m-0">
          <span className="flex items-center gap-1">
            <Image src="/icons/icon-money.png" alt="icone d'engrenage" aria-hidden="true" width="24" height="24" />
            Coût d’installation : <strong>{item.coutInstallation} par logement.</strong>
          </span>
          <span> Des aides existent (Coup de Pouce, Ma Prime Rénov’...)</span>
        </p>
        <Link href="https://france-renov.gouv.fr/" isExternal className="w-auto">
          Plus d'infos
        </Link>
      </div>
      {variant !== 'recommended' && <ScrollToHelpButton />}
    </Accordion>
  );
});
