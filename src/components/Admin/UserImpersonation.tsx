import { Button } from '@codegouvfr/react-dsfr/Button';
import { Select } from '@codegouvfr/react-dsfr/SelectNext';
import Tag from '@codegouvfr/react-dsfr/Tag';
import { useEffect, useMemo, useState } from 'react';

import Box from '@/components/ui/Box';
import { fetchJSON, postFetchJSON } from '@/utils/network';
import { normalize } from '@/utils/strings';

interface TagOption {
  label: string;
  value: string;
  searchValue: string;
}

const UserImpersonation = () => {
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

  async function startImpersonation() {
    try {
      await postFetchJSON('/api/admin/impersonate', {
        role: 'gestionnaire', // will probably change in the future
        gestionnaires: selectedTagsGestionnaires,
      });
      // trigger a full reload
      location.href = '/pro/demandes';
    } catch (err) {
      console.error('err', err);
    }
  }

  return (
    <>
      <div className="mb-2w">
        Cette section permet de vous faire passer pour un profil gestionnaire avec des tags particuliers à des fins de test.
      </div>

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

      <Box className="fr-col-xl-4 fr-col-md-6">
        <Select
          label="Tags gestionnaires"
          options={selectTagsOptions.map(({ searchValue, ...option }) => option)}
          nativeSelectProps={{
            onChange: (e) => setSelectedTagsGestionnaires([...selectedTagsGestionnaires, e.target.value]),
          }}
        />
      </Box>
      <Button className="fr-mt-2w" onClick={() => startImpersonation()}>
        Lancer l'imposture
      </Button>
    </>
  );
};

export default UserImpersonation;
