import type { RuleName } from '@betagouv/france-chaleur-urbaine-publicodes';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import useSimulatorEngine from '@/components/ComparateurPublicodes/useSimulatorEngine';
import { EligibilityFormContact } from '@/components/EligibilityForm';
import CallOut from '@/components/ui/CallOut';
import Link from '@/components/ui/Link';
import Modal, { createModal } from '@/components/ui/Modal';
import useContactFormFCU from '@/hooks/useContactFormFCU';
import useIsMobile from '@/hooks/useIsMobile';
import { trackPostHogEvent } from '@/modules/analytics/client';
import type { BANAddressFeature } from '@/modules/ban/types';
import AdemeHelp from '@/modules/chaleur-renouvelable/client/AdemeHelp';
import FranceRenovHelp from '@/modules/chaleur-renouvelable/client/FranceRenovHelp';
import { useAddressEligibility } from '@/modules/chaleur-renouvelable/client/hooks/useAddressEligibility';
import { useChoixChauffageQueryParams } from '@/modules/chaleur-renouvelable/client/hooks/useChoixChauffageQueryParams';
import { useRemoveHashOnScroll } from '@/modules/chaleur-renouvelable/client/hooks/useRemoveHashOnScroll';
import {
  type ModeDeChauffageEnriched,
  modeDeChauffageParTypeLogement,
  type Situation,
} from '@/modules/chaleur-renouvelable/client/modesChauffageData';
import type { DPE, ModeEauChaudeSanitaire, TypeRadiateur } from '@/modules/chaleur-renouvelable/constants';
import DemandSondageForm from '@/modules/demands/client/DemandSondageForm';

import { ParamsForm } from './ParamsForm';
import { ResultRowAccordion, ScrollToHelpButton } from './ResultRowAccordion';

type ResultsSectionProps = {
  title: string;
  items: ModeDeChauffageEnriched[];
  variant: 'recommended' | 'other';
  dpeFrom: DPE;
  openAccordionId: string | null;
  coutParAnGaz: number;
  onHelpButtonClick?: () => void;
  onOpenChange: (id: string, expanded: boolean) => void;
};

const heatNetworkContactModal = createModal({
  id: 'heat-network-contact-modal',
  isOpenedByDefault: false,
});

