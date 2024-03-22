import { Button, Container, Icon, Select } from '@dataesr/react-dsfr';
import Heading from '@components/ui/Heading';
import { fetchJSON, postFetchJSON } from '@utils/network';
import { useEffect, useMemo, useState } from 'react';
import Text from '@components/ui/Text';
import Box from '@components/ui/Box';
import { normalize } from '@utils/strings';

interface TagOption {
  label: string;
  value: string;
  searchValue: string;
}

const UserImpersonation = () => {
  const [selectedTagsGestionnaires, setSelectedTagsGestionnaires] = useState<
    string[]
  >([]);
  const [allTagsGestionnaires, setAllTagsGestionnaires] = useState<TagOption[]>(
    []
  );

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
      location.href = '/gestionnaire';
    } catch (err) {
      console.error('err', err);
    }
  }

  return (
    <Container>
      <Box p="2w">
        <Heading size="h3">
          <Icon name="ri-spy-line" />
          Impostures
        </Heading>

        <Text mb="2w">
          Cette section permet de vous faire passer pour un profil gestionnaire
          avec des tags particuliers à des fins de test.
        </Text>

        {selectedTagsGestionnaires.map((tag, index) => (
          <button
            key={index}
            title="Retirer ce tag"
            className="fr-tag fr-tag--sm fr-tag--dismiss fr-mr-1v"
            onClick={() => {
              selectedTagsGestionnaires.splice(index, 1);
              setSelectedTagsGestionnaires([...selectedTagsGestionnaires]);
            }}
          >
            {tag}
            <Icon iconPosition="right" name="ri-close-line" size="lg" />
          </button>
        ))}

        <Box className="fr-col-xl-4 fr-col-md-6">
          <Select
            label="Tags gestionnaires"
            options={selectTagsOptions}
            onChange={(e) =>
              setSelectedTagsGestionnaires([
                ...selectedTagsGestionnaires,
                e.target.value,
              ])
            }
          />
        </Box>
        <Button className="fr-mt-2w" onClick={() => startImpersonation()}>
          Lancer l'imposture
        </Button>
      </Box>
    </Container>
  );
};

export default UserImpersonation;
