import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock Radix Popover to render inline (Portal doesn't work in happy-dom).
// Content visibility is gated on the `open` prop from Root via React context.
const RadixOpenContext = React.createContext(false);

vi.mock('@radix-ui/react-popover', () => ({
  Anchor: React.forwardRef(({ children, asChild }: any, ref: any) =>
    asChild ? React.cloneElement(children, { ref }) : <div ref={ref}>{children}</div>
  ),
  Content: ({ children, onOpenAutoFocus, onInteractOutside, style, ...props }: any) => {
    const open = React.useContext(RadixOpenContext);
    return open ? <div {...props}>{children}</div> : null;
  },
  Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Root: ({ children, open }: { children: React.ReactNode; open: boolean }) => (
    <RadixOpenContext.Provider value={open}>{children}</RadixOpenContext.Provider>
  ),
}));

import { Autocomplete, DEFAULT_DEBOUNCE_TIME } from './Autocomplete';

type Option = { id: string; label: string };

const makeOptions = (labels: string[]): Option[] => labels.map((label, i) => ({ id: String(i), label }));

const defaultFetchFn = vi.fn(async (_query: string, _signal: AbortSignal): Promise<Option[]> => makeOptions(['Paris', 'Lyon', 'Bordeaux']));

const defaultProps = {
  fetchFn: defaultFetchFn,
  getOptionValue: (o: Option) => o.label,
  onSelect: vi.fn(),
};

/**
 * Helper: fire a change event, advance fake timers past debounce, and flush microtasks
 * so the async fetch resolves and React state updates.
 */
async function typeAndWaitForResults(input: HTMLElement, value: string) {
  await act(async () => {
    fireEvent.change(input, { target: { value } });
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(DEFAULT_DEBOUNCE_TIME);
  });
}

describe('Autocomplete', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('affiche les suggestions quand minCharThreshold est atteint', async () => {
    render(<Autocomplete {...defaultProps} minCharThreshold={2} />);
    const input = screen.getByRole('combobox');

    await act(async () => {
      fireEvent.change(input, { target: { value: 'Pa' } });
    });

    // Pas encore de suggestions (debounce pas encore terminé)
    expect(screen.queryByRole('listbox')).toBeNull();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(DEFAULT_DEBOUNCE_TIME);
    });

    expect(screen.getByRole('listbox')).toBeDefined();
    expect(screen.getByText('Paris')).toBeDefined();
  });

  it("n'affiche pas de suggestions si la saisie est en dessous de minCharThreshold", async () => {
    render(<Autocomplete {...defaultProps} minCharThreshold={3} />);
    const input = screen.getByRole('combobox');

    await act(async () => {
      fireEvent.change(input, { target: { value: 'Pa' } });
      await vi.advanceTimersByTimeAsync(DEFAULT_DEBOUNCE_TIME);
    });

    expect(screen.queryByRole('listbox')).toBeNull();
    expect(defaultFetchFn).not.toHaveBeenCalled();
  });

  it('appelle onSelect et ferme le dropdown au clic sur une option', async () => {
    render(<Autocomplete {...defaultProps} />);
    const input = screen.getByRole('combobox');

    await typeAndWaitForResults(input, 'Par');

    expect(screen.getByText('Paris')).toBeDefined();

    await act(async () => {
      fireEvent.click(screen.getByText('Paris'));
    });

    expect(defaultProps.onSelect).toHaveBeenCalledOnce();
    expect(defaultProps.onSelect).toHaveBeenCalledWith(expect.objectContaining({ label: 'Paris' }));
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it("initialise l'input avec defaultValue", () => {
    render(<Autocomplete {...defaultProps} defaultValue="Marseille" />);
    const input = screen.getByRole('combobox');
    expect((input as HTMLInputElement).value).toBe('Marseille');
  });

  it('suit la prop value en mode contrôlé', async () => {
    const { rerender } = render(<Autocomplete {...defaultProps} value="Nantes" />);
    const input = screen.getByRole('combobox');
    expect((input as HTMLInputElement).value).toBe('Nantes');

    await act(async () => {
      rerender(<Autocomplete {...defaultProps} value="Rennes" />);
    });

    expect((input as HTMLInputElement).value).toBe('Rennes');
  });

  it("appelle onChange lors de la sélection d'une option", async () => {
    const onChange = vi.fn();
    render(<Autocomplete {...defaultProps} onChange={onChange} />);
    const input = screen.getByRole('combobox');

    await typeAndWaitForResults(input, 'Lyo');

    expect(screen.getByText('Lyon')).toBeDefined();

    await act(async () => {
      fireEvent.click(screen.getByText('Lyon'));
    });

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith('Lyon');
  });

  it.each([['Escape'], ['Tab']])('ferme le dropdown avec %s', async (key) => {
    render(<Autocomplete {...defaultProps} />);
    const input = screen.getByRole('combobox');

    await typeAndWaitForResults(input, 'Par');

    expect(screen.getByRole('listbox')).toBeDefined();

    await act(async () => {
      fireEvent.keyDown(input, { key });
    });

    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('navigue avec ArrowDown/ArrowUp et sélectionne avec Enter', async () => {
    render(<Autocomplete {...defaultProps} />);
    const input = screen.getByRole('combobox');

    await typeAndWaitForResults(input, 'Par');

    expect(screen.getByRole('listbox')).toBeDefined();

    // Each keyDown in a separate act so React flushes state updates between them
    await act(async () => fireEvent.keyDown(input, { key: 'ArrowDown' }));
    await act(async () => fireEvent.keyDown(input, { key: 'ArrowDown' }));
    await act(async () => fireEvent.keyDown(input, { key: 'Enter' }));

    // Second option is Lyon (index 1)
    expect(defaultProps.onSelect).toHaveBeenCalledWith(expect.objectContaining({ label: 'Lyon' }));
  });

  it("appelle onChange avec '' et onClear quand on clique sur le bouton clear", async () => {
    const onClear = vi.fn();
    const onChange = vi.fn();
    render(<Autocomplete {...defaultProps} defaultValue="Lyon" onChange={onChange} onClear={onClear} />);
    const input = screen.getByRole('combobox') as HTMLInputElement;
    expect(input.value).toBe('Lyon');

    const clearButton = screen.getByTitle('Effacer');
    await act(async () => {
      fireEvent.click(clearButton);
    });

    expect(input.value).toBe('');
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith('');
    expect(onClear).toHaveBeenCalledOnce();
  });

  it("n'appelle fetchFn qu'une fois pour une saisie rapide (debounce)", async () => {
    render(<Autocomplete {...defaultProps} />);
    const input = screen.getByRole('combobox');

    await act(async () => {
      fireEvent.change(input, { target: { value: 'a' } });
      fireEvent.change(input, { target: { value: 'ab' } });
      fireEvent.change(input, { target: { value: 'abc' } });
      await vi.advanceTimersByTimeAsync(DEFAULT_DEBOUNCE_TIME);
    });

    expect(defaultFetchFn).toHaveBeenCalledOnce();
    expect(defaultFetchFn).toHaveBeenCalledWith('abc', expect.any(AbortSignal));
  });

  it("l'input est accessible avec le bon rôle ARIA", () => {
    render(<Autocomplete {...defaultProps} />);
    const input = screen.getByRole('combobox');
    expect(input).toBeDefined();
    expect(input.getAttribute('aria-autocomplete')).toBe('both');
    expect(input.getAttribute('aria-expanded')).toBe('false');
  });
});
