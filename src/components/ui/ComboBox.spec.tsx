import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

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

describe('ComboBox (single)', () => {
  it('opens the popup and shows options, selects one and closes', async () => {
    const user = userEvent.setup();
    render(<SingleWrapper />);

    await user.click(screen.getByRole('combobox'));
    const listbox = await screen.findByRole('listbox');
    expect(within(listbox).getByText('Paris')).toBeInTheDocument();

    const search = screen.getByPlaceholderText('Rechercher…');
    await user.type(search, 'ly');
    expect(within(listbox).getByText('Lyon')).toBeInTheDocument();
    expect(within(listbox).queryByText('Marseille')).not.toBeInTheDocument();

    await user.keyboard('{Enter}');

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveTextContent('Lyon');
  });
});

describe('ComboBox (multiple)', () => {
  it('allows selecting multiple options and unselecting', async () => {
    const user = userEvent.setup();
    render(<MultiWrapper />);

    await user.click(screen.getByRole('combobox'));
    let listbox = await screen.findByRole('listbox');
    await user.click(within(listbox).getByText('Paris'));

    listbox = await screen.findByRole('listbox');
    await user.click(within(listbox).getByText('Lyon'));

    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveTextContent('Paris');
    expect(trigger).toHaveTextContent('Lyon');
  });
});
