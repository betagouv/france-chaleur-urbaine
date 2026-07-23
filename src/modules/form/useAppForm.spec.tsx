import { useStore } from '@tanstack/react-form';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { Form } from './Form';
import { schemaValidation, useAppForm } from './useAppForm';

const zTestForm = z
  .object({
    email: z.email('Email invalide'),
    newsletter: z.boolean(),
    nickname: z.string().optional(),
    reason: z.string().optional(),
  })
  .refine((data) => !data.newsletter || !!data.reason, { error: 'Raison requise', path: ['reason'] });

type TestFormValues = z.input<typeof zTestForm>;

type TestFormProps = {
  onSubmit: (value: TestFormValues) => void;
};

// annotating with z.input aligns the inferred form data with the schema (optional fields)
const defaultValues: z.input<typeof zTestForm> = { email: '', newsletter: false, nickname: '', reason: '' };

function TestForm({ onSubmit }: TestFormProps) {
  const form = useAppForm({
    ...schemaValidation(zTestForm),
    defaultValues,
    onSubmit: ({ value }) => onSubmit(value),
  });
  const newsletter = useStore(form.store, (state) => state.values.newsletter);

  return (
    <Form form={form}>
      <form.AppField name="email">{(field) => <field.EmailField label="Email" />}</form.AppField>
      <form.AppField name="nickname">{(field) => <field.TextField label="Pseudo" />}</form.AppField>
      <form.AppField name="newsletter">{(field) => <field.CheckboxField label="Newsletter" />}</form.AppField>
      {newsletter && <form.AppField name="reason">{(field) => <field.TextField label="Raison" />}</form.AppField>}
      <form.SubmitButton>Envoyer</form.SubmitButton>
    </Form>
  );
}

const zChoicesForm = z.object({
  dataType: z.enum(['address', 'coordinates']),
  separator: z.string(),
  surface: z.number().optional(),
});

const choicesDefaultValues: z.input<typeof zChoicesForm> = { dataType: 'address', separator: ',', surface: undefined };

type ChoicesFormProps = {
  onSubmit: (value: z.input<typeof zChoicesForm>) => void;
};

function ChoicesForm({ onSubmit }: ChoicesFormProps) {
  const form = useAppForm({
    ...schemaValidation(zChoicesForm),
    defaultValues: choicesDefaultValues,
    onSubmit: ({ value }) => onSubmit(value),
  });

  return (
    <Form form={form}>
      <form.AppField name="separator">
        {(field) => (
          <field.SelectField
            label="Séparateur"
            options={[
              { label: 'Virgule', value: ',' },
              { label: 'Tabulation', value: '\t' },
            ]}
          />
        )}
      </form.AppField>
      <form.AppField name="dataType">
        {(field) => (
          <field.RadioField
            label="Type de données"
            options={[
              { label: 'Adresses', nativeInputProps: { value: 'address' } },
              { label: 'Coordonnées', nativeInputProps: { value: 'coordinates' } },
            ]}
          />
        )}
      </form.AppField>
      <form.AppField name="surface">{(field) => <field.NumberField label="Surface" />}</form.AppField>
      <form.SubmitButton>Valider</form.SubmitButton>
    </Form>
  );
}

// the zUpdateProfileSchema shape: refine + transform wrap the object in a ZodPipe,
// which must not break the schema-derived required markers
const zPipedForm = z
  .object({
    firstName: z.string().min(1, 'Le prénom est obligatoire'),
    nickname: z.string().optional(),
  })
  .refine(() => true)
  .transform((value) => value);

const pipedDefaultValues: z.input<typeof zPipedForm> = { firstName: '', nickname: '' };

function PipedForm() {
  const form = useAppForm({
    ...schemaValidation(zPipedForm),
    defaultValues: pipedDefaultValues,
    onSubmit: () => {},
  });

  return (
    <Form form={form}>
      <form.AppField name="firstName">{(field) => <field.TextField label="Prénom" />}</form.AppField>
      <form.AppField name="nickname">{(field) => <field.TextField label="Pseudo" />}</form.AppField>
      <form.SubmitButton>Envoyer</form.SubmitButton>
    </Form>
  );
}

// conditional requirements are object-level refines with `when: () => true`: zod skips
// a schema's checks when the base parse has an aborting issue (e.g. a required enum
// still undefined), which would otherwise hide the refine error until every other
// field is fixed (see the module AGENTS.md)
const zConditionalForm = z
  .object({
    mode: z.enum(['simple', 'avance'], { error: 'Ce choix est obligatoire' }),
    ouvert: z.boolean(),
    referent: z.string().optional(),
  })
  .refine((data) => !data.ouvert || !!data.referent, { error: 'Référent requis', path: ['referent'], when: () => true });

const conditionalDefaultValues: z.input<typeof zConditionalForm> = {
  mode: undefined as unknown as 'simple' | 'avance',
  ouvert: true,
  referent: '',
};

