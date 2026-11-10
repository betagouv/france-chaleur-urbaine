import cx from '@/utils/cx';

type SolutionPictogramProps = {
  icon: string;
  className?: string;
};

/**
 * Uses the template's decorative color glyphs consistently in headings, cards and navigation.
 */
export function SolutionPictogram({ icon, className }: SolutionPictogramProps) {
  return (
    <span
      aria-hidden="true"
      className={cx("shrink-0 font-['Apple_Color_Emoji','Segoe_UI_Emoji','Noto_Color_Emoji',sans-serif]", className)}
    >
      {icon}
    </span>
  );
}
