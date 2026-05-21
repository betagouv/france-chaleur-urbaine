import * as RadixAccordion from '@radix-ui/react-accordion';
import { useRouter } from 'next/router';
import { type ReactNode, useId, useState } from 'react';

import Tooltip from '@/components/ui/Tooltip';
import useArrayQueryState from '@/hooks/useArrayQueryState';
import cx from '@/utils/cx';

const ITEM_VALUE = 'item';

/**
 * Public API for `MapAccordion` / `MapCheckableAccordion`. Discriminated to
 * make URL-state vs controlled mode mutually exclusive at the type level.
 *
 * - URL-state mode (`urlStateId`): persisted in the `?accordions=` query param
 *   on `/carte`, falls back to local React state elsewhere. `defaultExpanded`
 *   seeds the local fallback (the URL is authoritative on `/carte`).
 * - Controlled mode: standard `expanded` / `onExpandedChange` pair. If omitted,
 *   radix manages the state internally with `defaultExpanded` as initial value.
 */
/** Just the state-management slice of {@link BaseProps} — what {@link useExpansionState} needs. */
type ExpansionProps = {
  defaultExpanded?: boolean;
} & (
  | {
      /** Persist open/closed state in the `?accordions=` URL param under this id. */
      urlStateId: string;
      expanded?: never;
      onExpandedChange?: never;
    }
  | {
      urlStateId?: never;
      expanded?: boolean;
      onExpandedChange?: (expanded: boolean) => void;
    }
);

type BaseProps = ExpansionProps & {
  className?: string;
  children: ReactNode;
};

/**
 * Resolves `(expanded, setExpanded)` according to the props. URL state is only
 * applied on `/carte` — elsewhere (Sandbox, …) the accordion uses local state
 * seeded by `defaultExpanded`, so flag state doesn't leak into the URL.
 */
function useExpansionState(props: ExpansionProps): {
  expanded: boolean | undefined;
  setExpanded: ((next: boolean) => void) | undefined;
} {
  const router = useRouter();
  const syncWithUrl = router.pathname === '/carte';
  const { has, add, remove } = useArrayQueryState('accordions');
  const [localExpanded, setLocalExpanded] = useState<boolean>(Boolean(props.defaultExpanded));

  if (props.urlStateId) {
    if (syncWithUrl) {
      const id = props.urlStateId;
      return {
        expanded: has(id),
        setExpanded: (next) => (next ? add(id) : remove(id)),
      };
    }
    return { expanded: localExpanded, setExpanded: setLocalExpanded };
  }
  return { expanded: props.expanded, setExpanded: props.onExpandedChange };
}

type AccordionRootProps = {
  defaultExpanded?: boolean;
  expanded: boolean | undefined;
  setExpanded: ((next: boolean) => void) | undefined;
  className?: string;
  children: ReactNode;
};

function AccordionRoot({ defaultExpanded, expanded, setExpanded, className, children }: AccordionRootProps) {
  return (
    <RadixAccordion.Root
      type="single"
      collapsible
      defaultValue={defaultExpanded ? ITEM_VALUE : undefined}
      value={expanded === undefined ? undefined : expanded ? ITEM_VALUE : ''}
      onValueChange={setExpanded ? (v) => setExpanded(v === ITEM_VALUE) : undefined}
      className={className}
    >
      <RadixAccordion.Item value={ITEM_VALUE}>{children}</RadixAccordion.Item>
    </RadixAccordion.Root>
  );
}

/**
 * Animated content wrapper — shared between both variants.
 *
 * Animation classes live in `globals.css` (raw CSS, no Tailwind utilities)
 * so they don't carry Tailwind's project-wide `important: true`. Radix needs
 * to temporarily override `animation-name` inline while it measures content
 * height for `--radix-collapsible-content-height` — and inline styles can
 * only win over rules without `!important`.
 *
 * Closed content is fully unmounted by radix → cheap initial mount of the
 * legend (each layer subscribes to the config atom, so this matters).
 */
function Content({ children, className }: { children: ReactNode; className?: string }) {
  return <RadixAccordion.Content className={cx('legend-accordion-content', className)}>{children}</RadixAccordion.Content>;
}

// Chevron is shared by both variants — sits on `--text-action-high-blue-france`,
// matching the DSFR Tabs / NavMenu look.
const chevronClasses =
  'fr-icon-arrow-down-s-line fr-icon--sm shrink-0 transition-transform duration-200 text-(--text-action-high-blue-france)';

type MapAccordionProps = BaseProps & {
  /** Header content; the whole row toggles the accordion. */
  label: ReactNode;
};

/**
 * Simple accordion — the whole header row is the toggle. Looks like DSFR
 * `fr-accordion--simple` minus the styled-components rigidity.
 */
