# Testing Guidelines

> Testing strategy and practices for france-chaleur-urbaine

## 🔥 tRPC Permission Tests - OBLIGATOIRE

**AVANT d'écrire un test tRPC, lis cette section en entier et suis le template.**

### Template complet à copier

```typescript
import type { User } from 'next-auth';
import { describe, expect, it } from 'vitest';

import { uuid } from '@/tests/helpers';
import { createTestCaller, forbiddenError, testUsers } from '@/tests/trpc-helpers';

type PermissionTestCase = {
  label: string;
  user: Partial<User> | null;
  allowed: boolean;
};

describe('myRouter', () => {
  describe('myRoute.action', () => {
    const permissionTests: PermissionTestCase[] = [
      { allowed: false, label: 'refuse utilisateur non authentifié', user: null },
      { allowed: false, label: 'refuse particulier', user: testUsers.particulier },
      { allowed: false, label: 'refuse professionnel', user: testUsers.professionnel },
      { allowed: false, label: 'refuse gestionnaire', user: testUsers.gestionnaire },
      { allowed: true, label: 'autorise admin', user: testUsers.admin },
    ];

    it.each(permissionTests)('$label', async ({ user, allowed }) => {
      const caller = createTestCaller(user);
      const callRoute = () => caller.myRoute.action({ id: uuid(999) });

      if (allowed) {
        // TOUJOURS toStrictEqual avec l'objet COMPLET attendu
        await expect(callRoute()).resolves.toStrictEqual({
          items: [],
          pagination: {
            hasNext: false,
            limit: 50,
            offset: 0,
            total: 0,
          },
        });
      } else {
        // TOUJOURS forbiddenError, JAMAIS l'objet en dur
        await expect(callRoute).rejects.toMatchObject(forbiddenError);
      }
    });
  });
});
```

### Règles NON-NÉGOCIABLES

| Règle | Pourquoi | Exemple correct |
|-------|----------|-----------------|
| **Booléen `allowed`** | Cohérence, pas de mix majuscule/minuscule | `allowed: true` pas `expectedCode: 'success'` |
| **Un seul `callRoute`** | DRY, évite duplication | `const callRoute = () => caller.route()` |
| **`rejects` = fonction** | Gère les exceptions synchrones | `expect(callRoute).rejects` |
| **`resolves` = appel** | Retourne la Promise | `expect(callRoute()).resolves` |
| **`toStrictEqual` pour succès** | Vérifie TOUT, pas juste une partie | Objet complet, pas `expect.any()` |
| **`forbiddenError` constant** | Réutilisable, maintenable | Import de `trpc-helpers.ts` |
| **UUID valide** | Évite erreurs DB inattendues | `uuid(999)` pas `'test-id'` |
| **Pas de `not.toMatchObject`** | Test l'erreur EXACTE attendue | `{ code: 'INTERNAL_SERVER_ERROR' }` |
| **Pas de params inutilisés** | Code propre | Supprimer `caller` si non utilisé |

### Erreurs fréquentes à NE PAS faire

```typescript
// ❌ ERREUR 1: Mix majuscule/minuscule pour expectedCode
expectedCode: 'FORBIDDEN' | 'success'  // NON!
allowed: boolean                        // OUI!

// ❌ ERREUR 2: Deux appels à la route
await expect(caller.route()).rejects...
await expect(caller.route()).resolves...  // NON! Un seul callRoute

// ❌ ERREUR 3: toMatchObject partiel pour succès
.resolves.toMatchObject({ items: expect.any(Array) })  // NON!
.resolves.toStrictEqual({ items: [], ... })            // OUI!

// ❌ ERREUR 4: Test négatif inutile
.rejects.not.toMatchObject({ code: 'FORBIDDEN' })  // NON! Ça teste quoi exactement?
.rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR' })  // OUI!

// ❌ ERREUR 5: String invalide comme ID
{ demand_id: 'test-id' }   // NON! Cause INTERNAL_SERVER_ERROR
{ demand_id: uuid(999) }   // OUI!

// ❌ ERREUR 6: Erreur en dur au lieu de constante
.rejects.toMatchObject({ code: 'FORBIDDEN', message: 'Permissions invalides' })  // NON!
.rejects.toMatchObject(forbiddenError)  // OUI!
```

