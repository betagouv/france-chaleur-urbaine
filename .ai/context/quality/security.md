## Security

## Input Validation

- **Always validate** user input on both client and server
- Use schema validation (Zod, Yup, etc.) for type safety
- Sanitize input to prevent injection attacks

```typescript
// Example with Zod
const schema = z.object({
  email: z.string().email(),
  age: z.number().min(0).max(120),
});

// Validate on server (critical)
const result = schema.parse(userInput);
```

## Secrets Management

- Store secrets in environment variables only
- Never commit secrets to version control
- Use different secrets for dev/staging/production
- Rotate secrets regularly

## Permissions & Authorization

- Check permissions on server (never trust client)
- Verify user roles and resource ownership
- Use middleware for common permission checks
- Fail securely (deny by default)

## HTTP Security

- Use security headers (helmet, etc.)
- Configure strict CORS policies
- Use Content Security Policy (CSP)
- Enable HTTPS in production

## Data Protection

- Minimize personal data collection
- Encrypt sensitive data at rest
- Use secure transmission (HTTPS)
- Follow data retention policies
