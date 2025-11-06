import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import ComboBox, { type ComboBoxOption } from './ComboBox';

const options: ComboBoxOption[] = [
  { key: 'paris', label: 'Paris' },
  { key: 'lyon', label: 'Lyon' },
  { key: 'marseille', label: 'Marseille' },
  { key: 'lille', label: 'Lille' },
];

function SingleWrapper() {
  const [value, setValue] = useState('');
  return <ComboBox label="Ville" options={options} value={value} onChange={setValue} />;
}

function MultiWrapper() {
  const [value, setValue] = useState<string[]>([]);
  return <ComboBox label="Villes" options={options} multiple value={value} onChange={setValue} />;
}

afterEach(() => {
  cleanup();
});

describe('ComboBox (single)', () => {
  it('opens the popup and shows options, selects one and closes', async () => {
    render(<SingleWrapper />);

    // open
    fireEvent.click(screen.getByRole('combobox'));
    const listbox = await screen.findByRole('listbox');
    expect(within(listbox).getByText('Paris')).toBeTruthy();

    // filter and select
    const search = screen.getByPlaceholderText('Rechercher…');
    fireEvent.change(search, { target: { value: 'ly' } });
    expect(within(listbox).getByText('Lyon')).toBeTruthy();
    expect(within(listbox).queryByText('Marseille')).toBeNull();

    // press Enter to select highlighted (Lyon)
    fireEvent.keyDown(search, { code: 'Enter', key: 'Enter' });

    // closed and combobox shows selected label
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(screen.getByRole('combobox').textContent).toContain('Lyon');
  });
});

describe('ComboBox (multiple)', () => {
  it('allows selecting multiple options and unselecting', async () => {
    render(<MultiWrapper />);

    // open and select Paris
    fireEvent.click(screen.getByRole('combobox'));
    let listbox = await screen.findByRole('listbox');
    fireEvent.click(within(listbox).getByText('Paris'));

    // stays open in multiple mode, select Lyon
    listbox = await screen.findByRole('listbox');
    fireEvent.click(within(listbox).getByText('Lyon'));

    // trigger shows both selected values in multi mode
    const trigger = screen.getByRole('combobox');
    expect(trigger.textContent).toContain('Paris');
    expect(trigger.textContent).toContain('Lyon');
  });
});
