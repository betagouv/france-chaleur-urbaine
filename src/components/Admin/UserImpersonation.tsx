import { Button } from '@codegouvfr/react-dsfr/Button';
import { Select } from '@codegouvfr/react-dsfr/SelectNext';
import Tag from '@codegouvfr/react-dsfr/Tag';
import { useEffect, useMemo, useState } from 'react';

import { type UserRole } from '@/types/enum/UserRole';
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
] satisfies { label: string; value: UserRole }[];

type ImpersonateUserRole = (typeof roles)[number]['value'];

const UserImpersonation = () => {
  const [selectedRole, setSelectedRole] = useState<ImpersonateUserRole>('gestionnaire');
  const [selectedTagsGestionnaires, setSelectedTagsGestionnaires] = useState<string[]>([]);
  const [allTagsGestionnaires, setAllTagsGestionnaires] = useState<TagOption[]>([]);

  useEffect(() => {
    (async () => {
      const tags = await fetchJSON<string[]>('/api/admin/tags-gestionnaires');
      setAllTagsGestionnaires(
        tags.sort(Intl.Collator().compare).map((tag) => ({
          label: tag,
          value: tag,
          searchValue: normalize(tag),
        }))
      );
    })();
  }, []);

  const selectTagsOptions = useMemo(() => {
    return [
      {
        label: 'Sélectionner les tags gestionnaires',
        value: '',
        searchValue: '',
        disabled: true,
      },
      ...allTagsGestionnaires,
    ];
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
          value: selectedRole,
          onChange: (e) => handleRoleChange(e.target.value),
        }}
        options={roles}
      />

      {selectedRole === 'gestionnaire' && (
        <>
          {selectedTagsGestionnaires.map((tag, index) => (
            <Tag
              key={tag}
              dismissible
              small
              className="fr-mr-1v fr-mb-1w"
              nativeButtonProps={{
                onClick: () => {
                  selectedTagsGestionnaires.splice(index, 1);
                  setSelectedTagsGestionnaires([...selectedTagsGestionnaires]);
                },
              }}
            >
              {tag}
            </Tag>
          ))}

          <div className="fr-col-xl-4 fr-col-md-6">
            <Select
              label="Tags gestionnaires"
              options={selectTagsOptions.map(({ searchValue, ...option }) => option)}
              nativeSelectProps={{
                onChange: (e) => setSelectedTagsGestionnaires([...selectedTagsGestionnaires, e.target.value]),
              }}
            />
          </div>
        </>
      )}

      <Button className="fr-mt-2w" onClick={() => startImpersonation()}>
        Lancer l'imposture
      </Button>
    </>
  );
};

export default UserImpersonation;
