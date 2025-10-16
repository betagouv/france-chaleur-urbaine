# Node.js Testing

> Node.js/JavaScript/TypeScript testing patterns for france-chaleur-urbaine

## 🧪 Testing Frameworks

### Vitest (Recommended)

```typescript
// vite.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,          // No need to import describe, it, expect
    environment: 'node',    // or 'jsdom' for browser APIs
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: ['**/*.test.ts', '**/*.spec.ts']
    }
  }
})
```

### Jest

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.test.{js,ts}'
  ],
  testMatch: ['**/__tests__/**/*.test.{js,ts}']
}
```

## 🔧 Testing Utilities

### Supertest (API Testing)

```typescript
import request from 'supertest'
import { app } from './app'

describe('POST /api/users', () => {
  it('creates a new user', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({
        name: 'John Doe',
        email: 'john@example.com'
      })
      .expect(201)

    expect(response.body).toMatchObject({
      name: 'John Doe',
      email: 'john@example.com'
    })
  })

  it('returns 400 for invalid email', async () => {
    await request(app)
      .post('/api/users')
      .send({ name: 'John', email: 'invalid' })
      .expect(400)
  })
})
```

### MSW (Mock Service Worker)

```typescript
// mocks/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('https://api.example.com/users/:id', ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      name: 'John Doe'
    })
  }),

  http.post('https://api.example.com/users', async ({ request }) => {
    const user = await request.json()
    return HttpResponse.json(user, { status: 201 })
  })
]

// mocks/server.ts
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)

// test/setup.ts
import { server } from './mocks/server'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

## 🎭 Mocking

### Module Mocking (Vitest)

```typescript
// ✅ Mock entire module
vi.mock('./userService', () => ({
  getUser: vi.fn(),
  createUser: vi.fn()
}))

// ✅ Mock specific exports
vi.mock('./userService', async () => {
  const actual = await vi.importActual('./userService')
  return {
    ...actual,
    getUser: vi.fn()
  }
})

// Usage
import { getUser } from './userService'

getUser.mockResolvedValue({ id: '1', name: 'John' })
```

### Function Mocking

```typescript
// ✅ Mock function with vi.fn()
const mockFn = vi.fn()

// Configure return value
mockFn.mockReturnValue(42)
mockFn.mockResolvedValue({ data: 'async' })
mockFn.mockRejectedValue(new Error('failed'))

// Check calls
expect(mockFn).toHaveBeenCalled()
expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2')
expect(mockFn).toHaveBeenCalledTimes(2)

// Check call details
expect(mockFn.mock.calls[0][0]).toBe('first arg')
expect(mockFn.mock.results[0].value).toBe(42)
```

### Spy on Methods

```typescript
// ✅ Spy on object methods
const user = {
  getName: () => 'John'
}

const spy = vi.spyOn(user, 'getName')
spy.mockReturnValue('Jane')

expect(user.getName()).toBe('Jane')
expect(spy).toHaveBeenCalled()

spy.mockRestore() // Restore original implementation
```

### Mock fetch

```typescript
// ✅ Mock global fetch
global.fetch = vi.fn()

fetch.mockResolvedValue({
  ok: true,
  json: async () => ({ id: '1', name: 'John' })
})

// Test
const response = await fetch('/api/users/1')
const data = await response.json()
expect(data.name).toBe('John')
```

## 🕐 Timers & Dates

### Fake Timers

```typescript
// ✅ Use fake timers for time-dependent code
describe('retryWithBackoff', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('retries after delay', async () => {
    const mockFn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('success')

    const promise = retryWithBackoff(mockFn, 3, 1000)

    // Advance time
    await vi.advanceTimersByTimeAsync(1000)

    expect(await promise).toBe('success')
    expect(mockFn).toHaveBeenCalledTimes(2)
  })
})
```

### Mock Date

```typescript
// ✅ Mock Date.now()
vi.setSystemTime(new Date('2025-01-15'))

expect(Date.now()).toBe(new Date('2025-01-15').getTime())

// Advance time
vi.advanceTimersByTime(1000)

// Restore
vi.useRealTimers()
```

## 🗄️ Database Testing

### In-Memory Database

```typescript
// ✅ Use in-memory SQLite for tests
import Database from 'better-sqlite3'

describe('UserRepository', () => {
  let db: Database.Database

  beforeEach(() => {
    db = new Database(':memory:')
    db.exec(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL
      )
    `)
  })

  afterEach(() => {
    db.close()
  })

  it('creates a user', () => {
    const stmt = db.prepare('INSERT INTO users VALUES (?, ?, ?)')
    stmt.run('1', 'John', 'john@example.com')

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get('1')
    expect(user.name).toBe('John')
  })
})
```

### Test Database

```typescript
// ✅ Use separate test database
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL
    }
  }
})

