// inspired by Chakra UI
// see https://chakra-ui.com/docs/styled-system/style-props
const spacingProperties = [
  'm',
  'mx',
  'my',
  'mt',
  'mb',
  'ml',
  'mr',

  'p',
  'px',
  'py',
  'pt',
  'pb',
  'pl',
  'pr',
] as const;
type SpacingProperty = (typeof spacingProperties)[number];

export type SpacingProperties = {
  [key in SpacingProperty]?: Spacing;
};
type Spacing =
  | '0'
  | 'auto'
  | `${number}v`
  | `n${number}v`
  | `${number}w`
  | `n${number}w`;

export function spacingsToClasses<Props extends SpacingProperties>(
  componentProperties: Props
): string {
  return Object.entries(componentProperties)
    .filter(([key]) => spacingProperties.includes(key as SpacingProperty))
    .map(([key, value]) => `fr-${key}-${value}`)
    .join(' ');
}
