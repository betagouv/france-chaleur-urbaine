import { useQueryState } from 'nuqs';
import { useEffect, useRef, useState } from 'react';

import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Loader from '@/components/ui/Loader';
import useCrud from '@/hooks/useCrud';
import { type ProComparateurConfigurationResponse } from '@/pages/api/pro/comparateur/configurations/[[...slug]]';
import { trackEvent } from '@/services/analytics';
import { notify } from '@/services/notification';
import cx from '@/utils/cx';
import { sortKeys } from '@/utils/objects';

const ConfigurationDropdown = ({
  configuration,
  onLoadConfiguration,
  loadWhenOnlyOneConfig,
}: {
  configuration: Record<string, any>;
  onLoadConfiguration: (configuration: Record<string, any>) => void;
  loadWhenOnlyOneConfig: boolean;
}) => {
  const [loaded, setLoaded] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [newConfigName, setNewConfigName] = useState<string>('');
  const [renamingConfig, setRenamingConfig] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState<string>('');
  const [sharingId, setSharingId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { address, ...situation } = configuration;
  const situationEmpty = Object.keys(situation).length === 0;
  const [sharedConfigId, setSharedConfigId] = useQueryState('configId');

  const {
    items,
    create: createConfiguration,
    isCreating,
    update: updateConfiguration,
    isUpdatingId,
    delete: deleteConfiguration,
    isDeletingId,
    isLoading,
    get: getConfiguration,
  } = useCrud<ProComparateurConfigurationResponse>('/api/pro/comparateur/configurations');

  const configs = items || [];

  const loadSituation = (configId: string) => {
    const { situation } = configs.find((config) => config.id === configId) as NonNullable<
      ProComparateurConfigurationResponse['list']['items']
    >[number];
    trackEvent('Comparateur Coûts CO2|Chargement d’une configuration sauvegardée', {
      configId,
    });
    setIsOpen(false);
    onLoadConfiguration(situation);
  };

  useEffect(() => {
    if (!sharedConfigId) {
      return;
    }
    (async () => {
      const { item: config } = await getConfiguration(sharedConfigId);
      const { situation: { address, ...sharedConfigSituation } = {} as any } = config || {};
      trackEvent('Comparateur Coûts CO2|Chargement d’une configuration partagée', {
        configId: sharedConfigId,
      });
      onLoadConfiguration(sharedConfigSituation);
      setSharedConfigId(null);
    })();
  }, [sharedConfigId, loadSituation]);

  useEffect(() => {
    if (!loaded && items?.length === 1 && loadWhenOnlyOneConfig) {
      loadSituation(items[0].id);
      setLoaded(true);
    }
  }, [items?.length, loaded, configuration, onLoadConfiguration, items, loadWhenOnlyOneConfig]);

  const handleAddNewConfig = async () => {
    const result = await createConfiguration({ name: newConfigName, situation: sortKeys(configuration) });
    if (result.status !== 'success') {
      notify('error', result.error);
      return;
    }
    trackEvent('Comparateur Coûts CO2|Création d’une configuration', {
      configId: result.item?.id,
    });
    setIsAddingNew(false);
    setNewConfigName('');
    setIsOpen(false);
  };

  const handleRenameConfig = async (configId: string) => {
    updateConfiguration(configId, { name: renameValue, situation: sortKeys(configuration) });
    setIsAddingNew(false);
    setRenamingConfig(null);
  };

  const handleSaveConfig = async (configId: string) => updateConfiguration(configId, { situation: sortKeys(configuration) });

  const handleDeleteConfig = async (configId: string) => {
    if (window.confirm('Êtes-vous certain de vouloir supprimer cette configuration ?')) {
      deleteConfiguration(configId);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsAddingNew(false);
        setRenamingConfig(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedConfig = configs.find((config) => JSON.stringify(config.situation) === JSON.stringify(situation));

  return (
    <div className="relative min-w-64 font-sans" ref={dropdownRef}>
      <div
        className="flex items-center justify-between px-3 py-2 border rounded-md bg-white cursor-pointer shadcn-border shadcn-shadow hover:bg-gray-50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={'text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis text-sm'}>
          {isLoading ? (
            <Loader />
          ) : !selectedConfig && !situationEmpty ? (
            'Sauvegarder la configuration'
          ) : (
            selectedConfig?.name || 'Charger une configuration'
          )}
        </span>
        <Icon name={isOpen ? 'ri-arrow-drop-up-line' : 'ri-arrow-drop-down-line'} className="text-gray-500 flex-shrink-0" size="md" />
      </div>
      {isOpen && (
        <div className="absolute w-full mt-2 bg-white border rounded-md z-10">
          {configs.map((config) => {
            const isSelectedConfig = selectedConfig?.id === config.id;
            return (
              <div
                key={config.id}
                className={cx('pl-2 pr-2 px-2 hover:bg-gray-50 flex items-center justify-between transition-colors', {
                  'bg-gray-200': isSelectedConfig,
                })}
              >
                {renamingConfig === config.name ? (
                  <>
                    <div className="flex items-center flex-1 gap-1">
                      <input
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        className="w-full px-2 py-1 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRenameConfig(config.id);
                        }}
                      />
                    </div>
                    <div className="flex gap-0.5">
                      <Button
                        onClick={() => handleRenameConfig(config.id)}
                        iconId="fr-icon-check-line"
                        size="small"
                        priority="tertiary"
                        title="Confirmer"
                        loading={isUpdatingId === config.id}
                        className="!p-[3px] hover:scale-150 hover:!py-[1px] hover:rounded-sm hover:shadow-sm [&:before]:!mr-0 transition-all"
                      />
                      <Button
                        onClick={() => setRenamingConfig(null)}
                        iconId="fr-icon-close-line"
                        size="small"
                        variant="destructive"
                        priority="tertiary"
                        title="Annuler"
                        className="!p-[3px] hover:scale-150 hover:!py-[1px] hover:rounded-sm hover:shadow-sm [&:before]:!mr-0 transition-all"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center flex-1 gap-1">
                      <span className="text-sm text-gray-900 cursor-pointer flex-1 py-1" onClick={() => loadSituation(config.id)}>
                        {config.name}
                      </span>
                    </div>

                    <div className="flex gap-0.5">
                      {configuration && JSON.stringify(config.situation) !== JSON.stringify(situation) && (
                        <Button
                          onClick={() => handleSaveConfig(config.id)}
                          iconId="fr-icon-save-3-fill"
                          size="small"
                          variant={situationEmpty ? 'faded' : 'info'}
                          priority="tertiary"
                          title="Sauver"
                          className="!p-[3px] hover:scale-150 hover:!py-[1px] hover:rounded-sm hover:shadow-sm [&:before]:!mr-0 transition-all"
                          loading={isUpdatingId === config.id}
                          disabled={situationEmpty}
                        />
                      )}
                      <Button
                        onClick={() => {
                          setRenamingConfig(config.name);
                          setRenameValue(config.name);
                        }}
                        iconId="fr-icon-edit-line"
                        size="small"
                        priority="tertiary"
                        title="Renommer"
                        className="!p-[3px] hover:scale-150 hover:!py-[1px] hover:rounded-sm hover:shadow-sm [&:before]:!mr-0 transition-all"
                        loading={isUpdatingId === config.id}
                      />
                      <Button
                        onClick={() => {
                          setSharingId(config.id);
                          const urlToShare = `${window.location.origin}${window.location.pathname}?configId=${config.id}`;
                          navigator.clipboard.writeText(urlToShare);
                          setTimeout(() => {
                            trackEvent('Comparateur Coûts CO2|Partage d’une configuration', {
                              configId: config.id,
                            });
                            setSharingId(null);
                            notify(
                              'success',
                              'Lien copié dans le presse-papiers. Vos contacts devront disposer d’un compte pour l’ouvrir.',
                              { duration: 10000 }
                            );
                            const title = 'Ma configuration du comparateur de coûts et CO₂ de France Chaleur Urbaine';
                            const text =
                              'Voici un lien vers une configuration personnalisée pour comparer les coûts et les émissions de CO₂ selon différents modes de chauffage. Un compte est nécessaire pour y accéder.';
                            if (navigator.share) {
                              navigator.share({
                                url: urlToShare,
                                title,
                                text,
                              });
                            } else {
                              window.open(
                                `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text)} ${urlToShare}`,
                                '_blank'
                              );
                            }
                          }, 500);
                        }}
                        iconId="ri-share-forward-line"
                        size="small"
                        priority="tertiary"
                        variant="info"
                        title="Partager"
                        loading={sharingId === config.id}
                        className="!p-[3px] hover:scale-150 hover:!py-[1px] hover:rounded-sm hover:shadow-sm [&:before]:!mr-0 transition-all"
                      />
                      <Button
                        onClick={() => handleDeleteConfig(config.id)}
                        iconId="fr-icon-delete-line"
                        size="small"
                        priority="tertiary"
                        variant="destructive"
                        title="Supprimer"
                        loading={isDeletingId === config.id}
                        className="!p-[3px] hover:scale-150 hover:!py-[1px] hover:rounded-sm hover:shadow-sm [&:before]:!mr-0 transition-all"
                      />
                    </div>
                  </>
                )}
              </div>
            );
          })}

          <div className={configs.length === 0 ? '' : 'border-t'}>
            {isAddingNew ? (
              <div className="flex items-center px-4 py-2">
                <input
                  type="text"
                  value={newConfigName}
                  onChange={(e) => setNewConfigName(e.target.value)}
                  className="w-full px-2 py-1 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm shadcn-border"
                  placeholder="Nom de la config"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddNewConfig();
                  }}
                />
                <Button
                  onClick={handleAddNewConfig}
                  className="ml-2"
                  iconId="fr-icon-check-line"
                  size="small"
                  priority="tertiary"
                  title="Ajouter"
                  loading={isCreating}
                />
              </div>
            ) : (
              <Button
                onClick={() => setIsAddingNew(true)}
                iconId="fr-icon-add-line"
                size="small"
                priority="tertiary"
                full
                className="!justify-start px-4 py-2 text-primary"
                disabled={situationEmpty || !!selectedConfig}
              >
                Nouvelle configuration
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfigurationDropdown;