export function MapAccordion({ label, className, children, ...rest }: MapAccordionProps) {
  const { expanded, setExpanded } = useExpansionState(rest);
  return (
    <AccordionRoot defaultExpanded={rest.defaultExpanded} expanded={expanded} setExpanded={setExpanded} className={className}>
      <RadixAccordion.Header className="mb-0">
        <RadixAccordion.Trigger className="group flex w-full items-center justify-between gap-2 px-2 py-1.5 text-left hover:bg-(--background-default-grey-hover) data-[state=open]:bg-(--background-open-blue-france) data-[state=open]:hover:bg-(--background-open-blue-france-hover)">
          <span className="flex-1 text-sm font-medium text-(--text-action-high-blue-france)">{label}</span>
          <span aria-hidden className={cx(chevronClasses, 'group-data-[state=open]:rotate-180')} />
        </RadixAccordion.Trigger>
      </RadixAccordion.Header>
      <Content>{children}</Content>
    </AccordionRoot>
  );
}

type MapCheckableAccordionProps = BaseProps & {
  /** Visible text next to the checkbox. */
  label: ReactNode;
  /** Checkbox state. */
  checked: boolean;
  /** Called when the checkbox changes. */
  onCheckChange: (checked: boolean) => void;
  /** Optional swatch / icon between the checkbox and the label. */
  icon?: ReactNode;
  /** Optional tooltip rendered after the label. */
  tooltip?: ReactNode;
  contentClassName?: string;
};

/**
 * Checkable accordion — checkbox + label + chevron-at-end-of-line.
 * Only the chevron toggles expand/collapse; the checkbox handles its own state.
 * Mirrors V1's `CheckableAccordion` but Tailwind-only, no styled-components.
 */
export function MapCheckableAccordion({
  label,
  checked,
  onCheckChange,
  icon,
  tooltip,
  className,
  contentClassName,
  children,
  ...rest
}: MapCheckableAccordionProps) {
  const id = useId();
  // Single resolution of the expansion state — feeds both `<AccordionRoot>`
  // (controlled) and the expandOnCheck side-effect below, so they can't drift.
  const { expanded, setExpanded } = useExpansionState(rest);
  const handleCheckChange = (next: boolean) => {
    onCheckChange(next);
    if (next) setExpanded?.(true);
  };
  return (
    <AccordionRoot defaultExpanded={rest.defaultExpanded} expanded={expanded} setExpanded={setExpanded} className={className}>
      {/* Row container is `items-stretch` so the chevron toggle on the right
          can span the full row height (V1 parity — DSFR `.fr-accordion__btn`
          with `self-stretch`). Vertical padding lives on the label/checkbox
          wrapper instead of the row, so the toggle truly fills top-to-bottom. */}
      <div className="flex items-stretch gap-2 pl-3">
        <div className="fr-checkbox-group fr-checkbox-group--sm flex flex-1 items-center py-3 min-w-0 mb-0!">
          <input
            id={id}
            type="checkbox"
            checked={checked}
            onChange={(e) => handleCheckChange(e.target.checked)}
            aria-describedby={tooltip ? `${id}-desc` : undefined}
          />
          {/* The DSFR `.fr-checkbox-group` renders the visual checkbox via
              `label::before`, so icon + text live inside the label. */}
          <label htmlFor={id} className="cursor-pointer flex items-center gap-2 w-full mb-0! text-sm">
            {icon}
            <span className="flex-1">{label}</span>
          </label>
          {tooltip && (
            <>
              {/* Off-screen description ties the visual tooltip to the input for screen readers. */}
              <span id={`${id}-desc`} className="sr-only">
                {tooltip}
              </span>
              <Tooltip title={tooltip} iconProps={{ className: 'text-(--text-action-high-blue-france)' }} />
            </>
          )}
        </div>
        <RadixAccordion.Header asChild>
          <RadixAccordion.Trigger
            aria-label="Développer la section"
            className="group inline-flex w-7 items-center justify-center self-stretch hover:bg-(--background-default-grey-hover) data-[state=open]:bg-(--background-open-blue-france) data-[state=open]:hover:bg-(--background-open-blue-france-hover)"
          >
            <span aria-hidden className={cx(chevronClasses, 'group-data-[state=open]:rotate-180')} />
          </RadixAccordion.Trigger>
        </RadixAccordion.Header>
      </div>
      {/* Default padding mirrors V1's per-legend wrapper (`flex flex-col pt-2
          pl-3 pr-1`) so individual legend defs don't need their own div.
          Pass `contentClassName` to add extras (e.g. `gap-1`). */}
      <Content className={cx('flex flex-col px-3 pr-1', contentClassName)}>{children}</Content>
    </AccordionRoot>
  );
}
