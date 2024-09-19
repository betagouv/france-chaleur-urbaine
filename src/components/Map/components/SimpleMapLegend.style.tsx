import { fr } from '@codegouvfr/react-dsfr';
import DsfrTabs, { type TabsProps } from '@codegouvfr/react-dsfr/Tabs';
import { createParser } from 'nuqs';
import React from 'react';
import styled, { css } from 'styled-components';

import Box from '@components/ui/Box';
import CheckableAccordion, { type CheckableAccordionProps } from '@components/ui/CheckableAccordion';
import useFCUMap from '@hooks/useFCUMap';
import IconEnrr from '@public/icons/enrr.svg';
import IconOutils from '@public/icons/outils.svg';
import IconPotentiel from '@public/icons/potentiel.svg';
import IconReseaux from '@public/icons/reseaux.svg';
import cx from '@utils/cx';
import { LegendTrackingEvent, trackEvent } from 'src/services/analytics';
import { MapConfigurationProperty, type MapConfiguration } from 'src/services/Map/map-configuration';

const StyledDSFRCheckbox = styled.div<{
  checked: boolean;
}>`
  ${({ checked }) =>
    checked &&
    css`
      background-color: var(--background-active-blue-france);
      --data-uri-svg: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23f5f5fe' d='m10 15.17 9.2-9.2 1.4 1.42L10 18l-6.36-6.36 1.4-1.42z'/%3E%3C/svg%3E") !important;
    `}

  --data-uri-svg: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3C/svg%3E");
  background-image: radial-gradient(
      at 5px 4px,
      transparent 4px,
      var(--border-action-high-blue-france) 4px,
      var(--border-action-high-blue-france) 5px,
      transparent 6px
    ),
    linear-gradient(var(--border-action-high-blue-france), var(--border-action-high-blue-france)),
    radial-gradient(
      at calc(100% - 5px) 4px,
      transparent 4px,
      var(--border-action-high-blue-france) 4px,
      var(--border-action-high-blue-france) 5px,
      transparent 6px
    ),
    linear-gradient(var(--border-action-high-blue-france), var(--border-action-high-blue-france)),
    radial-gradient(
      at calc(100% - 5px) calc(100% - 4px),
      transparent 4px,
      var(--border-action-high-blue-france) 4px,
      var(--border-action-high-blue-france) 5px,
      transparent 6px
    ),
    linear-gradient(var(--border-action-high-blue-france), var(--border-action-high-blue-france)),
    radial-gradient(
      at 5px calc(100% - 4px),
      transparent 4px,
      var(--border-action-high-blue-france) 4px,
      var(--border-action-high-blue-france) 5px,
      transparent 6px
    ),
    linear-gradient(var(--border-action-high-blue-france), var(--border-action-high-blue-france)), var(--data-uri-svg);
  background-position:
    0 0,
    0.25rem 0,
    100% 0,
    0 0.25rem,
    100% 100%,
    calc(100% - 0.25rem) 100%,
    0 100%,
    100% 0.25rem,
    50%;
  background-repeat: no-repeat;
  background-size:
    0.25rem 0.25rem,
    calc(100% - 0.25rem) 1px,
    0.25rem 0.25rem,
    1px calc(100% - 0.5rem),
    0.25rem 0.25rem,
    calc(100% - 0.5rem) 1px,
    0.25rem 0.25rem,
    1px calc(100% - 0.5rem),
    1rem;
  border-radius: 0.25rem;

  height: 1rem;
  width: 1rem;
  cursor: pointer;

  outline-style: none;
  outline-color: #0a76f6;
  outline-offset: 2px;
  outline-width: 2px;
  input[type='checkbox']:focus + & {
    outline-style: solid;
  }
`;

const StyledCheckboxInput = styled.input`
  opacity: 0;
  position: absolute;
  height: 1rem !important;
  width: 1rem !important;
`;

const StyledCheckableAccordion = styled(CheckableAccordion)`
  .fr-accordion__title {
    width: 100%;
  }
`;

type UrlTabDef = {
  tabId: string;
  subTabs?: string[];
};

const tabsDefinition = [
  {
    tabId: 'reseaux',
    label: (
      <>
        <IconReseaux height="22" width="22" className="fr-mb-1v" />
        Réseaux
      </>
    ),
    subTabs: ['filtres'],
  },
  {
    tabId: 'potentiel',
    label: (
      <>
        <IconPotentiel height="22" width="22" className="fr-mb-1v" />
        Potentiel
      </>
    ),
  },
  {
    tabId: 'enrr',
    label: (
      <>
        <IconEnrr height="22" width="22" className="fr-mb-1v" />
        EnR&R
      </>
    ),
  },
  {
    tabId: 'outils',
    label: (
      <>
        <IconOutils height="22" width="22" className="fr-mb-1v" />
        Outils
      </>
    ),
    subTabs: ['mesure-distance', 'extraire-données-batiment', 'densité-thermique-linéaire'],
  },
] as const satisfies ReadonlyArray<TabsProps.Controlled['tabs'][number] & UrlTabDef>;

