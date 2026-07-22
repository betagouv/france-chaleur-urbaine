import { keepPreviousData, skipToken } from '@tanstack/react-query';
import { parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs';
import { useMemo } from 'react';

import SimplePage from '@/components/shared/page/SimplePage';
import Box from '@/components/ui/Box';
import Heading from '@/components/ui/Heading';
import Text from '@/components/ui/Text';
import { emailTriggerTypeBadgeClasses, emailTriggerTypeLabels } from '@/modules/email/constants';
import trpc from '@/modules/trpc/client';
import cx from '@/utils/cx';

const viewModes = ['html', 'text'] as const;

const EmailsPage = () => {
  const { data: emails, isLoading: isLoadingList } = trpc.email.list.useQuery();

  const [{ type, scenario, view }, setQuery] = useQueryStates({
    scenario: parseAsString,
    type: parseAsString,
    view: parseAsStringLiteral(viewModes).withDefault('html'),
  });

  const groupedEmails = useMemo(() => {
    if (!emails) return [];
    const groups = new Map<string, typeof emails>();
    for (const email of emails) {
      const moduleName = email.type.split('.')[0];
      if (!groups.has(moduleName)) groups.set(moduleName, []);
      groups.get(moduleName)!.push(email);
    }
    return Array.from(groups.entries()).map(([name, items]) => ({ items, name }));
  }, [emails]);

  const selectedEmail = emails?.find((e) => e.type === type) ?? emails?.[0];
  const selectedScenarioKey = selectedEmail?.scenarios.find((s) => s.key === scenario)?.key ?? selectedEmail?.scenarios[0]?.key;

  const { data: preview, isFetching: isLoadingPreview } = trpc.email.preview.useQuery(
    selectedEmail && selectedScenarioKey ? { scenarioKey: selectedScenarioKey, type: selectedEmail.type } : skipToken,
    { placeholderData: keepPreviousData }
  );

  return (
    <SimplePage title="Modèles d'emails" mode="authenticated">
      <Box py="4w" className="fr-container-fluid px-6">
        <Heading as="h1" color="blue-france">
          Modèles d'emails
        </Heading>
        <Text className="mb-6">
          Aperçu des emails envoyés par l'application aux utilisateurs et à l'équipe France Chaleur Urbaine, avec les différents cas de
          figure pris en compte par chaque modèle. Pour modifier un modèle, il faut demander aux développeurs. 😊
        </Text>

        {isLoadingList ? (
          <Text>Chargement…</Text>
        ) : (
          <div className="flex flex-col md:flex-row gap-6">
            <aside className="md:w-80 shrink-0">
              <nav className="flex flex-col gap-4">
                {groupedEmails.map((group) => (
                  <div key={group.name}>
                    <div className="text-xs font-bold uppercase text-faded mb-2 tracking-wider">{group.name}</div>
                    <div className="flex flex-col">
                      {group.items.map((email) => {
                        const isActive = email.type === selectedEmail?.type;
                        return (
                          <button
                            key={email.type}
                            type="button"
                            onClick={() => setQuery({ scenario: null, type: email.type, view: 'html' })}
                            className={cx(
                              'w-full text-left px-3 py-2 border-l-2 transition-colors',
                              isActive
                                ? 'bg-(--background-action-low-blue-france) border-(--border-active-blue-france)'
                                : 'border-transparent hover:bg-(--background-alt-grey)'
                            )}
                          >
                            <div className="text-base font-medium">{email.label}</div>
                            <div className="text-xs text-faded font-mono mt-0.5">{email.type}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>
            </aside>

            <section className="flex-1 min-w-0">
              {selectedEmail ? (
                <Box className="border border-(--border-default-grey)">
                  <div className="p-4 border-b border-(--border-default-grey)">
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <h2 className="text-xl font-semibold m-0">{selectedEmail.label}</h2>
                      <code className="text-xs text-faded">{selectedEmail.type}</code>
                    </div>
                    <p className="text-sm mt-2 mb-0 text-faded">{selectedEmail.description}</p>
                    <p className="text-sm mt-2 mb-0">
                      <span className={cx('fr-badge fr-badge--sm mr-2', emailTriggerTypeBadgeClasses[selectedEmail.trigger.type])}>
                        {emailTriggerTypeLabels[selectedEmail.trigger.type]}
                      </span>
                      <span className="text-faded">{selectedEmail.trigger.description}</span>
                    </p>
                  </div>

                  {selectedEmail.scenarios.length > 1 && (
                    <div className="p-4 border-b border-(--border-default-grey) flex flex-wrap items-center gap-2">
                      <label htmlFor="scenario-select" className="text-sm font-semibold">
                        Scénario :
                      </label>
                      <select
                        id="scenario-select"
                        className="fr-select max-w-full"
                        value={selectedScenarioKey ?? ''}
                        onChange={(e) => setQuery({ scenario: e.target.value })}
                      >
                        {selectedEmail.scenarios.map((s) => (
                          <option key={s.key} value={s.key}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="p-4">
                    <div className="bg-(--background-alt-grey) px-4 py-2 border border-(--border-default-grey) border-b-0 text-sm">
                      <span className="font-semibold">Sujet : </span>
                      {selectedEmail.subject || <span className="italic text-faded">(Sans sujet)</span>}
                    </div>
                    <div className="border border-(--border-default-grey) bg-(--background-alt-grey) px-4 py-2 flex gap-2">
                      {viewModes.map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setQuery({ view: mode })}
                          className={cx(
                            'px-3 py-1 text-sm',
                            view === mode
                              ? 'bg-(--background-action-high-blue-france) text-(--text-inverted-blue-france)'
                              : 'bg-white hover:bg-(--background-contrast-grey)'
                          )}
                        >
                          {mode === 'html' ? 'HTML' : 'Texte brut'}
                        </button>
                      ))}
                    </div>
                    <div className="relative">
                      {isLoadingPreview && (
                        <div className="absolute top-2 right-2 z-1 text-xs text-faded bg-white px-2 py-1 border border-(--border-default-grey)">
                          Mise à jour…
                        </div>
                      )}
                      <iframe
                        title={`Aperçu ${selectedEmail.type}`}
                        srcDoc={preview?.html ?? ''}
                        sandbox="allow-same-origin"
                        className={cx(
                          'w-full h-[800px] border border-(--border-default-grey) border-t-0 bg-white',
                          view !== 'html' && 'hidden'
                        )}
                      />
                      <pre
                        className={cx(
                          'text-sm bg-white border border-(--border-default-grey) border-t-0 p-4 overflow-auto whitespace-pre-wrap m-0 min-h-[800px]',
                          view !== 'text' && 'hidden'
                        )}
                      >
                        {preview?.text ?? ''}
                      </pre>
                    </div>
                  </div>
                </Box>
              ) : (
                <Text>Aucun modèle disponible.</Text>
              )}
            </section>
          </div>
        )}
      </Box>
    </SimplePage>
  );
};

export default EmailsPage;