### Checklist avant commit

- [ ] J'ai utilisé `allowed: boolean` (pas de string)
- [ ] J'ai un seul `callRoute = () => ...` réutilisé
- [ ] `rejects` utilise la fonction: `expect(callRoute).rejects`
- [ ] `resolves` appelle la fonction: `expect(callRoute()).resolves`
- [ ] Succès utilise `toStrictEqual` avec objet COMPLET
- [ ] Erreurs utilisent `forbiddenError` importé
- [ ] IDs utilisent `uuid()` helper
- [ ] Pas de `.not.toMatchObject()` - erreur exacte testée
- [ ] Pas de paramètres inutilisés dans les helpers
- [ ] Commentaires à jour avec le code

### Fichiers de référence

- **Helpers**: `src/tests/trpc-helpers.ts` - contient `createTestCaller`, `testUsers`, `forbiddenError`
- **UUID helper**: `src/tests/helpers.ts` - contient `uuid()`
- **Exemple réel**: `src/modules/jobs/server/trpc-routes.spec.ts`

---

## 🎯 Instructions for Auto-Fill

This template should be filled by analyzing:
- Test files (*.test.ts, *.spec.ts, *_test.go, test_*.py)
- Test configuration (jest.config.js, vitest.config.ts, pytest.ini)
- CI/CD test jobs
- Coverage reports and configuration
- Testing libraries in dependencies

## 🧪 Testing Stack

### Test Frameworks

<!-- Detect from devDependencies and test files:
- Jest, Vitest, Mocha, AVA, tape
- Pytest, unittest
- Go testing, testify
- RSpec, minitest
-->

<!-- Source: README.md -->

**Primary Framework**: Vitest
**Version**: Not specified in documentation

**Additional Tools**:
- **Assertions**: [Expect / Chai / Assert / etc. from imports]
- **Mocking**: [Jest mocks / Sinon / unittest.mock / etc.]
- **Test Runners**: [From package.json scripts]

### Testing Libraries

<!-- Extract from devDependencies:
- @testing-library/react, @testing-library/vue
- Supertest, Superagent (API testing)
- Playwright, Cypress, Selenium (E2E)
- MSW, nock (HTTP mocking)
-->

| Library | Purpose | Usage |
|---------|---------|-------|
| [lib1] | [Purpose] | [Where used - unit/integration/e2e] |
| [lib2] | [Purpose] | [Where used - unit/integration/e2e] |

## 📊 Test Coverage

### Current Coverage

<!-- Extract from:
- Coverage reports (coverage/lcov-report/)
- CI/CD coverage outputs
- Package.json coverage thresholds
-->

**Overall Coverage**: [X%] (if available)

**By Type**:
- **Statements**: [X%]
- **Branches**: [X%]
- **Functions**: [X%]
- **Lines**: [X%]

### Coverage Thresholds

<!-- Extract from test config (jest.config.js, vitest.config.ts, .coveragerc) -->

```javascript
// From test configuration
{
  statements: [X],
  branches: [X],
  functions: [X],
  lines: [X]
}
```

### Uncovered Areas

<!-- Analyze coverage reports:
- Identify modules with low coverage
- Critical paths without tests
-->

**Low Coverage Modules**:
- `[module1]`: [X%]
- `[module2]`: [X%]

## 🧩 Test Organization

### Test Structure

<!-- Analyze test file organization:
- Co-located (next to source files)
- Separate test directory
- By test type (unit/, integration/, e2e/)
-->

**Location**: [Co-located / Separate `tests/` directory]

**Directory Structure**:
```
[Actual test directory structure from project]
├── unit/
├── integration/
└── e2e/
```

### Naming Conventions

<!-- Detect from test files:
- *.test.ts vs *.spec.ts
- describe/it vs test()
- Naming patterns for test cases
-->

**Test Files**: [*.test.* / *.spec.* / test_*.py / etc.]

**Test Cases**:
```typescript
// Common pattern from test files
[Example of typical test naming]
```