type GenerateTabUrls<T extends readonly UrlTabDef[]> = {
  [K in keyof T]: T[K] extends { tabId: infer TabId; subTabs?: infer SubTabs }
    ? SubTabs extends readonly string[]
      ? `${TabId & string}/${SubTabs[number]}` | TabId
      : TabId
    : never;
}[number];

type TabUrlId = GenerateTabUrls<typeof tabsDefinition>;

type GenerateTabsObjects<T extends readonly UrlTabDef[]> = {
  [K in keyof T]: T[K] extends { tabId: infer TabId; subTabs?: infer SubTabs }
    ? { tabId: TabId; subTabId: SubTabs extends readonly string[] ? SubTabs[number] | null : null }
    : never;
}[number];

export type TabObject = GenerateTabsObjects<typeof tabsDefinition>;

export function parseURLTabs(validValues: readonly UrlTabDef[]) {
  return createParser({
    parse: (query: string) => {
      const [urlTabId, urlSubTabId] = query.split('/');

      const tab = validValues.find((tab) => tab.tabId === urlTabId);
      if (!tab) {
        return null;
      }
      if (urlSubTabId) {
        const subTabId = tab.subTabs?.find((subTabId) => subTabId === urlSubTabId);
        if (!subTabId) {
          return null;
        }
        return {
          tabId: urlTabId,
          subTabId: urlSubTabId,
        } as TabObject;
      }
      return {
        tabId: urlTabId,
        subTabId: null,
      } as TabObject;
    },
    serialize: ({ tabId, subTabId }: TabObject) => `${tabId}${subTabId ? `/${subTabId}` : ''}` as TabUrlId,
    eq: (a, b) => a === b || JSON.stringify(a) === JSON.stringify(b),
  });
}

export type TabId = (typeof tabsDefinition)[number]['tabId'];

// the Tabs component takes a mutable array
export const tabs = [...tabsDefinition];

export const Tabs = styled(DsfrTabs)`
  box-shadow: none;

  .fr-tabs__panel {
    padding: 0.5rem 0.5rem;
  }

  .fr-tabs__tab {
    display: flex;
    flex-direction: column;
    font-weight: normal;
    font-size: 13px;
    margin: 0 2px;
    padding: 8px 8px;
    width: 66px;

    svg {
      font-size: 3rem;
    }

    &[aria-selected='true'] {
      font-weight: bold;
      svg {
        fill: var(--text-active-blue-france);
      }
    }
  }
`;

interface SingleCheckboxProps {
  name: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  trackingEvent?: LegendTrackingEvent;
}
type TrackableCheckableAccordionProps = Omit<
  CheckableAccordionProps.Uncontrolled<React.ReactNode>,
  'small' | 'classes' | 'checked' | 'onCheck' | 'showToggle'
> & {
  name: keyof MapConfiguration;
  checked?: CheckableAccordionProps.Uncontrolled<React.ReactNode>['checked'];
  trackingEvent: LegendTrackingEvent;
  layerName: MapConfigurationProperty<boolean>;
};

export const TrackableCheckableAccordion = ({ children, layerName, name, trackingEvent, ...props }: TrackableCheckableAccordionProps) => {
  const { toggleLayer } = useFCUMap();
  return (
    <StyledCheckableAccordion
      small
      classes={{ title: cx('d-flex', 'fr-gap--sm', fr.cx('fr-text--sm')) }}
      onCheck={(isChecked) => {
        trackEvent(`${trackingEvent}|${isChecked ? 'Active' : 'Désactive'}`);
        toggleLayer(layerName);
      }}
      expandOnCheck
      showToggle
      {...props}
    >
      {children}
    </StyledCheckableAccordion>
  );
};

/**
 * Offre une checkbox DSFR fonctionnant de manière séparée de son label.
 */
export function SingleCheckbox({ name, checked, onChange, trackingEvent }: SingleCheckboxProps) {
  return (
    <Box position="relative" pr="1w" py="1v">
      <StyledCheckboxInput
        type="checkbox"
        name={name}
        id={name}
        checked={checked}
        onChange={(event) => {
          onChange(event.target.checked);
          trackingEvent && trackEvent(`${trackingEvent}|${checked ? 'Active' : 'Désactive'}`);
        }}
        className="opacity-0"
      />
      <StyledDSFRCheckbox checked={checked} />
    </Box>
  );
}

export const InfoIcon = styled.div`
  position: relative;
  align-self: flex-start;
  margin-left: auto;

  & > .hover-info {
    width: 250px;
  }
  &:hover {
    & > .hover-info {
      display: block;
    }
  }
`;

export const DeactivatableBox = styled(Box)<{ disabled?: boolean }>`
  transition: opacity 0.25s ease-in-out;

  ${({ disabled }) =>
    disabled &&
    css`
      opacity: 0.3;
      cursor: not-allowed !important;
      & > * {
        pointer-events: none;
        user-select: none;
      }
    `}
`;