beforeEach(async () => {
  // Clean database before each test
  await prisma.$transaction([
    prisma.post.deleteMany(),
    prisma.user.deleteMany()
  ])
})

afterAll(async () => {
  await prisma.$disconnect()
})
```

## 🎪 Integration Testing

### Testing Express Apps

```typescript
import express from 'express'
import request from 'supertest'

describe('User API', () => {
  let app: express.Application

  beforeEach(() => {
    app = express()
    app.use(express.json())

    app.post('/users', (req, res) => {
      if (!req.body.email) {
        return res.status(400).json({ error: 'Email required' })
      }
      res.status(201).json({ id: '1', ...req.body })
    })
  })

  it('creates user with valid data', async () => {
    const response = await request(app)
      .post('/users')
      .send({ name: 'John', email: 'john@example.com' })

    expect(response.status).toBe(201)
    expect(response.body.email).toBe('john@example.com')
  })
})
```

### Testing Next.js API Routes

```typescript
import { createMocks } from 'node-mocks-http'
import handler from './api/users'

describe('/api/users', () => {
  it('GET returns users', async () => {
    const { req, res } = createMocks({
      method: 'GET'
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    expect(JSON.parse(res._getData())).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: expect.any(String) })
      ])
    )
  })

  it('POST creates user', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        name: 'John',
        email: 'john@example.com'
      }
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(201)
  })
})
```

## 📦 Test Fixtures

### Factory Functions

```typescript
// test/factories/user.ts
import { faker } from '@faker-js/faker'

export function createUser(overrides?: Partial<User>): User {
  return {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    age: faker.number.int({ min: 18, max: 80 }),
    createdAt: faker.date.past(),
    ...overrides
  }
}

// Usage
const user = createUser({ email: 'specific@example.com' })
const admin = createUser({ role: 'admin' })
```

### Fixture Files

```typescript
// test/fixtures/users.json
[
  {
    "id": "1",
    "name": "John Doe",
    "email": "john@example.com"
  },
  {
    "id": "2",
    "name": "Jane Smith",
    "email": "jane@example.com"
  }
]

// Load in tests
import users from './fixtures/users.json'

describe('UserService', () => {
  it('processes users', () => {
    const result = processUsers(users)
    expect(result).toHaveLength(2)
  })
})
```

## 🌐 Environment Variables

### Test Environment

```typescript
// test/setup.ts
import { loadEnv } from './utils'

beforeAll(() => {
  process.env.NODE_ENV = 'test'
  process.env.DATABASE_URL = 'postgresql://localhost/test'
  process.env.API_KEY = 'test-key'
})

afterAll(() => {
  // Cleanup
})
```

### dotenv-cli

```json
// package.json
{
  "scripts": {
    "test": "dotenv -e .env.test -- vitest"
  }
}
```

## 🎯 Best Practices

### Avoid Test Interdependence

```typescript
// ❌ Bad - Tests depend on each other
let userId: string

it('creates user', async () => {
  const user = await createUser({ name: 'John' })
  userId = user.id // Shared state!
})

it('deletes user', async () => {
  await deleteUser(userId) // Depends on previous test
})

// ✅ Good - Independent tests
it('creates user', async () => {
  const user = await createUser({ name: 'John' })
  expect(user.id).toBeDefined()
})

it('deletes user', async () => {
  const user = await createUser({ name: 'Jane' })
  await deleteUser(user.id)
  expect(await getUser(user.id)).toBeNull()
})
```

### Test File Organization

```
src/
├── services/
│   ├── user.service.ts
│   └── user.service.test.ts      # Co-located
├── utils/
│   ├── validation.ts
│   └── validation.test.ts
└── __tests__/
    ├── integration/
    │   └── api.test.ts
    ├── fixtures/
    │   └── users.json
    └── helpers/
        └── setup.ts
```

### Snapshot Testing

```typescript
// ✅ Use snapshots for complex objects
it('formats user profile', () => {
  const profile = formatProfile(user)
  expect(profile).toMatchSnapshot()
})

// Update snapshots with: npm test -- -u

// ✅ Inline snapshots for small values
it('generates slug', () => {
  expect(generateSlug('Hello World')).toMatchInlineSnapshot(`"hello-world"`)
})
```

## 📊 Coverage

### Running Coverage

```bash
# Vitest
npm run test -- --coverage

# Jest
npm test -- --coverage
```

### Coverage Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
      exclude: [
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/node_modules/**',
        '**/dist/**'
      ]
    }
  }
})
```

## 🚀 CI/CD

### GitHub Actions

```yaml
name: Test
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci

      - run: npm test

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          file: ./coverage/lcov.info
```

---

**Tools**: Vitest, Jest, Supertest, MSW, Playwright
**Review frequency**: Update when testing patterns change
