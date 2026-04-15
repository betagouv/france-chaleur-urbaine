import type { FrIconClassName, RiIconClassName } from '@codegouvfr/react-dsfr';
import { Fragment, type ReactNode } from 'react';

import Button from '@/components/ui/Button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import cx from '@/utils/cx';

export type HamburgerMenuItem = {
  id: string;
  label: string;
  icon?: FrIconClassName | RiIconClassName;
  variant?: 'destructive' | 'warning';
  href?: string;
  target?: string;
  onClick?: () => void;
  disabled?: boolean;
};

export type HamburgerMenuProps = {
  items: HamburgerMenuItem[];
  trigger?: ReactNode;
  className?: string;
};

/**
 * Menu contextuel avec déclencheur (bouton "..." par défaut).
 * Affiche une liste d'actions avec icônes et séparateurs.
 */
const HamburgerMenu = ({ items, trigger, className }: HamburgerMenuProps) => {
  const defaultTrigger = <Button size="small" priority="tertiary" iconId="ri-more-line" title="Actions" className={className} />;

  return (
    <Popover>
      <PopoverTrigger asChild>{trigger || defaultTrigger}</PopoverTrigger>
      <PopoverContent
        className="w-auto"
        full={false}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          (e.currentTarget as HTMLElement).querySelector<HTMLElement>('a, button')?.focus();
        }}
      >
        <div className="min-w-48">
          <ul className="flex flex-col pl-0 list-none" role="menu">
            {items.map((item, index) => {
              const itemContent = (
                <>
                  {item.icon && <i className={cx(item.icon, 'mr-2 shrink-0 text-sm')} aria-hidden="true" />}
                  <span className="whitespace-nowrap">{item.label}</span>
                </>
              );

              const itemClassName = cx(
                'flex items-center w-full px-3 py-2 text-xs',
                item.variant === 'destructive'
                  ? 'text-red-600 hover:bg-red-50! focus:bg-red-50!'
                  : item.variant === 'warning'
                    ? 'text-orange-600 hover:bg-orange-50! focus:bg-orange-50!'
                    : 'text-gray-700 hover:bg-gray-100! focus:bg-gray-100!',
                item.disabled && 'opacity-50 cursor-not-allowed'
              );

              return (
                <Fragment key={item.id}>
                  <li className="pb-0!">
                    {item.href ? (
                      <a
                        href={item.href}
                        target={item.target}
                        rel={item.target === '_blank' ? 'noopener noreferrer' : undefined}
                        className={cx(itemClassName, 'bg-none')}
                        role="menuitem"
                        aria-disabled={item.disabled}
                      >
                        {itemContent}
                      </a>
                    ) : (
                      <button
                        type="button"
                        className={cx(itemClassName)}
                        role="menuitem"
                        disabled={item.disabled}
                        onClick={() => item.onClick?.()}
                      >
                        {itemContent}
                      </button>
                    )}
                  </li>
                  {index < items.length - 1 && (
                    <li role="none" className="pb-0! h-px">
                      <hr className="border-t border-gray-200" role="separator" />
                    </li>
                  )}
                </Fragment>
              );
            })}
          </ul>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default HamburgerMenu;
