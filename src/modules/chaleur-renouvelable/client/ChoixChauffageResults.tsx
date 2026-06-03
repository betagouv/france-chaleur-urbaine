import { EligibilityFormContact } from '@/components/EligibilityForm';
import CallOut from '@/components/ui/CallOut';
import Link from '@/components/ui/Link';
import Modal, { createModal } from '@/components/ui/Modal';
import useIsMobile from '@/hooks/useIsMobile';
import { trackPostHogEvent } from '@/modules/analytics/client';
import { BatEnrBatimentSelection } from '@/modules/chaleur-renouvelable/client/BatEnrBatimentSelection';
import DemandeFCRForm from '@/modules/chaleur-renouvelable/client/DemandFCRForm';
import { useChoixChauffageResults } from '@/modules/chaleur-renouvelable/client/hooks/useChoixChauffageResults';
import { IncompatibleSolutionsSection } from '@/modules/chaleur-renouvelable/client/results/IncompatibleSolutionsSection';
import { NoResultSection } from '@/modules/chaleur-renouvelable/client/results/NoResultSection';
import { RecommendedSolutionCard } from '@/modules/chaleur-renouvelable/client/results/RecommendedSolutionCard';
import { ResultsSection } from '@/modules/chaleur-renouvelable/client/results/ResultsSection';
import DemandSondageForm from '@/modules/demands/client/DemandSondageForm';

import { ParamsForm } from './ParamsForm';

const heatNetworkContactModal = createModal({
  id: 'heat-network-contact-modal',
  isOpenedByDefault: false,
});

const batEnrBatimentSelectionModal = createModal({
  id: 'bat-enr-batiment-selection-modal',
  isOpenedByDefault: false,
});

export default function ChoixChauffageResults() {
  const isMobile = useIsMobile();
  const {
    batEnrBatiments,
    contactForm,
    coutParAnGaz,
    coutParAnGazHotWaterOnly,
    effectiveTypeLogement,
    geoAddress,
    handleAccordionOpenChange,
    handleEditHotWaterParamsClick,
    handleSelectBatEnrBatiment,
    handleSelectGeoAddress,
    incompatibleSolutionRows,
    isParamsOpen,
    modesEnriched,
    openAccordionId,
    openHeatNetworkContactModal,
    otherModes,
    recommended,
    setGeoAddress,
    setIsParamsOpen,
    shouldSelectBatEnrBatiment,
    situation,
    urlParams,
  } = useChoixChauffageResults();

  if (isMobile === null) {
    return null;
  }

  return (
    <>
      <ParamsForm
        batiments={batEnrBatiments}
        isOpen={isParamsOpen}
        setIsOpen={setIsParamsOpen}
        values={urlParams.simulationParams}
        onSave={urlParams.setSimulationParams}
        geoAddress={geoAddress}
        setGeoAddress={setGeoAddress}
        onSelectGeoAddress={handleSelectGeoAddress}
        onSelectBatiment={handleSelectBatEnrBatiment}
        onAddressError={() => {}}
      />
      <Modal modal={batEnrBatimentSelectionModal} title="" open={shouldSelectBatEnrBatiment} size="custom" lazy isClosableByUser={false}>
        <BatEnrBatimentSelection
          batiments={batEnrBatiments}
          initialCenter={geoAddress?.geometry.coordinates}
          onSelect={handleSelectBatEnrBatiment}
        />
      </Modal>
      {modesEnriched.length > 0 && recommended ? (
        <>
          <RecommendedSolutionCard
            item={recommended}
            coutParAnGaz={coutParAnGaz}
            coutParAnGazHotWaterOnly={coutParAnGazHotWaterOnly}
            dpeFrom={urlParams.dpe}
            geoAddress={geoAddress}
            isOpen={openAccordionId === recommended.label}
            onHelpButtonClick={recommended.helpAction === 'open-heat-network-contact' ? openHeatNetworkContactModal : undefined}
            onOpenChange={(expanded) => {
              if (expanded) {
                trackPostHogEvent('fcr_results:recommended_solution_expanded', { solution_type: recommended.label });
              }
              handleAccordionOpenChange(recommended.label, expanded);
            }}
            situation={situation}
          />
          <ResultsSection
            items={otherModes}
            coutParAnGaz={coutParAnGaz}
            coutParAnGazHotWaterOnly={coutParAnGazHotWaterOnly}
            dpeFrom={urlParams.dpe}
            openAccordionId={openAccordionId}
            situation={situation}
            typeLogement={effectiveTypeLogement}
            onEditParamsClick={handleEditHotWaterParamsClick}
            onOpenChange={handleAccordionOpenChange}
          />
          <IncompatibleSolutionsSection rows={incompatibleSolutionRows} />
          <DemandeFCRForm topSolution={recommended.label} />
          <CallOut
            title={
              <>
                <span className="fr-icon-lightbulb-line fr-mr-1w" />
                Comment sont calculés ces résultats ?
              </>
            }
            size="lg"
            colorVariant="blue-ecume"
            className="mt-6"
          >
            Nos recommandations sont calculées à partir des informations que vous avez fournies : mode de chauffage, surface moyenne, classe
            DPE, disponibilité d’espaces extérieurs… Ces critères permettent de classer les solutions par pertinence et d’estimer les coûts
            et contraintes techniques propres à votre situation.
            <div className="fr-mt-3w">
              <Link href="/chaleur-renouvelable/methodologie" onClick={() => trackPostHogEvent('fcr_results:methodology_link_clicked')}>
                En savoir plus
              </Link>
            </div>
          </CallOut>
          <Modal
            modal={heatNetworkContactModal}
            title=""
            open={contactForm.contactReady}
            size="custom"
            loading={contactForm.loadingStatus === 'loading'}
            onClose={contactForm.handleResetFormContact}
          >
            <div>
              {contactForm.contactReady && !contactForm.messageReceived && (
                <EligibilityFormContact
                  addressData={contactForm.addressData}
                  className="p-0"
                  onSubmit={(data) => contactForm.handleOnSubmitContact(data, 'choix-chauffage')}
                />
              )}
              {contactForm.messageReceived && <DemandSondageForm addressData={contactForm.addressData} cardMode />}
            </div>
          </Modal>
        </>
      ) : (
        <NoResultSection codeInsee={geoAddress?.properties.citycode} />
      )}
    </>
  );
}