function ConditionalForm() {
  const form = useAppForm({
    ...schemaValidation(zConditionalForm),
    defaultValues: conditionalDefaultValues,
    onSubmit: () => {},
  });

  return (
    <Form form={form}>
      <form.AppField name="mode">
        {(field) => (
          <field.RadioField
            label="Mode"
            options={[
              { label: 'Simple', nativeInputProps: { value: 'simple' } },
              { label: 'Avancé', nativeInputProps: { value: 'avance' } },
            ]}
          />
        )}
      </form.AppField>
      <form.AppField name="referent">{(field) => <field.TextField label="Référent" />}</form.AppField>
      <form.SubmitButton>Envoyer</form.SubmitButton>
    </Form>
  );
}

// two branches sharing a field name: switching remounts the shared field
const zBranchForm = z.discriminatedUnion('typeDemande', [
  z.object({ shared: z.string({ error: 'shared requis' }), typeDemande: z.literal('a') }),
  z.object({ onlyB: z.string({ error: 'onlyB requis' }), shared: z.string({ error: 'shared requis' }), typeDemande: z.literal('b') }),
  z.object({ typeDemande: z.literal('').refine(() => false, { message: 'type requis' }) }),
]);

type BranchValues = { typeDemande: 'a' | 'b' | ''; shared?: string; onlyB?: string };

function BranchForm() {
  const form = useAppForm({
    ...schemaValidation(zBranchForm as unknown as z.ZodType<BranchValues, BranchValues>),
    defaultValues: { typeDemande: '' } as BranchValues,
    onSubmit: () => {},
  });
  const typeDemande = useStore(form.store, (state) => state.values.typeDemande);

  return (
    <Form form={form}>
      <form.AppField name="typeDemande">
        {(field) => (
          <field.RadioField
            label="Type"
            options={[
              { label: 'A', nativeInputProps: { value: 'a' } },
              { label: 'B', nativeInputProps: { value: 'b' } },
            ]}
          />
        )}
      </form.AppField>
      {typeDemande === 'a' && <form.AppField name="shared">{(field) => <field.TextField label="Shared" />}</form.AppField>}
      {typeDemande === 'b' && (
        <>
          <form.AppField name="shared">{(field) => <field.TextField label="Shared" />}</form.AppField>
          <form.AppField name="onlyB">{(field) => <field.TextField label="OnlyB" />}</form.AppField>
        </>
      )}
      <form.SubmitButton>Envoyer</form.SubmitButton>
    </Form>
  );
}

const submitForm = async () => {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer' }));
  });
};

