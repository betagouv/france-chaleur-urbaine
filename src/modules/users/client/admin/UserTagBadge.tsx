import type { UserTagColor } from '@/modules/users/constants';
import { getContrastTextColor } from '@/utils/color';
import cx from '@/utils/cx';

type UserTagBadgeProps = {
  name: string;
  color: UserTagColor;
  className?: string;
};

/** Colored display badge for a user tag (admin list, autocomplete). */
const UserTagBadge = ({ name, color, className }: UserTagBadgeProps) => (
  <span className={cx('fr-tag fr-tag--sm', className)} style={{ backgroundColor: color, color: getContrastTextColor(color) }}>
    {name}
  </span>
);

export default UserTagBadge;
