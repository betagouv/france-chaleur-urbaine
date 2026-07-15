import trpc from '@/modules/trpc/client';

import TagsCombobox from './TagsCombobox';

type TagsEditorProps = {
  userId: string;
};

/**
 * Connected tag editor (edit mode): loads and saves a user's tags through the admin endpoints,
 * with an optimistic update so chips change instantly. The admin list is intentionally NOT
 * invalidated here (it is hidden behind the dialog and refetched on close) — refetching it
 * would rebuild `editingUser`, remount the form, and steal focus from the field.
 */
const TagsEditor = ({ userId }: TagsEditorProps) => {
  const utils = trpc.useUtils();
  const { data: tags, isLoading } = trpc.users.adminTags.getForUser.useQuery({ userId });

  const setTags = trpc.users.adminTags.setForUser.useMutation({
    // Optimistic: reflect the new selection immediately; onSettled refetches the truth
    // (which also rolls back the optimistic value if the mutation failed).
    onMutate: async ({ tagIds }) => {
      await utils.users.adminTags.getForUser.cancel({ userId });
      const catalog = utils.users.adminTags.list.getData() ?? [];
      utils.users.adminTags.getForUser.setData(
        { userId },
        catalog.filter((tag) => tagIds.includes(tag.id))
      );
    },
    onSettled: () => {
      void utils.users.adminTags.getForUser.invalidate({ userId });
    },
  });

  // Disabled while loading so a click never sends a replace-all payload built from an empty list.
  return (
    <TagsCombobox
      value={(tags ?? []).map((tag) => tag.id)}
      onChange={(tagIds) => setTags.mutate({ tagIds, userId })}
      disabled={isLoading}
    />
  );
};

export default TagsEditor;