describe('useAppForm', () => {
  it('shows no error while typing before the first submit attempt', async () => {
    render(<TestForm onSubmit={vi.fn()} />);

    const emailInput = screen.getByLabelText(/Email/);
    await act(async () => {
      fireEvent.change(emailInput, { target: { value: 'not-an-email' } });
      fireEvent.blur(emailInput);
    });

    expect(screen.queryByText('Email invalide')).toBeNull();
  });

  it('reveals errors on the first submit attempt and does not call onSubmit', async () => {
    const handleSubmit = vi.fn();
    render(<TestForm onSubmit={handleSubmit} />);

    await submitForm();

    expect(screen.getByText('Email invalide')).toBeTruthy();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('clears a visible error live while typing once the value is fixed (no blur needed)', async () => {
    render(<TestForm onSubmit={vi.fn()} />);
    await submitForm();
    expect(screen.getByText('Email invalide')).toBeTruthy();

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'user@example.com' } });
    });

    expect(screen.queryByText('Email invalide')).toBeNull();
  });

  it('does not flag an error-free field mid-typing; new errors only show on blur', async () => {
    render(<TestForm onSubmit={vi.fn()} />);
    await submitForm();
    const emailInput = screen.getByLabelText(/Email/);

    // fix the email and leave the field: it is now error-free
    await act(async () => {
      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
      fireEvent.blur(emailInput);
    });
    expect(screen.queryByText('Email invalide')).toBeNull();

    // edit it again: an incomplete value must not be flagged while typing
    await act(async () => {
      fireEvent.focus(emailInput);
      fireEvent.change(emailInput, { target: { value: 'user@incomplet' } });
    });
    expect(screen.queryByText('Email invalide')).toBeNull();

    // leaving the field reveals the error
    await act(async () => {
      fireEvent.blur(emailInput);
    });
    expect(screen.getByText('Email invalide')).toBeTruthy();
  });

  it('keeps the submit button enabled while the form is invalid', async () => {
    render(<TestForm onSubmit={vi.fn()} />);

    await submitForm();

    expect(screen.getByRole('button', { name: 'Envoyer' }).hasAttribute('disabled')).toStrictEqual(false);
  });

  it('focuses the first invalid field after a failed submit attempt', async () => {
    render(<TestForm onSubmit={vi.fn()} />);

    await submitForm();

    expect(document.activeElement).toStrictEqual(screen.getByLabelText(/Email/));
  });

  it('calls onSubmit with the form values when valid', async () => {
    const handleSubmit = vi.fn();
    render(<TestForm onSubmit={handleSubmit} />);

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'user@example.com' } });
      fireEvent.change(screen.getByLabelText(/Pseudo/), { target: { value: 'max' } });
      fireEvent.click(screen.getByLabelText('Newsletter'));
    });
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/Raison/), { target: { value: 'test' } });
    });
    await submitForm();

    expect(handleSubmit).toHaveBeenCalledExactlyOnceWith({ email: 'user@example.com', newsletter: true, nickname: 'max', reason: 'test' });
  });

  it('keeps a field revealed after a failed submit pristine until the next submit', async () => {
    render(<TestForm onSubmit={vi.fn()} />);
    await submitForm();

    // revealing the conditional required field must not show its error immediately
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Newsletter'));
    });
    expect(screen.getByLabelText(/Raison/)).toBeTruthy();
    expect(screen.queryByText('Raison requise')).toBeNull();

    // the next submit attempt reveals it
    await submitForm();
    expect(screen.getByText('Raison requise')).toBeTruthy();
  });

  it('binds SelectField and RadioField to the form values', async () => {
    const handleSubmit = vi.fn();
    render(<ChoicesForm onSubmit={handleSubmit} />);

    // initial state reflects defaultValues
    expect((screen.getByLabelText('Adresses') as HTMLInputElement).checked).toStrictEqual(true);

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/Séparateur/), { target: { value: '\t' } });
      fireEvent.click(screen.getByLabelText('Coordonnées'));
      fireEvent.change(screen.getByLabelText(/Surface/), { target: { value: '120' } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Valider' }));
    });

    expect(handleSubmit).toHaveBeenCalledExactlyOnceWith({ dataType: 'coordinates', separator: '\t', surface: 120 });
  });

  it('stores undefined when a NumberField is emptied', async () => {
    const handleSubmit = vi.fn();
    render(<ChoicesForm onSubmit={handleSubmit} />);

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/Surface/), { target: { value: '120' } });
      fireEvent.change(screen.getByLabelText(/Surface/), { target: { value: '' } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Valider' }));
    });

    expect(handleSubmit).toHaveBeenCalledExactlyOnceWith({ dataType: 'address', separator: ',', surface: undefined });
  });

  it('derives required markers through a refined + transformed schema (ZodPipe)', () => {
    render(<PipedForm />);

    // required field: no "(Optionnel)" label suffix, required attribute set
    expect((screen.getByLabelText(/Prénom/) as HTMLInputElement).required).toStrictEqual(true);
    expect((screen.getByLabelText(/Pseudo/) as HTMLInputElement).required).toStrictEqual(false);
    expect(screen.getAllByText('(Optionnel)')).toHaveLength(1);
  });

  it('derives the required marker from the schema', () => {
    render(<TestForm onSubmit={vi.fn()} />);

    const emailInput = screen.getByLabelText(/Email/);
    const nicknameInput = screen.getByLabelText(/Pseudo/);
    expect(emailInput.hasAttribute('required')).toStrictEqual(true);
    expect(nicknameInput.hasAttribute('required')).toStrictEqual(false);
    // the DSFR Input wrapper appends "(Optionnel)" to optional labels
    expect(screen.getByText('(Optionnel)')).toBeTruthy();
  });

  it('reports conditional refine errors even when another field has an aborting issue', async () => {
    render(<ConditionalForm />);

    await submitForm();

    // without when: () => true on the refine, the unselected enum (aborting issue)
    // would suppress the conditional requirement until everything else is fixed
    expect(screen.getByText('Ce choix est obligatoire')).toBeTruthy();
    expect(screen.getByText('Référent requis')).toBeTruthy();
  });

  it('re-reveals the errors of fields remounted by a union branch switch on the next submit', async () => {
    render(<BranchForm />);
    const pickBranch = (label: string) =>
      act(async () => {
        fireEvent.click(screen.getByLabelText(label));
      });

    await submitForm();
    await pickBranch('A');
    await submitForm();
    expect(screen.getByText('shared requis')).toBeTruthy();

    // switching branch remounts the shared field: pristine until the next submit
    await pickBranch('B');
    expect(screen.queryByText('shared requis')).toBeNull();

    // TanStack's handleSubmit alone would return early here (a stale meta on onlyB
    // fails its isFieldsValid gate before any re-validation) — the Form wrapper's
    // explicit validate('submit') guarantees fresh metas on every attempt
    await submitForm();
    expect(screen.getByText('shared requis')).toBeTruthy();
    expect(screen.getByText('onlyB requis')).toBeTruthy();
  });
});