## ✅ Unit Tests

### Unit Test Strategy

<!-- Analyze unit test files:
- What gets unit tested (utilities, services, functions)
- Mocking strategy
- Test isolation
-->

**Focus Areas**:
- [Area 1 from test file analysis]
- [Area 2 from test file analysis]

### Mocking Patterns

<!-- Extract from test files:
- How external dependencies are mocked
- Mock factories or builders
- Test doubles usage
-->

**Mocking Strategy**:
```typescript
// Common mocking pattern from tests
[Example from actual test files]
```

**Mocked Dependencies**:
- [Dependency 1]: [How mocked]
- [Dependency 2]: [How mocked]

### Unit Test Examples

<!-- Extract representative unit test from codebase:
- Show typical structure
- Show assertion style
-->

```typescript
// Example from [file path]
[Actual unit test example]
```

### Unit Test Coverage

<!-- Analyze unit test files:
- Count unit tests
- Calculate unit test coverage if separate from integration
-->

**Test Count**: [Number of unit tests]
**Key Modules Tested**:
- `[module1]`: [Test count]
- `[module2]`: [Test count]

## 🔗 Integration Tests

### Integration Test Strategy

<!-- Analyze integration test files:
- What integrations are tested (database, external APIs, services)
- Test database usage
- API endpoint testing
-->

**Focus Areas**:
- [Integration 1 from test analysis]
- [Integration 2 from test analysis]

### Database Testing

<!-- Detect from integration tests:
- Test database setup (docker, in-memory, fixtures)
- Database cleanup strategies
- Transaction rollback patterns
-->

**Test Database**: [Docker / In-memory / Separate schema]

**Setup/Teardown**:
```typescript
// Pattern from test files
[Example of DB setup/teardown]
```

### API Testing

<!-- Analyze API integration tests:
- Supertest or similar usage
- Endpoint coverage
- Authentication in tests
-->

**Tool**: [Supertest / request / etc. from imports]

**Coverage**: [X/Y endpoints tested]

**Example**:
```typescript
// From API test files
[Example API test]
```

### Integration Test Examples

<!-- Extract representative integration test -->

```typescript
// Example from [file path]
[Actual integration test example]
```

## 🌐 End-to-End Tests

### E2E Test Strategy

<!-- Detect E2E testing:
- Playwright, Cypress, Selenium presence
- E2E test files
- E2E scenarios covered
-->

**Framework**: [Playwright / Cypress / Selenium / None detected]

**Test Count**: [Number of E2E tests if available]

### E2E Test Scope

<!-- Analyze E2E test files:
- User journeys covered
- Critical paths tested
- Browser testing
-->

**Covered Scenarios**:
1. [Scenario 1 from E2E tests]
2. [Scenario 2 from E2E tests]
3. [Scenario 3 from E2E tests]

### E2E Configuration

<!-- Extract from E2E config files:
- Browsers tested
- Base URL
- Viewport settings
- Timeout configuration
-->

```javascript
// From E2E config
[Configuration from playwright.config.ts or cypress.json]
```

### E2E Examples

<!-- Extract example E2E test -->

```typescript
// Example from [file path]
[Actual E2E test example]
```

## 🎭 Test Fixtures and Factories

### Test Data Management

<!-- Detect from test files:
- Factory libraries (factory-bot, fishery, etc.)
- Fixture files
- Test data builders
-->

**Strategy**: [Factories / Fixtures / Builders]

**Tools**: [Library names from dependencies]

### Common Fixtures

<!-- Analyze fixture files or factory definitions:
- User fixtures
- Database seed data
- Mock API responses
-->

**Available Fixtures**:
- [Fixture 1]: [Purpose]
- [Fixture 2]: [Purpose]

### Factory Patterns

<!-- Extract factory examples from test code -->

```typescript
// Factory pattern from tests
[Example factory usage]
```

## 🚀 Performance Testing

<!-- Detect performance testing:
- Load testing tools (k6, artillery, jmeter)
- Performance test files
- Benchmark tests
-->

**Tools**: [k6 / artillery / etc. if detected]

