import { useRef, useState } from 'react';

import AsyncButton from '@/components/ui/AsyncButton';
import Button from '@/components/ui/Button';
import { useDialogState } from '@/hooks/useDialogState';
import type { UploadedFile } from '@/modules/files/constants';
import RenameFileDialog, { type RenameFileData } from '@/modules/network-change-requests/client/RenameFileDialog';
import { notify, toastErrors } from '@/modules/notification';
import { MAX_NETWORK_DOCUMENTS } from '@/modules/reseaux/constants';
import trpc from '@/modules/trpc/client';
import { postFormDataFetchJSON } from '@/utils/network';
import { formatFileSize } from '@/utils/strings';

type NetworkDocumentsEditorProps = {
  networkId: number;
  networkType: 'reseau_de_chaleur' | 'reseau_de_froid';
  /** Called after any change so the parent lists are reloaded. */
  onChange: () => Promise<void>;
};

/**
 * Documents published on a network page (PDF or zip archive, 3 max): list, removal and upload.
 * Each action is saved immediately (independent of the surrounding edit form).
 */
function NetworkDocumentsEditor({ networkId, networkType, onChange }: NetworkDocumentsEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const utils = trpc.useUtils();
  const { data: documents = [] } = trpc.reseaux.documents.list.useQuery({ networkId, networkType });
  const addDocuments = trpc.reseaux.documents.add.useMutation();
  const removeDocument = trpc.reseaux.documents.remove.useMutation();
  const renameDocument = trpc.reseaux.documents.rename.useMutation();
  const renameDialog = useDialogState<RenameFileData>();
  const reload = async () => {
    await Promise.all([utils.reseaux.documents.list.invalidate({ networkId, networkType }), onChange()]);
  };

  const handleRemove = toastErrors(async (fileId: string) => {
    await removeDocument.mutateAsync({ fileId, networkId, networkType });
    await reload();
    notify('success', 'Document retiré de la fiche');
  });

  const handleUpload = toastErrors(async (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }
    setIsUploading(true);
    try {
      const uploaded = await postFormDataFetchJSON<{ files: UploadedFile[] }>('/api/files/upload', { files: Array.from(files) });
      await addDocuments.mutateAsync({ fileIds: uploaded.files.map((file) => file.id), networkId, networkType });
      await reload();
      notify('success', 'Document publié sur la fiche');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  });

  return (
    <div className="flex flex-col gap-2">
      <span className="fr-label">Documents publiés sur la fiche (PDF ou archive zip, {MAX_NETWORK_DOCUMENTS} maximum)</span>
      {documents.length === 0 ? (
        <span className="text-sm text-gray-600">Aucun document</span>
      ) : (
        <ul className="mb-0 list-none p-0 flex flex-col gap-1">
          {documents.map((document) => (
            <li key={document.id} className="flex items-center gap-2 text-sm">
              <span className="flex-1 truncate">
                {document.filename} <span className="text-gray-600">({formatFileSize(document.size)})</span>
              </span>
              <Button
                size="small"
                priority="tertiary"
                iconId="fr-icon-edit-line"
                title="Renommer le document"
                onClick={() =>
                  renameDialog.open({
                    filename: document.filename,
                    onRename: async (filename) => {
                      await renameDocument.mutateAsync({ fileId: document.id, filename, networkId, networkType });
                      await reload();
                    },
                  })
                }
              >
                Renommer
              </Button>
              <AsyncButton
                size="small"
                priority="tertiary"
                iconId="fr-icon-delete-line"
                title="Retirer le document"
                onClick={() => handleRemove(document.id)}
              >
                Retirer
              </AsyncButton>
            </li>
          ))}
        </ul>
      )}
      {documents.length < MAX_NETWORK_DOCUMENTS && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,application/zip,.zip"
            multiple
            className="hidden"
            onChange={(event) => void handleUpload(event.target.files)}
          />
          <Button
            size="small"
            priority="secondary"
            iconId="fr-icon-upload-line"
            loading={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            Ajouter un document
          </Button>
        </div>
      )}
      <RenameFileDialog control={renameDialog} />
    </div>
  );
}

export default NetworkDocumentsEditor;
