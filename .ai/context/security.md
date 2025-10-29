## Security

- Input: validate/sanitize (Zod on client and server)
- Secrets: env vars only; never commit
- Permissions: check on server (roles/ownership)
- HTTP: security headers, strict CORS, strict CSP
- Personal data: minimize; encrypt at rest if sensitive
- Logs: no PII; use correlatable trace IDs
