# Node.js Code Style

> Node.js/JavaScript coding standards for france-chaleur-urbaine

## 🎯 General Principles

- Write clean, readable, maintainable code
- Prefer functional and declarative patterns
- Avoid mutation when possible
- Use modern ES6+ features
- Follow the Single Responsibility Principle

## 📁 File Organization

### File Structure

```javascript
// 1. Imports (grouped logically)
import { readFile } from 'fs/promises'
import express from 'express'

// 2. Constants
const PORT = process.env.PORT || 3000
const MAX_RETRIES = 3

// 3. Helper functions
const parseData = (data) => {
  // ...
}

// 4. Main logic
const app = express()

// 5. Exports
export { app, parseData }
```

### File Naming

- Use **kebab-case** for files: `user-service.js`, `api-client.js`
- Match filename to main export: `UserService` → `user-service.js`
- Use `.mjs` for ES modules if needed

## 🔤 Naming Conventions

### Variables

```javascript
// ✅ Use camelCase
const userName = 'John'
const isActive = true
const hasPermission = false

// ✅ Use descriptive names with auxiliary verbs
const isLoading = false
const hasError = false
const shouldRetry = true

// ❌ Avoid abbreviations
const usr = 'John'  // Bad
const user = 'John' // Good
```

### Constants

```javascript
// ✅ Use UPPER_SNAKE_CASE for true constants
const API_URL = 'https://api.example.com'
const MAX_RETRIES = 3
const DEFAULT_TIMEOUT = 5000

// ✅ Use camelCase for configuration objects
const config = {
  apiUrl: 'https://api.example.com',
  maxRetries: 3
}
```

### Functions

```javascript
// ✅ Use verb + noun pattern
function getUser() {}
function createPost() {}
function validateEmail() {}
function calculateTotal() {}

// ✅ Boolean functions start with is/has/should
function isAuthenticated() {}
function hasPermission() {}
function shouldRetry() {}
```

## 🔧 Modern JavaScript

### Use ES6+ Features

```javascript
// ✅ Destructuring
const { name, email } = user
const [first, ...rest] = items

// ✅ Spread operator
const newUser = { ...user, age: 30 }
const combined = [...array1, ...array2]

// ✅ Template literals
const message = `Hello, ${name}!`

// ✅ Arrow functions (for callbacks)
items.map(item => item.id)
items.filter(item => item.active)

// ✅ Default parameters
function greet(name = 'Guest') {
  return `Hello, ${name}`
}

// ✅ Optional chaining
const city = user?.address?.city

// ✅ Nullish coalescing
const port = process.env.PORT ?? 3000
```

### Async/Await

```javascript
// ✅ Prefer async/await over promises
async function fetchUser(id) {
  try {
    const response = await fetch(`/api/users/${id}`)
    const user = await response.json()
    return user
  } catch (error) {
    console.error('Failed to fetch user:', error)
    throw error
  }
}

// ✅ Always handle errors
async function processData() {
  try {
    await step1()
    await step2()
    await step3()
  } catch (error) {
    logger.error('Processing failed:', error)
    // Handle error appropriately
  }
}

// ❌ Don't mix async/await with .then()
async function bad() {
  return fetch('/api').then(r => r.json()) // Don't do this
}
```

### Promises

```javascript
// ✅ Use Promise.all for parallel operations
const [users, posts, comments] = await Promise.all([
  fetchUsers(),
  fetchPosts(),
  fetchComments()
])

// ✅ Use Promise.allSettled to handle partial failures
const results = await Promise.allSettled([
  risky1(),
  risky2(),
  risky3()
])
```

## 🎨 Code Style

### Spacing and Formatting

```javascript
// ✅ Use 2 spaces for indentation
function example() {
  if (condition) {
    doSomething()
  }
}

// ✅ Space after keywords
if (condition) {}
for (let i = 0; i < 10; i++) {}

// ✅ Space around operators
const sum = a + b
const isValid = x > 0 && y < 100

// ✅ No space before function parentheses (except keywords)
function name() {}
const fn = () => {}
if (condition) {}
```

### Semicolons

```javascript
// ✅ Use semicolons (or don't, but be consistent)
const x = 5;
doSomething();

// If you don't use semicolons, understand ASI rules
const x = 5
doSomething()
```

### String Quotes

```javascript
// ✅ Use single quotes (or configure Prettier)
const name = 'John'

// ✅ Use template literals for interpolation
const greeting = `Hello, ${name}!`

// ❌ Don't concatenate strings
const bad = 'Hello, ' + name + '!' // Bad
```

## 🔍 Functions

### Pure Functions

```javascript
// ✅ Prefer pure functions
const add = (a, b) => a + b
const double = (x) => x * 2

// ❌ Avoid side effects in utility functions
const bad = (arr) => {
  arr.push(1) // Mutates input
  return arr
}

// ✅ Return new values
const good = (arr) => [...arr, 1]
```

### Arrow Functions vs Regular Functions