**Performance Tests**: [Yes/No]

**Benchmarks**: [From benchmark files if present]

## 📸 Visual Regression Testing

<!-- Detect visual testing:
- Percy, Chromatic, BackstopJS
- Screenshot comparison tools
-->

**Tool**: [Percy / Chromatic / None detected]

**Coverage**: [Components with visual tests if available]

## 🔒 Security Testing

<!-- Detect security testing:
- Security linting tools
- Dependency scanning
- OWASP testing
-->

**Security Scans**:
- **Dependencies**: [npm audit / Snyk / etc. from CI]
- **Code**: [ESLint security rules / Bandit / etc.]
- **Secrets**: [GitLeaks / TruffleHog / etc.]

## 🤖 Test Automation

### Continuous Integration

<!-- Extract from CI config (.github/workflows/, .gitlab-ci.yml):
- Test jobs
- Test parallelization
- Test triggers
-->

**CI Platform**: [GitHub Actions / GitLab CI / CircleCI / etc.]

**Test Jobs**:
```yaml
# From CI configuration
[Test jobs from CI config]
```

### Pre-commit Hooks

<!-- Detect from:
- husky configuration
- pre-commit framework
- Git hooks
-->

**Pre-commit Tests**: [Yes/No]

**Hooks**:
- [Hook 1 from husky or pre-commit config]
- [Hook 2 from husky or pre-commit config]

<!-- Source: README.md and CLAUDE.md -->

### Test Scripts

```bash
# From package.json scripts
pnpm test                  # Run all tests
pnpm test:watch            # Watch mode
pnpm test src/utils/file.spec.ts  # Run single test
```

## 🐛 Debugging Tests

### Debug Configuration

<!-- Detect from:
- Debug configurations in IDE files
- Test debug scripts
- Debug flags in test config
-->

**Debug Scripts**:
```bash
# From package.json
[Debug test scripts]
```

**Debug Tips**:
<!-- Extract from CONTRIBUTING.md or test documentation -->
[Tips from project docs if available]

## 📏 Testing Standards

### Test Quality Guidelines

<!-- Extract from:
- CONTRIBUTING.md testing section
- Test examples
- Code review guidelines
-->

**Requirements**:
- [Requirement 1 from docs or detected patterns]
- [Requirement 2 from docs or detected patterns]

### Code Review Checklist

<!-- Extract from:
- CONTRIBUTING.md
- Pull request templates
- Test requirements
-->

- [ ] [Checklist item 1]
- [ ] [Checklist item 2]
- [ ] [Checklist item 3]

## 🎯 Testing Best Practices

### Detected Patterns

<!-- Analyze test code for best practices:
- AAA pattern (Arrange, Act, Assert)
- Test isolation
- Descriptive test names
- Single assertion per test
-->

**Common Patterns**:
1. [Pattern 1 from test analysis]
2. [Pattern 2 from test analysis]
3. [Pattern 3 from test analysis]

### Anti-patterns to Avoid

<!-- From CONTRIBUTING.md or detected issues:
- Tests that depend on each other
- Tests that access real external services
- Flaky tests
-->

- [Anti-pattern 1 from docs or code analysis]
- [Anti-pattern 2 from docs or code analysis]

## 📊 Test Metrics

### Test Execution Time

<!-- From CI logs or test output:
- Average test duration
- Slowest tests
-->

**Average Duration**: [From CI logs if available]

**Slowest Tests**:
1. [Test 1]: [Duration]
2. [Test 2]: [Duration]

### Test Stability

<!-- Analyze CI history:
- Flaky tests
- Test failure rate
-->

**Flaky Tests**: [List if identified in CI or issues]

**Success Rate**: [From CI history if available]

## 📚 Testing Resources

### Documentation

<!-- Links to testing documentation -->

- [Link to testing docs if exists]
- [Link to testing examples if exists]

### Running Tests Locally

```bash
# From README or package.json
[Commands to run tests locally]
```

---

**Last updated**: [Current date]
**Test Framework Version**: [From package.json]
**Related**: See [CONTRIBUTING.md](../../CONTRIBUTING.md) for contribution guidelines