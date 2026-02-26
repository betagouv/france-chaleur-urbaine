import type { CSSProperties, PropsWithChildren } from 'react';

import { type LegacyColor, legacyColors } from './helpers/colors';
import { type SpacingProperties, spacingsToClasses } from './helpers/spacings';

type HeadingType = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
type HeadingSize = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

type HeadingBaseProps = SpacingProperties & {
  as?: HeadingType;
  size?: HeadingSize;
  color?: 'grey' | 'blue-france' | 'red-marianne';
  legacyColor?: LegacyColor;
  center?: boolean;
  className?: string;
  maxWidth?: CSSProperties['maxWidth'];
  title?: string;
};

type HeadingProps = (HeadingBaseProps & { anchorLink: true; id: string }) | (HeadingBaseProps & { anchorLink?: false; id?: string });

/**
 * Renders a title element with a blue-france color by default.
 *
 * @example
 * ```tsx
 * <Heading>Title</Heading> // => <h1 class="fr-h1">
 * <Heading as="h3">Title</Heading> // => <h3 class="fr-h1">
 * <Heading size="h3">Title</Heading> // => <h1 class="fr-h3">
 * <Heading id="my-section" anchorLink>Title</Heading> // => h1 with hover anchor link
 * ```
 */
function Heading(props: PropsWithChildren<HeadingProps>) {
  const Type = props.as ?? 'h1';

  if (props.color && props.legacyColor) {
    throw new Error('cannot use color and legacyColor at the same time');
  }
  const style: CSSProperties = {
    color: props.color ? `var(--text-title-${props.color})` : props.legacyColor ? legacyColors[props.legacyColor] : undefined,
    maxWidth: props.maxWidth,
    textAlign: props.center ? 'center' : undefined,
  };

  const showAnchor = props.anchorLink && props.id;

  return (
    <Type
      className={`fr-${props.size ?? Type} ${props.center ? 'fr-text-center' : ''} ${showAnchor ? 'group relative' : ''}
      ${spacingsToClasses(props)} ${props.className ?? ''}`}
      style={style}
      id={props.id}
      title={props.title}
    >
      {showAnchor && (
        <a
          href={`#${props.id}`}
          aria-label={`Lien vers la section ${props.id}`}
          title="Lien vers cette section"
          className="fr-icon-link absolute right-full mr-1 text-[0.6em] no-underline opacity-0 transition-opacity group-hover:opacity-60 hover:opacity-100! focus:opacity-100!"
        >
          <span className="sr-only">Ancre</span>
        </a>
      )}
      {props.children}
    </Type>
  );
}
export default Heading;