export default function ChoixChauffageResults() {
  const engine = useSimulatorEngine();
  const engineRef = useRef(engine);
  engineRef.current = engine;
  const isMobile = useIsMobile();
  const urlParams = useChoixChauffageQueryParams();
  useRemoveHashOnScroll('#help-ademe');
  const {
    geoAddress,
    setGeoAddress,
    batEnr,
    codeDepartement,
    eligibiliteReseauChaleur,
    temperatureRef,
    onSelectGeoAddress,
    resetEligibility,
  } = useAddressEligibility(urlParams.adresse ?? null);

  const [isParamsOpen, setIsParamsOpen] = useState(false);
  const [openAccordionId, setOpenAccordionId] = useState<string | null>(null);
  const {
    addressData,
    contactReady,
    messageReceived,
    loadingStatus,
    handleOnSubmitContact,
    handleOnSuccessAddress,
    handleResetFormContact,
  } = useContactFormFCU();

  const situation: Situation = useMemo(
    () => ({
      adresse: urlParams.adresse ?? null,
      dpe: urlParams.dpe,
      eligibiliteReseauChaleur,
      espaceExterieur: urlParams.espaceExterieur ?? 'none',
      geothermiePossible: batEnr.geothermiePossible,
      habitantsMoyen: Number.parseFloat(urlParams.habitantsMoyen || '2'),
      nbLogements: urlParams.nbLogements ?? 25,
      planProtectionAtmosphere: batEnr.planProtectionAtmosphere,
      surfaceMoyenne: urlParams.surfaceMoyenne ?? 70,
    }),
    [
      urlParams.adresse,
      urlParams.dpe,
      urlParams.espaceExterieur,
      urlParams.habitantsMoyen,
      urlParams.nbLogements,
      urlParams.surfaceMoyenne,
      batEnr.geothermiePossible,
      batEnr.planProtectionAtmosphere,
      eligibiliteReseauChaleur,
    ]
  );

  // Pousse la situation dans Publicodes dès qu’elle change
  useEffect(() => {
    if (!codeDepartement) return;

    const modeEauChaudeSanitaire = (urlParams.modeEauChaudeSanitaire ?? 'equipement-chauffage') as ModeEauChaudeSanitaire;
    const currentEngine = engineRef.current;

    currentEngine.setSituation({
      'code département': `'${codeDepartement}'`,
      DPE: `'${situation.dpe}'`,
      'Inclure la climatisation': 'non',
      "Nombre d'habitants moyen par appartement": `${situation.habitantsMoyen}`,
      "nombre de logements dans l'immeuble concerné": situation.nbLogements,
      'Production eau chaude sanitaire': modeEauChaudeSanitaire === 'non' ? 'non' : 'oui',
      'surface logement type tertiaire': `${situation.surfaceMoyenne}`,
      'température de référence chaud commune': temperatureRef,
    });

    if (modeEauChaudeSanitaire === 'non' || modeEauChaudeSanitaire === 'equipement-chauffage') {
      currentEngine.resetField('type de production ECS');
      return;
    }

    currentEngine.setStringField(
      'type de production ECS',
      modeEauChaudeSanitaire === 'chauffe-eau-electrique' ? 'Chauffe-eau électrique' : 'Solaire thermique'
    );
  }, [codeDepartement, situation, temperatureRef, urlParams.modeEauChaudeSanitaire]);

  const typeRadiateur = (urlParams.typeRadiateur ?? null) as TypeRadiateur | null;

  const effectiveTypeLogement = urlParams.typeLogement ?? 'immeuble_chauffage_collectif';

  const modesDeChauffage = useMemo(() => {
    return modeDeChauffageParTypeLogement[effectiveTypeLogement].filter((m) => m.estPossible(situation));
  }, [effectiveTypeLogement, situation]);

  const modesWithCout = useMemo(() => {
    return modesDeChauffage.map((it) => {
      const coutParAn = it.coutParAnPublicodeKey
        ? engine.getFieldAsNumber(`Bilan x ${it.coutParAnPublicodeKey} . total sans installation` as RuleName)
        : 0;
      const coutInstallation =
        typeof it.coutInstallation === 'function' ? it.coutInstallation(situation) : String(it.coutInstallation ?? '0');
      const contraintesTechniques =
        typeof it.contraintesTechniques === 'function' ? it.contraintesTechniques(situation) : it.contraintesTechniques;

      return { ...it, contraintesTechniques, coutInstallation, coutParAn };
    });
  }, [modesDeChauffage, engine]);
  const coutParAnGaz = engine.getFieldAsNumber(`Bilan x Gaz coll sans cond . total avec aides` as RuleName);
  const [recommended, ...others] = modesWithCout;

  const handleAccordionOpenChange = useCallback((id: string, expanded: boolean) => {
    setOpenAccordionId(expanded ? id : null);
    trackPostHogEvent('chaleur-renouvelable:accordeon', { name: id });
    trackPostHogEvent('fcr_simulator:accordion_opened', { chauffage_mode: id });
  }, []);
  const openHeatNetworkContactModal = useCallback(() => {
    if (!geoAddress || !urlParams.adresse || !eligibiliteReseauChaleur) {
      return;
    }

    trackPostHogEvent('simu_multi_enr:methodo_clicked', { chauffage_mode: 'Réseau de chaleur' });

    const [lon, lat] = geoAddress.geometry.coordinates;
    handleOnSuccessAddress(
      {
        address: urlParams.adresse,
        coords: { lat, lon },
        eligibility: eligibiliteReseauChaleur,
        geoAddress,
        heatingType: 'collectif',
      },
      'chaleur-renouvelable'
    );
  }, [eligibiliteReseauChaleur, geoAddress, handleOnSuccessAddress, urlParams.adresse]);
  const handleSelectGeoAddress = useCallback(
    (geoAddress?: BANAddressFeature) => {
      if (!geoAddress) {
        resetEligibility();
        return;
      }
      onSelectGeoAddress(geoAddress);
    },
    [onSelectGeoAddress, resetEligibility]
  );
  const helpButtonClick = recommended?.helpAction === 'open-heat-network-contact' ? openHeatNetworkContactModal : undefined;

  // pendant l’hydration, on évite de rendre conditionnellement (isMobile null)
  if (isMobile === null) return null;

  return (
    <>
      <ParamsForm
        isOpen={isParamsOpen}
        setIsOpen={setIsParamsOpen}
        values={urlParams.simulationParams}
        onSave={urlParams.setSimulationParams}
        geoAddress={geoAddress}
        setGeoAddress={setGeoAddress}
        onSelectGeoAddress={handleSelectGeoAddress}
        onAddressError={() => {}}
      />
      {modesWithCout.length > 0 ? (
        <>
          <ResultsSection
            title="Solution recommandée"
            items={[recommended]}
            variant="recommended"
            coutParAnGaz={coutParAnGaz}
            dpeFrom={urlParams.dpe}
            onHelpButtonClick={helpButtonClick}
            openAccordionId={openAccordionId}
            onOpenChange={handleAccordionOpenChange}
          />
          <ResultsSection
            title="Autres solutions possibles"
            items={others}
            coutParAnGaz={coutParAnGaz}
            variant="other"
            dpeFrom={urlParams.dpe}
            openAccordionId={openAccordionId}
            onOpenChange={handleAccordionOpenChange}
          />
          <CallOut
            title={
              <>
                <span className="fr-icon-lightbulb-line fr-mr-1w" />
                Comment sont calculés ces résultats ?
              </>
            }
            size="lg"
            colorVariant="blue-ecume"
          >
            Nos recommandations sont calculées à partir des informations que vous avez fournies : mode de chauffage, surface moyenne, classe
            DPE, disponibilité d’espaces extérieurs… Ces critères permettent de classer les solutions par pertinence et d’estimer les coûts
            et contraintes techniques propres à votre situation.
            <div className="fr-mt-3w">
              <Link
                postHogEventKey="link:click"
                postHogEventProps={{ link_name: 'cta_comment_calculer_resultat', source: 'chaleur_renouvelable' }}
                href="/chaleur-renouvelable/methodologie"
              >
                En savoir plus
              </Link>
            </div>
          </CallOut>
          <AdemeHelp />
          <Modal
            modal={heatNetworkContactModal}
            title=""
            open={contactReady}
            size="custom"
            loading={loadingStatus === 'loading'}
            onClose={() => {
              handleResetFormContact();
            }}
          >
            <div>
              {contactReady && !messageReceived && (
                <EligibilityFormContact
                  addressData={addressData}
                  className="p-0"
                  onSubmit={(data) => handleOnSubmitContact(data, 'choix-chauffage')}
                />
              )}
              {messageReceived && <DemandSondageForm addressData={addressData} cardMode />}
            </div>
          </Modal>
        </>
      ) : (
        <NoResultSection codeInsee={geoAddress?.properties.citycode} />
      )}
    </>
  );
}

