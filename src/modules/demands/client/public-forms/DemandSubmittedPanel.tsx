import { type ReactNode, useEffect, useRef } from 'react';

import { clientConfig } from '@/client-config';
import Button from '@/components/ui/Button';
import Link from '@/components/ui/Link';
import { businessRules } from '@/modules/app/business-rules';
import { useAuthentication } from '@/modules/auth/client/hooks';
import DemandStatusBadge from '@/modules/demands/client/DemandStatusBadge';
import type { DemandSubmissionResult } from '@/modules/demands/constants';

const formatDemandDate = (isoDate: string) => {
  const date = new Date(isoDate);
  const day = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h');
  return `${day} à ${time}`;
};

export type DemandSubmittedPanelProps = {
  submissionResult: DemandSubmissionResult;
};

/**
 * Écran affiché après soumission d'une demande de mise en relation (espace public).
 * Deux cas : demande nouvellement enregistrée, ou demande déjà déposée (même email + adresse < 30 jours).
 */
function DemandSubmittedPanel({ submissionResult }: DemandSubmittedPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Le panneau remplace un formulaire long dans une modale DSFR : sans ça, le scroll reste en bas (no-op hors modale).
  useEffect(() => {
    containerRef.current?.closest('.fr-modal__body')?.scrollTo({ top: 0 });
  }, []);

  return (
    <div ref={containerRef}>
      {submissionResult.isExisting ? (
        <ExistingDemandPanel submissionResult={submissionResult} />
      ) : (
        <NewDemandPanel submissionResult={submissionResult} />
      )}
    </div>
  );
}

export default DemandSubmittedPanel;

function NewDemandPanel({ submissionResult }: { submissionResult: DemandSubmissionResult }) {
  const networkLabel =
    submissionResult.isEligible && submissionResult.networkName
      ? `${submissionResult.networkName}${submissionResult.distance != null ? ` (~${Math.round(submissionResult.distance)} m)` : ''}`
      : null;

  return (
    <div className="flex flex-col gap-5">
      <PanelHeader
        iconClassName="fr-icon-checkbox-circle-fill text-(--text-default-success)"
        title="Demande de mise en relation bien reçue"
      />

      <EmailNotice>
        Un e-mail de confirmation vient de vous être envoyé via <strong>{clientConfig.noReplyEmail}</strong>. Pensez à vérifier vos spams.
      </EmailNotice>

      <div className="flex flex-col gap-2">
        <p className="fr-text--xs font-bold uppercase text-(--text-mention-grey) mb-0">Prochaines étapes :</p>
        <NextStep>
          <strong>À proximité d'un réseau,</strong> votre demande est transmise au gestionnaire, qui vous recontactera pour étudier le
          raccordement de votre bâtiment.
        </NextStep>
        <NextStep>
          <strong>Sinon,</strong> nous informons la collectivité de votre intérêt pour le réseau de chaleur.
        </NextStep>
      </div>

      <RecapTable
        title="Accusé de réception"
        rows={[
          { label: 'Adresse', value: submissionResult.address },
          { label: "Date d'envoi", value: formatDemandDate(submissionResult.createdAt) },
          ...(networkLabel ? [{ label: 'Réseau proche', value: networkLabel }] : []),
        ]}
      />

      <InfoCallout>
        <strong>Inutile de renvoyer votre demande.</strong> Elle est enregistrée, vous serez recontacté·e directement.
      </InfoCallout>

      <PersonalSpaceButton />

      <div className="flex items-center gap-3 border border-(--border-default-grey) p-4">
        <span className="fr-icon-download-line text-(--text-action-high-blue-france) shrink-0" aria-hidden="true" />
        <div>
          <Link
            href="/documentation/guide-france-chaleur-urbaine.pdf"
            eventKey="Téléchargement|Guide FCU|Confirmation éligibilité"
            postHogEventKey="content:click"
            postHogEventProps={{ content_name: 'Guide Copropriétés', content_type: 'guide', source: 'confirmation-demande' }}
            isExternal
          >
            Téléchargez notre guide pratique du raccordement
          </Link>
          <p className="fr-text--xs text-(--text-mention-grey) mb-0 mt-2">
            Les étapes d'un raccordement et les aides financières mobilisables en PDF.
          </p>
        </div>
      </div>
    </div>
  );
}

