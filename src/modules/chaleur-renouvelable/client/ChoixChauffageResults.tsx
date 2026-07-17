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
import { HeatNetworkContactSteps } from '@/modules/chaleur-renouvelable/client/results/ui/HeatNetworkContactSteps';
import { IncompatibleSolutionsSection } from '@/modules/chaleur-renouvelable/client/results/ui/IncompatibleSolutionsSection';
import { NoResultSection } from '@/modules/chaleur-renouvelable/client/results/ui/NoResultSection';
import { HeatNetworkRecommendedSolutionCard } from '@/modules/chaleur-renouvelable/client/results/ui/RecommendedSolutionCard';
import { ResultsSection } from '@/modules/chaleur-renouvelable/client/results/ui/ResultsSection';
import DemandSubmittedPanel from '@/modules/demands/client/public-forms/DemandSubmittedPanel';

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
    setGeoAddress,
    setIsParamsOpen,
    selectedBatEnrBatiment,
    shouldSelectBatEnrBatiment,
    situation,
    urlParams,
  } = useChoixChauffageResults();
  const params = urlParams.params;
  const shouldPreselectPublicAdvisor = Boolean(situation.eligibiliteReseauChaleur);
  const heatNetworkSolution = situation.eligibiliteReseauChaleur
    ? modesEnriched.find((modeDeChauffage) => modeDeChauffage.id === 'collective-heat-network')
    : undefined;
  const displayedSolutions = heatNetworkSolution
    ? modesEnriched.filter((modeDeChauffage) => modeDeChauffage.id !== heatNetworkSolution.id)
    : modesEnriched;

  const handleSelectContactRecipient = (recipientId: ContactRecipientId) => {
    setSelectedContactRecipientId(recipientId);
    requestAnimationFrame(() => {
      document.getElementById('help-ademe')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  if (isMobile === null) {
    return null;
  }

  return (
    <>
      <ParamsForm
        batiments={batEnrBatiments}
        isOpen={isParamsOpen}
        setIsOpen={setIsParamsOpen}
        values={urlParams.params}
        onSave={urlParams.setParams}
        geoAddress={geoAddress}
        setGeoAddress={setGeoAddress}
        onSelectGeoAddress={handleSelectGeoAddress}
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
      ) : modesEnriched.length > 0 ? (
        <>
          {heatNetworkSolution && (
            <>
              <HeatNetworkRecommendedSolutionCard
                item={heatNetworkSolution}
                coutParAnGaz={coutParAnGaz}
                coutParAnGazHotWaterOnly={coutParAnGazHotWaterOnly}
                dpeFrom={params.dpe}
                geoAddress={geoAddress}
                isOpen={openAccordionId === undefined || openAccordionId === heatNetworkSolution.id}
                onOpenChange={(expanded) => {
                  if (expanded) {
                    trackPostHogEvent('fcr_results:recommended_solution_expanded', { solution_type: heatNetworkSolution.label });
                  }
                  handleAccordionOpenChange(heatNetworkSolution.id, expanded);
                }}
                selectedBatiment={selectedBatEnrBatiment}
                situation={situation}
              />
              <HeatNetworkContactSteps onSelectRecipient={handleSelectContactRecipient} />
            </>
          )}
          <ResultsSection
            items={displayedSolutions}
            coutParAnGaz={coutParAnGaz}
            coutParAnGazHotWaterOnly={coutParAnGazHotWaterOnly}
            dpeFrom={params.dpe}
            openAccordionId={openAccordionId}
            shouldOpenFirstItemByDefault={!heatNetworkSolution}
            situation={situation}
            title={heatNetworkSolution ? undefined : 'Solutions possibles'}
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
            topSolution={heatNetworkSolution?.label ?? modesEnriched[0]?.label ?? ''}
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
              <Link href="/chaleur-renouvelable/methodologie" postHogEventKey="fcr_results:methodology_link_clicked" isExternal>
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
              {contactForm.messageReceived && contactForm.addressData.submissionResult && (
                <DemandSubmittedPanel submissionResult={contactForm.addressData.submissionResult} />
              )}
            </div>
          </Dialog>
        </>
      ) : (
        <NoResultSection />
      )}
    </>
  );
}
