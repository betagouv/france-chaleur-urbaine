import type React from 'react';
import type { ReactNode } from 'react';

import Button from '@/components/ui/Button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import cx from '@/utils/cx';

export type HamburgerMenuItem = {
  id: string;
  label: string;
  icon?: string;
  variant?: 'destructive';
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
};

export type HamburgerMenuProps = {
  items: HamburgerMenuItem[];
  trigger?: ReactNode;
  className?: string;
};

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ items, trigger, className }) => {
  const defaultTrigger = <Button size="small" priority="tertiary" iconId="ri-more-line" title="Actions" className={className} />;

  return (
    <Popover>
      <PopoverTrigger asChild>{trigger || defaultTrigger}</PopoverTrigger>
      <PopoverContent className="w-auto" full={false}>
        <div className="min-w-48">
          <ul className="flex flex-col pl-0 list-none" role="menu">
            {items.map((item, index) => (
              <>
                <li key={item.id} className="pb-0!">
                  {item.href ? (
                    <a
                      href={item.href}
                      className={cx('bg-none! flex items-center w-full px-3 py-2 text-xs text-gray-700 no-underline cursor-pointer')}
                      role="menuitem"
                      onClick={(e) => {
                        if (item.disabled) {
                          e.preventDefault();
                          return;
                        }
                        item.onClick?.();
                      }}
                    >
                      {item.icon && <i className={cx(item.icon, 'mr-2 shrink-0 text-sm')} aria-hidden="true" />}
                      <span className="whitespace-nowrap">{item.label}</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      className={cx(
                        'flex items-center w-full px-3 py-2 text-xs text-left',
                        item.variant === 'destructive' && 'text-red-600 hover:bg-red-50 focus:bg-red-50'
                      )}
                      role="menuitem"
                      disabled={item.disabled}
                      onClick={(e) => {
                        e.preventDefault();
                        item.onClick?.();
                      }}
                    >
                      {item.icon && <i className={cx(item.icon, 'mr-2 shrink-0 text-sm')} aria-hidden="true" />}
                      <span className="whitespace-nowrap">{item.label}</span>
                    </button>
                  )}
                </li>
                {index < items.length - 1 && (
                  <li key={`separator-${item.id}`} role="none" className="pb-0! h-px">
                    <hr className="border-t border-gray-200" role="separator" />
                  </li>
                )}
              </>
            ))}
          </ul>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default HamburgerMenu;
