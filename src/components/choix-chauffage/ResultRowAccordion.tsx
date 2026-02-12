import React from 'react';

import { type DPE, DPE_BG, improveDpe, type ModeDeChauffage } from '@/components/choix-chauffage/modesChauffageData';
import Accordion from '@/components/ui/Accordion';
import Button from '@/components/ui/Button';
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
        <span key={i} className="fr-icon-star-fill text-(--background-alt-green-tilleul-verveine-hover)" aria-hidden="true" />
      ))}
    </div>
  );
}

function MobileStats({ item, dpeFrom, dpeTo }: { item: ModeDeChauffage; dpeFrom: DPE; dpeTo: DPE }) {
  return (
    <div className="md:hidden">
      <div className="flex justify-between fr-mb-3w">
        <div>Coût par an par logement</div>
        <div className="text-(--text-title-blue-france)">{item.cout}</div>
      </div>
      <div className="flex justify-between fr-mb-3w">
        <div>Coût par rapport au gaz</div>
        <div className="text-(--text-default-success)">
          <span className="fr-icon-arrow-down-circle-fill fr-mr-1w" aria-hidden="true" />
          <span>Moins {item.gainVsGaz}%</span>
        </div>
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

export type ResultRowAccordionProps = {
  item: ModeDeChauffage;
  variant: 'recommended' | 'other';
  index: number;
  dpeFrom: DPE;
  isOpen: boolean;
  onOpenChange: (expanded: boolean) => void;
};

export const ResultRowAccordion = React.memo(function ResultRowAccordion({
  item,
  variant,
  index,
  dpeFrom,
  isOpen,
  onOpenChange,
}: ResultRowAccordionProps) {
  const dpeTo = improveDpe(dpeFrom, item.gainClasse);
  const stars = typeof item.pertinence === 'number' ? item.pertinence : 0;

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
            <div className="text-(--text-title-blue-france)">{item.cout}</div>
            <div className="text-sm font-normal text-(--text-default-grey)">coût par an par logement</div>
          </div>
          <div className="flex-2 md:text-center hidden md:block">
            <div className="text-(--text-default-success)">
              <span className="fr-icon-arrow-down-circle-fill fr-mr-1w" aria-hidden="true" />
              <span>Moins {item.gainVsGaz}%</span>
            </div>
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
      <MobileStats item={item} dpeFrom={dpeFrom} dpeTo={dpeTo} />
      <div>{item.description}</div>
      <div className="flex flex-col md:flex-row fr-mt-3w gap-5">
        <div className="flex-1">
          <div className="bg-green-100 rounded fr-p-1w">
            <span aria-hidden="true" className="fr-icon-thumb-up-line text-(--text-default-warning)" /> Avantages
          </div>
          <ul>
            {item.avantages.map((avantage, key) => (
              <li key={key}>{avantage}</li>
            ))}
          </ul>
        </div>
        <div className="flex-1">
          <div className="bg-yellow-50 rounded fr-p-1w">
            <span aria-hidden="true" className="fr-icon-thumb-down-line text-(--text-default-warning)" /> Inconvénients
          </div>
          <ul>
            {item.inconvenients.map((inconvenient, key) => (
              <li key={key}>{inconvenient}</li>
            ))}
          </ul>
        </div>
        <div className="flex-1">
          <div className="bg-yellow-50 rounded fr-p-1w">
            <span className="fr-icon-warning-fill text-(--text-default-warning)" aria-hidden="true" /> Contraintes techniques
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
          <span className="fr-icon-money-euro-box-line" aria-hidden="true" /> Coût d’installation :{' '}
          <strong>{item.cout} par logement.</strong>
          {item.aidesInstallation?.length ? <span> Des aides existent (Coup de Pouce, Ma Prime Rénov’...) </span> : ''}
        </p>
        <Link href="https://france-renov.gouv.fr/" isExternal className="w-auto">
          Plus d'infos
        </Link>
      </div>
      {variant !== 'recommended' ? (
        <div className="fr-mt-3w flex justify-end">
          <Button
            iconId="fr-icon-arrow-right-line"
            iconPosition="right"
            onClick={(e) => {
              e.stopPropagation();
              // TODO
              console.log('accompagnement');
            }}
          >
            Je souhaite être accompagné
          </Button>
        </div>
      ) : null}
    </Accordion>
  );
});
