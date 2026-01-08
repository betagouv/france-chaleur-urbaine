import { Alert } from '@codegouvfr/react-dsfr/Alert';
import { Button } from '@codegouvfr/react-dsfr/Button';
import { type FormEvent, useState } from 'react';

import Checkboxes from '@/components/form/dsfr/Checkboxes';
import Input from '@/components/form/dsfr/Input';
import MarkdownWrapper from '@/components/MarkdownWrapper';
import Link from '@/components/ui/Link';
import { useAuthentication } from '@/modules/auth/client/hooks';
import { referrers } from '@/modules/demands/constants';
import { toastErrors } from '@/modules/notification';
import trpc from '@/modules/trpc/client';
import type { AddressDataType } from '@/types/AddressData';
import cx from '@/utils/cx';

const DemandSondageForm = ({ addressData = {}, cardMode }: { addressData: AddressDataType; cardMode?: boolean }) => {
  const [other, setOther] = useState('');
  const [sondage, setSondage] = useState<string[]>([]);
  const [sondageAnswered, setSondageAnswered] = useState(false);
  const { isAuthenticated } = useAuthentication();
  const answer = (choice: (typeof referrers)[number], checked: boolean) => {
    if (!checked) {
      setSondage(sondage.filter((value) => value !== choice.label));
    } else {
      setSondage(Array.from(new Set([...sondage, choice.label])));
    }
  };

  const updateMutation = trpc.demands.user.update.useMutation();

  const sendSondage = toastErrors(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await updateMutation.mutateAsync({
      demandId: addressData.demandId as string,
      values: {
        Sondage: sondage.includes('Autre') ? [...sondage, other] : sondage,
      },
    });

    setSondageAnswered(true);
  });

  const linkToMap =
    addressData?.geoAddress?.geometry?.coordinates && `./carte/?coord=${addressData.geoAddress.geometry.coordinates}&zoom=15`;

  const { structure, computedEligibility } = addressData;

  const message = {
    eligible: {
      body: `
Seul le gestionnaire du réseau pourra vous confirmer la faisabilité technique et les délais du raccordement.
Sans attendre, :extra-link[téléchargez notre guide pratique]{href="/documentation/guide-france-chaleur-urbaine.pdf" eventKey="'Téléchargement|Guide FCU|Confirmation éligibilité'" target="_blank"} afin d'en savoir plus sur les étapes d'un raccordement et les aides financières mobilisables.<br />
Visualisez également notre carte des réseaux de chaleur [ici](${linkToMap}).`,
      bodyCardMode: `
Seul le gestionnaire du réseau pourra vous confirmer la faisabilité technique et les délais du raccordement.
Sans attendre, :extra-link[téléchargez notre guide pratique]{href="/documentation/guide-france-chaleur-urbaine.pdf" eventKey="'Téléchargement|Guide FCU|Confirmation éligibilité'" target="_blank"} afin d'en savoir plus sur les étapes d'un raccordement et les aides financières mobilisables.`,
      title: 'Votre demande de contact est bien prise en compte.',
    },
    ineligible: {
      body: `Visualisez notre carte des réseaux de chaleur [ici](${linkToMap}).`,
      bodyCardMode: '',
      title: 'Votre demande de contact est bien prise en compte.',
    },
  };

  return (
    <>
      <div
        className={cx(
          'bg-[#eeeeee] p-2 pl-4 mb-2 inset-shadow-[8px_0_0_0_var(--border-default-blue-france)]',
          '[&_header]:font-bold',
          cardMode
            ? 'text-[14px] leading-inherit [&_header]:text-[14px] [&_header]:leading-inherit'
            : 'text-[18px] leading-normal [&_header]:text-[23.5px] [&_header]:leading-normal'
        )}
      >
        <header>
          <MarkdownWrapper value={structure ? message?.[computedEligibility ? 'eligible' : 'ineligible']?.title : ''} />
        </header>
        <MarkdownWrapper
          value={structure ? message?.[computedEligibility ? 'eligible' : 'ineligible']?.[cardMode ? 'bodyCardMode' : 'body'] : ''}
        />
      </div>
      <Alert
        severity="info"
        title={isAuthenticated ? 'Suivez vos demandes' : 'Créez un compte pour suivre vos demandes'}
        description={
          isAuthenticated ? (
            <>
              Retrouvez et suivez toutes vos demandes sur votre <Link href="/pro/mes-demandes">espace personnel</Link>.
            </>
          ) : (
            <>
              <Link href={`/connexion?callbackUrl=/pro/mes-demandes`}>Créez un compte ou connectez-vous</Link> pour accéder à un espace
              dédié où vous pourrez retrouver et suivre l'évolution de toutes vos demandes.
            </>
          )
        }
        className="fr-mt-3w"
      />
      {addressData.demandId &&
        (sondageAnswered ? (
          <Alert severity="success" title="Merci pour votre contribution" />
        ) : (
          <div className="fr-grid-row fr-grid-row--center fr-mt-5w">
            <form onSubmit={sendSondage}>
              <h4>Aidez-nous à améliorer notre service :</h4>

              <Checkboxes
                label="Comment avez-vous connu France Chaleur Urbaine ?"
                options={referrers.map((choice) => ({
                  label: choice.label,
                  nativeInputProps: {
                    onClick: (e) => answer(choice, (e.target as any).checked),
                  },
                }))}
              />
              {sondage.includes('Autre') && (
                <Input
                  label=""
                  nativeInputProps={{
                    onChange: (e) => setOther(e.target.value),
                    placeholder: 'Veuillez préciser',
                    required: true,
                    value: other,
                  }}
                />
              )}
              <Button type="submit">Valider</Button>
            </form>
          </div>
        ))}
      <div className="fr-grid-row fr-grid-row--center fr-mt-5w">
        <a className="underline text-white fr-md-auto" href={process.env.NEXT_PUBLIC_FEEDBACK_URL} target="_blank">
          <img
            src="https://voxusagers.numerique.gouv.fr/static/bouton-bleu.svg"
            alt="Je donne mon avis"
            title="Je donne mon avis sur cette démarche"
            loading="lazy"
          />
        </a>
      </div>
    </>
  );
};

export default DemandSondageForm;