function ResultsSection({
  title,
  items,
  coutParAnGaz,
  variant,
  dpeFrom,
  openAccordionId,
  onHelpButtonClick,
  onOpenChange,
}: ResultsSectionProps) {
  return (
    <>
      <h3 className="fr-mt-6w">{title}</h3>
      <div className="border border-gray-200 bg-white rounded shadow-lg fr-my-3w fr-px-3w fr-pb-3w">
        {items.map((it, i) => {
          const id = it.label;
          return (
            <ResultRowAccordion
              key={id}
              item={it}
              index={i}
              variant={variant}
              coutParAnGaz={coutParAnGaz}
              dpeFrom={dpeFrom}
              isOpen={openAccordionId === id}
              onOpenChange={(expanded) => onOpenChange(id, expanded)}
            />
          );
        })}
        {variant === 'recommended' && <ScrollToHelpButton chauffageMode={items[0].label} onClick={onHelpButtonClick} />}
      </div>
    </>
  );
}

function NoResultSection({ codeInsee }: { codeInsee?: string }) {
  return (
    <>
      <h3>Aucune solution de chauffage alternative n'est adaptée à votre situation actuelle</h3>
      <p>
        Pas d'inquiétude, d'autres actions permettent de réduire vos consommations d'énergie, vos factures et votre impact environnemental :
      </p>
      <ul>
        <li>
          <strong>Isoler votre logement</strong> : toiture, murs, fenêtres, planchers — c'est souvent le geste le plus efficace
        </li>
        <li>
          <strong>Améliorer votre système de ventilation</strong> : une VMC performante améliore la qualité de l'air et limite les pertes de
          chaleur
        </li>
        <li>
          <strong>Optimiser votre chauffage actuel</strong> : entretien de la chaudière, désembouage des radiateurs, installation de
          robinets thermostatiques
        </li>
        <li>
          <strong>Réduire vos consommations d'eau chaude</strong> : mousseurs, pommeaux économes, calorifugeage des tuyaux
        </li>
      </ul>
      <p>Ces travaux peuvent être éligibles à des aides financières (MaPrimeRénov', CEE, éco-prêt à taux zéro).</p>
      <FranceRenovHelp codeInsee={codeInsee} />
    </>
  );
}