function ExistingDemandPanel({ submissionResult }: DemandSubmittedPanelProps) {
  return (
    <div className="flex flex-col gap-5">
      <PanelHeader iconClassName="fr-icon-info-fill text-(--text-action-high-blue-france)" title="Demande déjà enregistrée" />

      <div className="flex flex-col gap-1">
        <p className="font-bold mb-0">
          Vous avez déjà déposé une demande pour cette adresse au cours des {businessRules.demandDedupWindowDays.value} derniers jours.
        </p>
        <p className="mb-0">
          Cette nouvelle demande n'a donc pas été prise en compte : inutile de la renvoyer, votre demande a déjà été enregistrée. Veuillez
          consulter son statut ci-dessous.
        </p>
      </div>

      <RecapTable
        title="Votre dernière demande"
        rows={[
          { label: 'Adresse', value: submissionResult.address },
          { label: 'Demande déposée le', value: formatDemandDate(submissionResult.createdAt) },
          { label: 'Statut', value: <DemandStatusBadge status={submissionResult.status} audience="demandeur" /> },
        ]}
      />

      <EmailNotice>
        Un e-mail de confirmation vous a déjà été envoyé via <strong>{clientConfig.noReplyEmail}</strong>. Pensez à vérifier vos spams.
      </EmailNotice>

      <InfoCallout>
        <strong>Suivez l'évolution de votre demande depuis votre espace personnel France Chaleur Urbaine.</strong>
        <br />
        Toujours pas de réponse du gestionnaire sous 30 jours ? Signalez-le nous directement depuis votre espace personnel.
      </InfoCallout>

      <PersonalSpaceButton />
    </div>
  );
}

type PanelHeaderProps = {
  iconClassName: string;
  title: string;
};

function PanelHeader({ iconClassName, title }: PanelHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <span className={`${iconClassName} fr-icon--lg shrink-0`} aria-hidden="true" />
      <h2 className="fr-h4 mb-0">{title}</h2>
    </div>
  );
}

type EmailNoticeProps = {
  children: ReactNode;
};

function EmailNotice({ children }: EmailNoticeProps) {
  return (
    <div className="flex items-start gap-2 p-4 bg-(--background-alt-blue-france)">
      <span className="fr-icon-mail-unread-line text-(--text-action-high-blue-france) shrink-0 mt-0.5" aria-hidden="true" />
      <p className="mb-0">{children}</p>
    </div>
  );
}

type InfoCalloutProps = {
  children: ReactNode;
};

function InfoCallout({ children }: InfoCalloutProps) {
  return (
    <div className="flex items-start gap-3 border border-(--border-default-grey) border-l-4 border-l-(--border-action-high-blue-france) p-4">
      <span className="fr-icon-information-line text-(--text-action-high-blue-france) shrink-0 mt-0.5" aria-hidden="true" />
      <p className="mb-0">{children}</p>
    </div>
  );
}

type NextStepProps = {
  children: ReactNode;
};

function NextStep({ children }: NextStepProps) {
  return (
    <div className="flex items-start gap-2">
      <span className="fr-icon-check-line text-(--text-default-success) shrink-0 mt-0.5" aria-hidden="true" />
      <p className="mb-0">{children}</p>
    </div>
  );
}

type RecapTableProps = {
  title: string;
  rows: { label: string; value: ReactNode }[];
};

function RecapTable({ title, rows }: RecapTableProps) {
  return (
    <div className="border border-(--border-default-grey)">
      <p className="fr-text--xs font-bold uppercase text-(--text-mention-grey) bg-(--background-contrast-grey) px-3 py-2 mb-0">{title}</p>
      <div className="divide-y divide-(--border-default-grey)">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 px-3 py-2">
            <span className="text-(--text-mention-grey)">{row.label}</span>
            <span className="font-bold text-right">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PersonalSpaceButton() {
  const { isAuthenticated } = useAuthentication();
  const href = isAuthenticated ? '/pro/mes-demandes' : '/connexion?callbackUrl=/pro/mes-demandes';

  return (
    <Button href={href} iconId="fr-icon-arrow-right-line" iconPosition="right" className="self-start">
      Accéder à mon espace personnel
    </Button>
  );
}
