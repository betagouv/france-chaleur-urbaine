import { useQueryState } from 'nuqs';
import { useEffect, useRef, useState } from 'react';

import Button, { type ButtonProps } from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Loader from '@/components/ui/Loader';
import useCrud from '@/hooks/useCrud';
import { notify } from '@/modules/notification';
import { type CrudResponse } from '@/server/api/crud';
import { type DB } from '@/server/db/kysely';
import { pick } from '@/utils/core';
import cx from '@/utils/cx';
import { sortKeys } from '@/utils/objects';

const CrudButton = ({ className, disabled, ...props }: ButtonProps) => (
  <Button
    size="small"
    priority="tertiary"
    className={cx(
      'p-[3px]! [&:before]:mr-0! transition-all',
      !disabled && 'hover:scale-150 hover:py-px! hover:rounded-xs hover:shadow-md',
      disabled && 'shadow-none! [&:before]:opacity-40',
      className
    )}
    disabled={disabled}
    {...props}
  />
);

type CrudItem<T extends CrudResponse<keyof DB, any>> = NonNullable<T['list']['items']>[number];

function CrudDropdown<T extends CrudResponse<keyof DB, any>>({
  data,
  valueKey = 'id' as keyof CrudItem<T>,
  nameKey = 'name' as keyof CrudItem<T>,
  saveLabel = 'Sauvegarder',
  loadLabel = 'Charger',
  addPlaceholderLabel = 'Nom',
  addLabel = 'Nom',
  onSelect,
  onAdd,
  onShare,
  loadWhenOnlyOneConfig,
  preprocessItem = (item) => ({ ...item, editable: true, disabled: false }),
  isSameObject = (obj1, obj2) =>
    !!(Object.keys(obj1).length && Object.keys(obj2).length && JSON.stringify(sortKeys(obj1)) === JSON.stringify(sortKeys(obj2))),
  url,
  sharedQueryParamName = 'itemId',
}: {
  data: Partial<CrudItem<T>>;
  valueKey?: keyof CrudItem<T>;
  nameKey?: keyof CrudItem<T>;
  preprocessItem?: (item: CrudItem<T>) => CrudItem<T> & { editable: boolean; disabled: boolean };
  onSelect: (item: CrudItem<T>) => void;
  onAdd?: (item: Partial<CrudItem<T>>) => void;
  onShare?: (item: Partial<CrudItem<T>>, options: { setSharingId: (id: string | null) => void }) => void;
  loadWhenOnlyOneConfig?: boolean;
  url: string;
  isSameObject?: (obj1: Partial<CrudItem<T>>, obj2: Partial<CrudItem<T>>) => boolean;
  saveLabel?: string;
  loadLabel?: string;
  addLabel?: string;
  addPlaceholderLabel?: string;
  sharedQueryParamName?: string;
}) {
  const [loaded, setLoaded] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [isRenaming, setIsRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState<string>('');
  const [sharingId, setSharingId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dataEmpty = Object.keys(data).length === 0;
  const [sharedId, setSharedId] = useQueryState(sharedQueryParamName);

  const {
    items: crudItems,
    create: createCrud,
    isCreating,
    update: updateCrud,
    isUpdatingId,
    delete: deleteCrud,
    isDeletingId,
    isLoading,
    get: getCrud,
  } = useCrud<T>(url);

  const items: CrudItem<T>[] = crudItems || [];

  const handleSelect = (itemId: string) => {
    const item = items.find((item) => item[valueKey] === itemId) as CrudItem<T>;
    setIsOpen(false);
    onSelect(item);
  };

  useEffect(() => {
    if (!sharedId) {
      return;
    }
    void (async () => {
      const { item } = await getCrud(sharedId);

      onSelect(item as CrudItem<T>);
      void setSharedId(null);
    })();
  }, [sharedId, handleSelect]);

  useEffect(() => {
    if (!loaded && items?.length === 1 && loadWhenOnlyOneConfig) {
      handleSelect(items[0][valueKey] as string);
      setLoaded(true);
    }
  }, [items?.length, loaded, onSelect, items, loadWhenOnlyOneConfig]);

  const handleAddNew = async () => {
    const result = await createCrud({ name: newName, ...data });
    if (result.status !== 'success') {
      notify('error', result.error);
      return;
    }
    onAdd?.(result.item as CrudItem<T>);
    setIsAddingNew(false);
    setNewName('');
    setIsOpen(false);
  };

  const handleRename = async (itemId: string) => {
    await updateCrud(itemId, { name: renameValue, ...data });
    setIsAddingNew(false);
    setIsRenaming(null);
  };

  const handleSave = async (itemId: string) => updateCrud(itemId, { ...data });

  const handleDelete = async (itemId: string) => {
    if (window.confirm('Êtes-vous certain de vouloir supprimer cet item ?')) {
      await deleteCrud(itemId);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsAddingNew(false);
        setIsRenaming(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedItem = items.find((item) => isSameObject(pick(item, Object.keys(data) as (keyof CrudItem<T>)[]), data));

  return (
    <div className="relative min-w-64 font-sans" ref={dropdownRef}>
      <div
        className="flex items-center justify-between px-3 py-2 border rounded-md bg-white cursor-pointer shadcn-border shadcn-shadow hover:bg-gray-50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={'text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis text-sm'}>
          {isLoading ? <Loader /> : !selectedItem && dataEmpty ? loadLabel : (selectedItem?.[nameKey] as React.ReactNode) || saveLabel}
        </span>
        <Icon name={isOpen ? 'ri-arrow-drop-up-line' : 'ri-arrow-drop-down-line'} className="text-gray-500 shrink-0" size="md" />
      </div>
      {isOpen && (
        <div className="absolute w-full mt-2 bg-white border rounded-md z-10">
          {items.map((rawItem) => {
            const isSelectedItem = selectedItem?.[valueKey] === rawItem[valueKey];
            const item = preprocessItem(rawItem);

            const itemName = item[nameKey] as string;
            const itemValue = item[valueKey] as string;

            return (
              <div
                key={item[valueKey] as string}
                className={cx('pl-2 pr-2 px-2 hover:bg-gray-50 flex items-center justify-between transition-colors', {
                  'bg-gray-200': isSelectedItem,
                  'opacity-50 cursor-not-allowed': item.disabled,
                })}
              >
                {isRenaming === itemName ? (
                  <>
                    <div className="flex items-center flex-1 gap-1">
                      <input
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        className="w-full px-2 py-1 border rounded-md focus:outline-hidden focus:ring-1 focus:ring-blue text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          e.stopPropagation();
                          if (e.key === 'Enter') void handleRename(item[valueKey] as string);
                        }}
                      />
                    </div>
                    <div className="flex gap-0.5">
                      <CrudButton
                        onClick={() => handleRename(item[valueKey] as string)}
                        iconId="fr-icon-check-line"
                        title="Confirmer"
                        loading={isUpdatingId === item[valueKey]}
                      />
                      <CrudButton onClick={() => setIsRenaming(null)} iconId="fr-icon-close-line" variant="destructive" title="Annuler" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center flex-1 gap-1">
                      <span className="text-sm text-gray-900 cursor-pointer flex-1 py-1" onClick={() => handleSelect(itemValue)}>
                        {itemName}
                      </span>
                    </div>

                    {item.editable && (
                      <div className="flex gap-0.5">
                        {data && !isSameObject(pick(item, Object.keys(data) as (keyof CrudItem<T>)[]), data) && (
                          <CrudButton
                            onClick={() => handleSave(itemValue)}
                            iconId="fr-icon-save-3-fill"
                            variant={dataEmpty ? 'faded' : 'info'}
                            title="Sauver"
                            loading={isUpdatingId === itemValue}
                            disabled={dataEmpty}
                          />
                        )}
                        <CrudButton
                          onClick={() => {
                            setIsRenaming(itemName);
                            setRenameValue(itemName);
                          }}
                          iconId="fr-icon-edit-line"
                          title="Renommer"
                          loading={isUpdatingId === itemValue}
                        />
                        {onShare && (
                          <CrudButton
                            onClick={() => {
                              setSharingId(itemValue);
                              return onShare(item, { setSharingId });
                            }}
                            iconId="ri-share-forward-line"
                            variant="info"
                            title="Partager"
                            loading={sharingId === itemValue}
                          />
                        )}
                        <CrudButton
                          onClick={() => handleDelete(itemValue)}
                          iconId="fr-icon-delete-line"
                          variant="destructive"
                          title="Supprimer"
                          loading={isDeletingId === itemValue}
                          className="p-[3px]! hover:scale-150 hover:py-px! hover:rounded-xs hover:shadow-xs [&:before]:mr-0! transition-all"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}

          <div className={items.length === 0 ? '' : 'border-t'}>
            {isAddingNew ? (
              <div className="flex items-center px-4 py-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-2 py-1 border rounded-md focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-sm shadcn-border"
                  placeholder={addPlaceholderLabel}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void handleAddNew();
                  }}
                />
                <Button
                  onClick={handleAddNew}
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
                className="justify-start! px-4 py-2 text-primary"
                disabled={dataEmpty || !!selectedItem}
              >
                {addLabel}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CrudDropdown;
