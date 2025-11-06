import { Button } from '@codegouvfr/react-dsfr/Button';
import { Select } from '@codegouvfr/react-dsfr/SelectNext';
import { useEffect, useMemo, useState } from 'react';
import ComboBox, { type ComboBoxOption } from '@/components/ui/ComboBox';

import type { UserRole } from '@/types/enum/UserRole';
import { fetchJSON, postFetchJSON } from '@/utils/network';
import { normalize } from '@/utils/strings';

interface TagOption {
  label: string;
  value: string;
  searchValue: string;
}

const roles = [
  { label: 'Gestionnaire', value: 'gestionnaire' },
  { label: 'Professionnel', value: 'professionnel' },
  { label: 'Particulier', value: 'particulier' },
  { label: 'Démo', value: 'demo' },
] satisfies { label: string; value: UserRole }[];

type ImpersonateUserRole = (typeof roles)[number]['value'];

const UserImpersonation = () => {
  const [selectedRole, setSelectedRole] = useState<ImpersonateUserRole>('gestionnaire');
  const [selectedTagsGestionnaires, setSelectedTagsGestionnaires] = useState<string[]>([]);
  const [allTagsGestionnaires, setAllTagsGestionnaires] = useState<TagOption[]>([]);

  useEffect(() => {
    void (async () => {
      const tags = await fetchJSON<string[]>('/api/admin/tags-gestionnaires');
      setAllTagsGestionnaires(
        tags.sort(Intl.Collator().compare).map((tag) => ({
          label: tag,
          searchValue: normalize(tag),
          value: tag,
        }))
      );
    })();
  }, []);

  const comboTagsOptions: ComboBoxOption[] = useMemo(() => {
    return allTagsGestionnaires.map((opt) => ({ key: opt.value, label: opt.label }));
  }, [allTagsGestionnaires]);

  const handleRoleChange = (newRole: ImpersonateUserRole) => {
    setSelectedRole(newRole);
    if (newRole !== 'gestionnaire') {
      setSelectedTagsGestionnaires([]);
    }
  };

  async function startImpersonation() {
    try {
      await postFetchJSON('/api/admin/impersonate', {
        role: selectedRole,
        ...(selectedRole === 'gestionnaire' && { gestionnaires: selectedTagsGestionnaires }),
      });
      // trigger a full reload
      location.href = '/pro/tableau-de-bord';
    } catch (err) {
      console.error('err', err);
    }
  }

  return (
    <>
      <div className="mb-2w">Cette section permet de vous faire passer pour un autre profil à des fins de test.</div>

      <Select
        label="Rôle"
        className="fr-col-xl-4 fr-col-md-6 fr-mb-2w"
        nativeSelectProps={{
          onChange: (e) => handleRoleChange(e.target.value),
          value: selectedRole,
        }}
        options={roles}
      />

      {selectedRole === 'gestionnaire' && (
        <div className="fr-col-xl-4 fr-col-md-6 fr-mb-2w">
          <ComboBox
            label="Tags gestionnaires"
            options={comboTagsOptions}
            multiple
            value={selectedTagsGestionnaires}
            onChange={setSelectedTagsGestionnaires}
            placeholder="Sélectionner…"
          />
        </div>
      )}

      <Button className="fr-mt-2w" onClick={() => startImpersonation()}>
        Lancer l'imposture
      </Button>
    </>
  );
};

export default UserImpersonation;
