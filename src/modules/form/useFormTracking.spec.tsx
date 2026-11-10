import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

vi.mock('@/modules/analytics/client', () => ({ trackPostHogEvent: vi.fn() }));
vi.mock('@/modules/notification', () => ({ handleClientError: vi.fn() }));

import { trackPostHogEvent } from '@/modules/analytics/client';
import type { TestCase } from '@/tests/trpc-helpers';

import { Form } from './Form';
import { schemaValidation, useAppForm } from './useAppForm';
import { useFormTracking } from './useFormTracking';

const zTrackedForm = z.object({ email: z.email('Email invalide') });

type TrackedFormProps = {
  onSubmit: () => Promise<void>;
  getSubmittedProperties?: () => Record<string, string>;
};

function TrackedForm({ onSubmit, getSubmittedProperties }: TrackedFormProps) {
  const form = useAppForm({
    ...schemaValidation(zTrackedForm),
    defaultValues: { email: '' },
    onSubmit,
  });
  useFormTracking(form, { formName: 'suivi_demande', getSubmittedProperties, source: 'test' });

  return (
    <Form form={form}>
      <form.AppField name="email">{(field) => <field.EmailField label="Email" />}</form.AppField>
      <form.SubmitButton>Envoyer</form.SubmitButton>
    </Form>
  );
}

// `Button` forwards its optional `postHogEventKey` (undefined here) to the tracker, which ignores it
const formEvents = () => vi.mocked(trackPostHogEvent).mock.calls.filter(([event]) => event !== undefined);

const base = { form_name: 'suivi_demande', source: 'test' };
const fillingEvents = [
  ['form:started', { ...base, field_name: 'email' }],
  ['form:field_filled', { ...base, field_name: 'email' }],
];

type SubmitScenario = { typedEmail?: string; onSubmit: () => Promise<void> };

const cases: TestCase<SubmitScenario, unknown[][]>[] = [
  {
    expectedOutput: [['form:submit_failed', { ...base, fields_in_error: ['email'], reason: 'validation' }]],
    input: { onSubmit: vi.fn().mockResolvedValue(undefined) },
    label: 'empty form → validation failure',
  },
  {
    expectedOutput: [...fillingEvents, ['form:submit_failed', { ...base, fields_in_error: ['email'], reason: 'validation' }]],
    input: { onSubmit: vi.fn().mockResolvedValue(undefined), typedEmail: 'not-an-email' },
    label: 'invalid email → validation failure',
  },
  {
    expectedOutput: [...fillingEvents, ['form:submit_failed', { ...base, fields_in_error: [], reason: 'server' }]],
    input: { onSubmit: vi.fn().mockRejectedValue(new Error('boom')), typedEmail: 'marie@example.fr' },
    label: 'onSubmit throws → server failure, not a success',
  },
  {
    expectedOutput: [...fillingEvents, ['form:submitted', base]],
    input: { onSubmit: vi.fn().mockResolvedValue(undefined), typedEmail: 'marie@example.fr' },
    label: 'onSubmit resolves → submitted',
  },
];

describe('useFormTracking', () => {
  beforeEach(() => {
    vi.mocked(trackPostHogEvent).mockClear();
  });

  it.each(cases)('$label', async ({ input: { typedEmail, onSubmit }, expectedOutput }) => {
    render(<TrackedForm onSubmit={onSubmit} />);

    if (typedEmail) {
      await act(async () => {
        fireEvent.change(screen.getByLabelText('Email'), { target: { value: typedEmail } });
      });
    }
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Envoyer' }));
    });
    // the outcome is reported once the submit attempt settles
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(formEvents()).toStrictEqual(expectedOutput);
  });

  it('reports each field once even when the component re-renders with an inline getSubmittedProperties', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { rerender } = render(<TrackedForm onSubmit={onSubmit} getSubmittedProperties={() => ({ kind: 'first' })} />);

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'marie@' } });
    });
    rerender(<TrackedForm onSubmit={onSubmit} getSubmittedProperties={() => ({ kind: 'latest' })} />);
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'marie@example.fr' } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Envoyer' }));
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(formEvents()).toStrictEqual([...fillingEvents, ['form:submitted', { ...base, kind: 'latest' }]]);
  });
});
