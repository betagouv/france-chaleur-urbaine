import { useState } from 'react';

import { EligibilityFormContact } from '@/components/EligibilityForm';
import CallOut from '@/components/ui/CallOut';
import Dialog from '@/components/ui/Dialog';
import Link from '@/components/ui/Link';
import useIsMobile from '@/hooks/useIsMobile';
import { trackPostHogEvent } from '@/modules/analytics/client';
import { BatEnrBatimentSelection } from '@/modules/chaleur-renouvelable/client/BatEnrBatimentSelection';
import DemandeFCRForm, { type ContactRecipientId } from '@/modules/chaleur-renouvelable/client/DemandFCRForm';
import { useChoixChauffageResults } from '@/modules/chaleur-renouvelable/client/hooks/useChoixChauffageResults';
import { IncompatibleSolutionsSection } from '@/modules/chaleur-renouvelable/client/results/ui/IncompatibleSolutionsSection';
import { NoResultSection } from '@/modules/chaleur-renouvelable/client/results/ui/NoResultSection';
import { RecommendedSolutionCard } from '@/modules/chaleur-renouvelable/client/results/ui/RecommendedSolutionCard';
import { ResultsSection } from '@/modules/chaleur-renouvelable/client/results/ui/ResultsSection';
import DemandSondageForm from '@/modules/demands/client/DemandSondageForm';

import { ParamsForm } from './ParamsForm';

export default function ChoixChauffageResults() {
  const isMobile = useIsMobile();
  const [selectedContactRecipientId, setSelectedContactRecipientId] = useState<ContactRecipientId>('network-manager');
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
    isEligibilityLoading,
    isParamsOpen,
    modesEnriched,
    openAccordionId,
    openHeatNetworkContactModal,
    otherModes,
    recommended,
    setGeoAddress,
    setIsParamsOpen,
    selectedBatEnrBatiment,
    shouldSelectBatEnrBatiment,
    situation,
    urlParams,
  } = useChoixChauffageResults();
  const params = urlParams.params;
  const shouldPreselectPublicAdvisor = Boolean(situation.eligibiliteReseauChaleur);

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
        onSave={urlParams.setParams}
        geoAddress={geoAddress}
        setGeoAddress={setGeoAddress}
        onSelectGeoAddress={handleSelectGeoAddress}
        onSelectBatiment={handleSelectBatEnrBatiment}
        onAddressError={() => {}}
        selectedBatiment={selectedBatEnrBatiment}
      />
      <Dialog title="" open={shouldSelectBatEnrBatiment} size="lg">
        <BatEnrBatimentSelection
          batiments={batEnrBatiments}
          initialCenter={geoAddress?.geometry.coordinates}
          onSelect={handleSelectBatEnrBatiment}
          selectedBatiment={selectedBatEnrBatiment}
        />
      </Dialog>
      {isEligibilityLoading ? (
        <div className="mt-6 border border-gray-200 bg-white px-5 py-6 md:px-10">Chargement des résultats...</div>
      ) : modesEnriched.length > 0 && recommended ? (
        <>
          <RecommendedSolutionCard
            item={recommended}
            coutParAnGaz={coutParAnGaz}
            coutParAnGazHotWaterOnly={coutParAnGazHotWaterOnly}
            dpeFrom={params.dpe}
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
            dpeFrom={params.dpe}
            openAccordionId={openAccordionId}
            situation={situation}
            typeLogement={effectiveTypeLogement}
            onEditParamsClick={handleEditHotWaterParamsClick}
            onOpenChange={handleAccordionOpenChange}
            onCtaClick={() => {
              if (shouldPreselectPublicAdvisor) {
                setSelectedContactRecipientId('public-advisor');
              }
            }}
          />
          <IncompatibleSolutionsSection rows={incompatibleSolutionRows} />
          <DemandeFCRForm
            selectedRecipientId={selectedContactRecipientId}
            setSelectedRecipientId={setSelectedContactRecipientId}
            topSolution={recommended.label}
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
            className="mt-6"
          >
            Nos recommandations sont calculées à partir des informations que vous avez fournies : mode de chauffage, surface moyenne, classe
            DPE, disponibilité d’espaces extérieurs… Ces critères permettent de classer les solutions par pertinence et d’estimer les coûts
            et contraintes techniques propres à votre situation.
            <div className="fr-mt-3w">
              <Link href="/chaleur-renouvelable/methodologie" postHogEventKey="fcr_results:methodology_link_clicked">
                En savoir plus
              </Link>
            </div>
          </CallOut>
          <Dialog
            title=""
            open={contactForm.contactReady}
            size="lg"
            onOpenChange={(open) => {
              if (!open) {
                contactForm.handleResetFormContact();
              }
            }}
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
          </Dialog>
        </>
      ) : (
        <NoResultSection codeInsee={geoAddress?.properties.citycode} />
      )}
    </>
  );
}
