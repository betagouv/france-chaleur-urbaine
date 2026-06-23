import { useState } from 'react';

import Button from '@/components/ui/Button';
import { notify } from '@/modules/notification';
import trpc from '@/modules/trpc/client';

type OrganizationCredentialsProps = {
  organizationId: string;
};

const formatDate = (date: Date | string) => new Date(date).toLocaleDateString('fr-FR');

const OrganizationCredentials = ({ organizationId }: OrganizationCredentialsProps) => {
  const utils = trpc.useUtils();
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const { data: credentials, isLoading } = trpc.organizations.admin.credentials.list.useQuery({ organizationId });

  const invalidate = () => {
    void utils.organizations.admin.credentials.list.invalidate({ organizationId });
    void utils.organizations.admin.list.invalidate();
  };

  const createCredential = trpc.organizations.admin.credentials.create.useMutation({
    onSuccess: (res) => {
      setCreatedToken(res.token);
      invalidate();
    },
  });

  const revokeCredential = trpc.organizations.admin.credentials.revoke.useMutation({
    onSuccess: () => {
      invalidate();
      notify('success', 'Token révoqué');
    },
  });

  return (
    <div className="space-y-4">
      <p className="text-sm text-faded">
        Un token authentifie le CRM du gestionnaire sur l'API FCU. Il porte le périmètre de l'organisation et n'est affiché en clair qu'une
        seule fois, à la création.
      </p>

      {createdToken && (
        <div className="rounded border border-green-400 bg-green-50 p-3">
          <div className="mb-1 text-sm font-medium">Nouveau token — copiez-le maintenant, il ne sera plus affiché&nbsp;:</div>
          <code className="block break-all text-sm">{createdToken}</code>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          type="button"
          priority="secondary"
          size="small"
          iconId="ri-add-line"
          disabled={createCredential.isPending}
          onClick={() => createCredential.mutate({ organizationId })}
        >
          Générer un token
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-faded">Chargement…</p>
      ) : credentials && credentials.length > 0 ? (
        <ul className="space-y-2">
          {credentials.map((credential) => (
            <li key={credential.id} className="flex items-center justify-between rounded border border-gray-200 px-3 py-2">
              <div>
                <div className="text-sm">{credential.name ?? 'Token API'}</div>
                <div className="text-xs text-faded">
                  Créé le {formatDate(credential.created_at)}
                  {credential.last_used_at && ` — dernier usage le ${formatDate(credential.last_used_at)}`}
                  {credential.revoked_at && ` — révoqué le ${formatDate(credential.revoked_at)}`}
                </div>
              </div>
              {!credential.revoked_at && (
                <Button
                  type="button"
                  priority="tertiary"
                  size="small"
                  disabled={revokeCredential.isPending}
                  onClick={() => {
                    if (window.confirm("Révoquer ce token ? Le CRM qui l'utilise perdra l'accès immédiatement.")) {
                      revokeCredential.mutate({ id: credential.id });
                    }
                  }}
                >
                  Révoquer
                </Button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-faded">Aucun token. Générez-en un pour permettre l'accès API.</p>
      )}
    </div>
  );
};

export default OrganizationCredentials;
