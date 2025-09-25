# Notification Module

Ready-to-use notification system with toast notifications, error handling, and URL-based notifications.

## Quick Installation

### 1. Install Dependencies
```bash
# Install dependencies
pnpm add react-hot-toast nuqs
```

### 2. Integrate with _app.tsx
```typescript
import { NotifierContainer } from '@/modules/notification';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <NotifierContainer>
      <Component {...pageProps} />
    </NotifierContainer>
  );
}

export default MyApp;
```

### 3. Ready to Use! 🎉

## Usage

### Basic Notifications

```typescript
import { notify } from '@/modules/notification';

// Success notification
notify('success', 'Operation completed successfully');

// Error notification
notify('error', 'Something went wrong');

// Custom notification (no variant)
notify('none', 'Custom message', { duration: 3000 });
```

### Error Handling with toastErrors

The `toastErrors` function wraps async functions to automatically show error notifications:

```typescript
import { toastErrors } from '@/modules/notification';

// Basic usage
const handleSubmit = toastErrors(async (formData: FormData) => {
  await api.submit(formData);
  notify('success', 'Form submitted successfully');
});

// With custom error message
const handleSubmit = toastErrors(
  async (formData: FormData) => {
    await api.submit(formData);
    notify('success', 'Form submitted successfully');
  },
  (err) => `Custom error message: ${err.message}`
);
```

### URL-based Notifications

The module supports URL-based notifications through query parameters:

```typescript
// Redirect with notification
router.push('/dashboard?notify=success:Operation completed');

// Redirect with error notification
router.push('/login?notify=error:Invalid credentials');
```

### Integration with Forms

```typescript
import { useForm } from '@/components/form/react-form/useForm';
import { toastErrors } from '@/modules/notification';

const MyForm = () => {
  const { Form, Input, Submit } = useForm({
    schema: mySchema,
    onSubmit: toastErrors(async ({ value }) => {
      await api.create(value);
      notify('success', 'Item created successfully');
    }),
  });

  return (
    <Form>
      <Input name="name" label="Name" />
      <Submit>Create</Submit>
    </Form>
  );
};
```

### Integration with tRPC Mutations

```typescript
import trpc from '@/modules/trpc/client';
import { notify, toastErrors } from '@/modules/notification';

const MyComponent = () => {
  const { mutateAsync: createItem } = trpc.items.create.useMutation({
    onSuccess: () => {
      notify('success', 'Item created successfully');
    },
  });

  const handleCreate = toastErrors(async (data: CreateItemInput) => {
    await createItem(data);
  });

  return (
    <button onClick={() => handleCreate({ name: 'New Item' })}>
      Create Item
    </button>
  );
};
```

## API Reference

### Functions

#### `notify(variant, message, options?)`

Shows a toast notification.

**Parameters:**
- `variant: 'success' | 'error' | 'none'` - The notification type
- `message: string | ReactNode` - The message to display
- `options?: ToastOptions` - Additional options (duration, id, etc.)

**Returns:** `string` - The toast ID

#### `toastErrors(func, customError?)`

Wraps an async function to handle errors with toast notifications.

**Parameters:**
- `func: (...args: any[]) => void | Promise<void>` - The function to wrap
- `customError?: (err: Error) => ReactNode` - Custom error message function

**Returns:** `(...args: any[]) => Promise<void>` - The wrapped function

### Components

#### `NotifierContainer`

Provider component that handles URL-based notifications and renders the toast container.

**Props:**
- `children: ReactNode` - Child components

**Features:**
- Listens for `notify` query parameter
- Renders `react-hot-toast` Toaster
- Custom toast styling

## Configuration

### Toast Styling

The module uses custom styling for toasts:

```typescript
// Default toast options
{
  style: {
    boxShadow: '0 0 8px 0 rgba(0, 0, 0, 0.2)',
    border: '1px solid #EEE',
  },
}
```

### Default Duration

All notifications have a default duration of 5000ms (5 seconds).

## Examples

### Form Submission with Error Handling

```typescript
const ContactForm = () => {
  const { Form, Input, Submit } = useForm({
    schema: contactSchema,
    onSubmit: toastErrors(
      async ({ value }) => {
        await api.sendContactForm(value);
        notify('success', 'Message sent successfully');
      },
      (err) => (
        <span>
          Une erreur est survenue. Veuillez réessayer plus tard, si le problème persiste contactez-nous directement à l'adresse:{' '}
          <a href={`mailto:${clientConfig.contactEmail}`}>{clientConfig.contactEmail}</a>
        </span>
      )
    ),
  });

  return (
    <Form>
      <Input name="email" label="Email" />
      <Input name="message" label="Message" />
      <Submit>Send</Submit>
    </Form>
  );
};
```

### CRUD Operations

```typescript
const UserManagement = () => {
  const { mutateAsync: updateUser } = trpc.users.update.useMutation({
    onSuccess: () => {
      notify('success', 'User updated successfully');
    },
  });

  const handleUpdate = toastErrors(async (userId: string, userData: UserUpdate) => {
    await updateUser({ id: userId, ...userData });
  });

  const handleDelete = toastErrors(async (userId: string) => {
    await api.deleteUser(userId);
    notify('success', 'User deleted successfully');
  });

  return (
    <div>
      {/* User management UI */}
    </div>
  );
};
```

### URL-based Redirects

```typescript
const LoginForm = () => {
  const router = useRouter();

  const handleLogin = toastErrors(async (credentials: LoginCredentials) => {
    await api.login(credentials);
    router.push('/dashboard?notify=success:Welcome back!');
  });

  return (
    <form onSubmit={handleLogin}>
      {/* Login form fields */}
    </form>
  );
};
```
