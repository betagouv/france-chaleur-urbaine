import { Breadcrumb } from '@codegouvfr/react-dsfr/Breadcrumb';
import type { ReactNode } from 'react';

import { clientConfig } from '@/client-config';
import SimplePage from '@/components/shared/page/SimplePage';
import Accordion from '@/components/ui/Accordion';
import Button from '@/components/ui/Button';
import Link from '@/components/ui/Link';
import Section from '@/components/ui/Section';
import { DemandTrackingCard } from '@/modules/demand-tracking/client/DemandTrackingCard';
import { DemandTrackingEmailPreview } from '@/modules/demand-tracking/client/DemandTrackingEmailPreview';
import { SectionIntro } from '@/modules/public-pages/client/ui/SectionIntro';

const EMAIL_CONTENT_ITEMS = [
  { text: "L'adresse indiquée dans votre demande.", title: 'Le bâtiment concerné' },
  { text: "Le statut précis de l'état de votre demande.", title: "L'état de la demande" },
  { text: "Plus d'informations sur le statut.", title: 'Une explication' },
] as const satisfies readonly { text: string; title: string }[];

const DEMAND_STEPS = [
  { text: 'Votre demande est enregistrée par France Chaleur Urbaine.', title: 'Réception' },
  { text: 'Elle est envoyée au gestionnaire du réseau de chaleur ou à un conseiller.', title: 'Transmission' },
  { text: "Vous êtes recontacté·e et d'éventuelles pièces supplémentaires vous sont demandées.", title: 'Contact' },
  { text: 'Votre interlocuteur analyse les possibilités pour votre bâtiment.', title: 'Faisabilité' },
] as const satisfies readonly { text: string; title: string }[];

const NO_EMAIL_FAQ = [
  {
    answer: (
      <>
        Le message est envoyé par France Chaleur Urbaine depuis l'adresse <strong>{clientConfig.noReplyEmail}</strong>. Pensez à consulter
        vos dossiers spam et promotions.
      </>
    ),
    question: 'Vérifiez vos courriers indésirables',
  },
  {
    answer: "Le récapitulatif est envoyé uniquement à l'adresse saisie lors de votre demande. Si vous en utilisez plusieurs, essayez-les.",
    question: 'Essayez une autre adresse email',
  },
  {
    answer: (
      <>
        Écrivez-nous via <Link href="/contact">le formulaire de contact</Link> en précisant l'adresse du bâtiment concerné.
      </>
    ),
    question: 'Toujours rien après 15 minutes ?',
  },
] as const satisfies readonly { answer: ReactNode; question: string }[];

/**
 * Public page "Suivre ma demande": email-based tracking of connection and support demands, without an account.
 */
export default function SuivreMaDemandePage() {
  return (
    <SimplePage
      title="Suivre ma demande"
      description="Recevez par email l'état d'avancement de votre demande de raccordement ou d'accompagnement, sans créer de compte."
      contentWidth="narrow"
    >
      <Section variant="lightaccent" className="bg-(--background-alt-blue-france)! py-2w! md:pt-2w! md:pb-4w!">
        <Breadcrumb currentPageLabel="Suivre ma demande" homeLinkProps={{ href: '/' }} segments={[]} className="mt-0! mb-2!" />
        <h1 className="fr-h2 mb-4">Suivre ma demande</h1>
        <DemandTrackingCard source="page_suivi" />
      </Section>

      <Section size="compact">
        <SectionIntro eyebrow="Votre récapitulatif" title="Ce que vous recevez par email" />
        <div className="mt-6 grid gap-8 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <ol className="m-0 flex list-none flex-col gap-4 p-0">
              {EMAIL_CONTENT_ITEMS.map((item, index) => (
                <li key={item.title} className="flex items-start gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-(--background-alt-blue-france) font-bold text-(--text-title-blue-france)">
                    {index + 1}
                  </span>
                  <span>
                    <span className="block font-bold">{item.title}</span>
                    <span className="block text-sm">{item.text}</span>
                  </span>
                </li>
              ))}
            </ol>
            <p className="mb-0 text-sm italic">
              Plusieurs demandes avec la même adresse email ? Elles sont toutes regroupées dans un seul message.
            </p>
          </div>
          <DemandTrackingEmailPreview />
        </div>
      </Section>

      <Section variant="light" size="compact">
        <SectionIntro eyebrow="Les étapes" title="Où en est votre demande ?" />
        <ol className="mt-6 grid list-none gap-4 p-0 md:grid-cols-4">
          {DEMAND_STEPS.map((step, index) => (
            <li key={step.title} className="flex flex-col gap-2 border border-(--border-default-grey) bg-white p-4">
              <span className="text-xs font-bold uppercase text-(--text-title-blue-france)">Étape {index + 1}</span>
              <span className="text-lg font-bold">{step.title}</span>
              <span className="text-sm">{step.text}</span>
            </li>
          ))}
        </ol>
      </Section>

      <Section size="compact">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="fr-h2 mb-4 font-bold">Vous ne recevez pas l'email ?</h2>
            <div className="fr-accordions-group">
              {NO_EMAIL_FAQ.map((item) => (
                <Accordion key={item.question} label={item.question}>
                  <p className="mb-0">{item.answer}</p>
                </Accordion>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-start gap-4 self-start border border-(--border-default-grey) p-6">
            <h2 className="fr-h4 mb-0">Pas encore de demande ?</h2>
            <p className="mb-0">Testez votre adresse pour découvrir les solutions de chauffage adaptées à votre bâtiment.</p>
            <Button href="/" priority="secondary" iconId="fr-icon-arrow-right-line" iconPosition="right">
              Tester une adresse
            </Button>
          </div>
        </div>
      </Section>
    </SimplePage>
  );
}