```javascript
// ✅ Arrow functions for callbacks
items.map(item => item * 2)
items.filter(item => item > 0)

// ✅ Regular functions for methods
const obj = {
  name: 'John',
  greet() {
    return `Hello, ${this.name}`
  }
}

// ❌ Don't use arrow functions for methods
const bad = {
  name: 'John',
  greet: () => this.name // 'this' is wrong
}
```

### Function Length

- Keep functions small (< 50 lines)
- One function, one purpose
- Extract complex logic into helper functions

## 📊 Arrays and Objects

### Array Methods

```javascript
// ✅ Use declarative array methods
const ids = users.map(u => u.id)
const active = users.filter(u => u.active)
const total = numbers.reduce((sum, n) => sum + n, 0)
const hasAdmin = users.some(u => u.role === 'admin')
const allValid = users.every(u => u.validated)

// ❌ Avoid imperative loops when declarative works
const ids = []
for (let i = 0; i < users.length; i++) {
  ids.push(users[i].id) // Prefer map()
}
```

### Object Handling

```javascript
// ✅ Use object shorthand
const name = 'John'
const age = 30
const user = { name, age }

// ✅ Use computed property names
const key = 'status'
const obj = { [key]: 'active' }

// ✅ Object destructuring for multiple returns
function getUser() {
  return { name: 'John', age: 30, email: 'john@example.com' }
}
const { name, age } = getUser()
```

## ⚠️ Error Handling

### Try-Catch

```javascript
// ✅ Handle errors appropriately
async function processData(data) {
  try {
    const validated = validateData(data)
    const processed = await processData(validated)
    return processed
  } catch (error) {
    if (error instanceof ValidationError) {
      logger.warn('Validation failed:', error)
      throw new BadRequestError(error.message)
    }
    logger.error('Processing failed:', error)
    throw new InternalError('Failed to process data')
  }
}

// ✅ Always log errors with context
catch (error) {
  logger.error('Operation failed', {
    operation: 'fetchUser',
    userId: id,
    error: error.message,
    stack: error.stack
  })
}
```

### Custom Errors

```javascript
// ✅ Create custom error classes
class ValidationError extends Error {
  constructor(message, field) {
    super(message)
    this.name = 'ValidationError'
    this.field = field
  }
}

throw new ValidationError('Invalid email', 'email')
```

## 🧹 Best Practices

### Avoid Nested Code

```javascript
// ❌ Bad - Nested conditions
function processUser(user) {
  if (user) {
    if (user.active) {
      if (user.verified) {
        return doSomething(user)
      }
    }
  }
}

// ✅ Good - Guard clauses
function processUser(user) {
  if (!user) return
  if (!user.active) return
  if (!user.verified) return

  return doSomething(user)
}
```

### Avoid Magic Numbers

```javascript
// ❌ Bad
if (status === 1) {
  // What does 1 mean?
}

// ✅ Good
const STATUS = {
  PENDING: 1,
  APPROVED: 2,
  REJECTED: 3
}

if (status === STATUS.PENDING) {
  // Clear intent
}
```

### Use Descriptive Conditions

```javascript
// ❌ Bad
if (x > 18 && x < 65 && !banned) {
  // ...
}

// ✅ Good
const isWorkingAge = x > 18 && x < 65
const canParticipate = isWorkingAge && !banned

if (canParticipate) {
  // ...
}
```

## 📚 Imports/Exports

### Import Order

```javascript
// 1. Node built-ins
import fs from 'fs/promises'
import path from 'path'

// 2. External dependencies
import express from 'express'
import { z } from 'zod'

// 3. Internal modules (absolute paths)
import { logger } from '@/utils/logger'
import { config } from '@/config'

// 4. Relative imports
import { helper } from './helpers'
import { constants } from './constants'
```

### Export Styles

```javascript
// ✅ Named exports (preferred)
export function getUser() {}
export const API_URL = 'https://...'

// ✅ Default export for single main export
export default function UserService() {}

// ❌ Avoid mixing default and named
// Pick one style and stick with it
```

## 🔧 Node.js Specific

### File System

```javascript
// ✅ Always use fs/promises
import { readFile, writeFile } from 'fs/promises'

const content = await readFile('file.txt', 'utf-8')
await writeFile('output.txt', data, 'utf-8')

// ❌ Don't use callback-style fs
import fs from 'fs'
fs.readFile('file.txt', (err, data) => {}) // Don't do this
```

### Environment Variables

```javascript
// ✅ Validate at startup
const config = {
  port: process.env.PORT ?? 3000,
  nodeEnv: process.env.NODE_ENV ?? 'development',
  apiKey: process.env.API_KEY // Will be undefined if missing
}

// Validate required vars
if (!config.apiKey) {
  throw new Error('API_KEY environment variable is required')
}
```

### Process Handling

```javascript
// ✅ Handle process signals
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully')
  await server.close()
  await db.disconnect()
  process.exit(0)
})

// ✅ Handle unhandled rejections
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled rejection:', error)
  process.exit(1)
})
```

---

**Tools**: ESLint, Prettier
**Review frequency**: When adopting new patterns
