# Git Workflow

> Git conventions and workflow for {{PROJECT_NAME}}

## 🎯 Instructions for Auto-Fill

This template should be filled by analyzing:
- CONTRIBUTING.md (primary source for workflow)
- .github/ folder (PR templates, issue templates, workflows)
- Git history (commit message patterns, branch naming)
- Recent commits and PRs
- Branch protection rules (if accessible via API)

## 🌿 Branching Strategy

<!-- Extract from CONTRIBUTING.md or analyze git branches:
- Main branch name (main/master)
- Development branch if exists
- Feature branch pattern
- Release branch pattern
-->

**Primary Branch**: [main / master from git config]

**Branch Types**:
- **Feature**: [Pattern from branch names, e.g., `feature/*`, `feat/*`]
- **Bugfix**: [Pattern from branch names, e.g., `fix/*`, `bugfix/*`]
- **Hotfix**: [Pattern from branch names, e.g., `hotfix/*`]
- **Release**: [Pattern from branch names, e.g., `release/*`]

### Branch Naming Convention

<!-- Analyze existing branch names for patterns -->

```bash
# Detected patterns from existing branches
[pattern-1]/[description]  # e.g., feat/add-user-auth
[pattern-2]/[description]  # e.g., fix/login-bug
[pattern-3]/[description]  # e.g., docs/update-readme
```

**Examples from Project**:
- [Example branch 1 from git history]
- [Example branch 2 from git history]
- [Example branch 3 from git history]

## 📝 Commit Message Convention

<!-- Analyze recent commit messages for patterns:
- Conventional Commits (feat:, fix:, docs:, etc.)
- Custom format
- Emoji usage
- Ticket/issue references
-->

**Format**: [Conventional Commits / Custom / Unstructured]

**Pattern Detected**:
```
[type]([scope]): [description]

[optional body]

[optional footer]
```

### Commit Types

<!-- Extract from commitlint config or analyze commit history for types -->

| Type | Usage | Example from Project |
|------|-------|----------------------|
| [type1] | [Purpose] | [Actual commit from history] |
| [type2] | [Purpose] | [Actual commit from history] |
| [type3] | [Purpose] | [Actual commit from history] |

### Commit Message Examples

<!-- Extract good commit messages from recent history -->

**Good Examples from Project**:
```
[Example 1 from git log]

[Example 2 from git log]

[Example 3 from git log]
```

### Commit Linting

<!-- Detect commitlint or commit message validation:
- commitlint.config.js
- husky commit-msg hook
- CI commit message checks
-->

**Linting**: [Yes/No]
**Tool**: [commitlint / custom / none detected]
**Configuration**: [From commitlint.config.js if exists]

## 🔀 Pull Request Workflow

### PR Creation

<!-- Extract from:
- CONTRIBUTING.md
- Pull request template
- Recent PRs
-->

**Required Information**:
<!-- From PR template if exists -->
- [Requirement 1 from template]
- [Requirement 2 from template]
- [Requirement 3 from template]

### PR Template

<!-- Extract from .github/pull_request_template.md -->

```markdown
[Actual PR template content if exists]
```

### PR Naming

<!-- Analyze recent PR titles for pattern -->

**Pattern**: [Pattern detected from recent PRs]

**Examples**:
- [Recent PR title 1]
- [Recent PR title 2]

## ✅ Code Review Process

### Review Requirements

<!-- Extract from:
- CONTRIBUTING.md
- Branch protection rules
- CI checks
-->

**Minimum Approvals**: [Number from branch protection or docs]

**Required Checks**:
<!-- From CI configuration and branch protection -->
- [Check 1 from CI]
- [Check 2 from CI]
- [Check 3 from CI]

### Review Guidelines

<!-- Extract from CONTRIBUTING.md or review documentation -->

**Reviewers Should Check**:
- [Guideline 1 from docs]
- [Guideline 2 from docs]
- [Guideline 3 from docs]

### Review Checklist

<!-- From CONTRIBUTING.md or PR template -->

- [ ] [Checklist item 1]
- [ ] [Checklist item 2]
- [ ] [Checklist item 3]

## 🚀 Merge Strategy

<!-- Detect from:
- GitHub repository settings (if accessible)
- Git history merge patterns
- CONTRIBUTING.md
-->

**Merge Method**: [Merge commit / Squash / Rebase from recent merges]

**Merge Requirements**:
- [Requirement 1 from docs or protection rules]
- [Requirement 2 from docs or protection rules]

### After Merge

<!-- From CONTRIBUTING.md or detected patterns -->

**Actions**:
- [Action 1, e.g., "Delete branch"]
- [Action 2, e.g., "Update changelog"]

## 🏷️ Tagging and Releases

### Version Tagging

<!-- Analyze tags in repository:
- Tag naming pattern (v1.0.0, 1.0.0, etc.)
- Semantic versioning
- Tag frequency
-->

**Tag Pattern**: [v*.*.* / *.*.* from git tags]

**Recent Tags**:
- [Tag 1 with date]
- [Tag 2 with date]
- [Tag 3 with date]

### Release Process

<!-- Extract from:
- RELEASING.md
- CONTRIBUTING.md
- GitHub Actions release workflow
- Release notes in GitHub
-->

**Release Workflow**:
1. [Step 1 from release process documentation]
2. [Step 2 from release process documentation]
3. [Step 3 from release process documentation]

**Automated**: [Yes/No from GitHub Actions analysis]

### Changelog

<!-- Detect changelog management:
- CHANGELOG.md existence
- Automated changelog generation
- Keep a Changelog format
-->

**Changelog File**: [CHANGELOG.md / HISTORY.md / None]

**Format**: [Keep a Changelog / Custom / None]

**Generation**: [Manual / Automated via [tool] / None]

## 🔧 Git Hooks

### Pre-commit Hooks

<!-- Detect from:
- husky configuration
- .git/hooks/
- pre-commit framework
-->

**Tool**: [husky / pre-commit / None detected]

**Hooks Configured**:
<!-- From husky config or .pre-commit-config.yaml -->
- [Hook 1]: [Purpose]
- [Hook 2]: [Purpose]
- [Hook 3]: [Purpose]

### Pre-push Hooks

<!-- From husky or git hooks configuration -->

**Hooks**:
- [Hook 1 from config]
- [Hook 2 from config]

## 📋 Issue Management

### Issue Templates

<!-- From .github/ISSUE_TEMPLATE/ -->

**Available Templates**:
- [Template 1 name and purpose]
- [Template 2 name and purpose]
- [Template 3 name and purpose]

### Issue Labels

<!-- Analyze labels used in repository issues:
- bug, feature, documentation
- priority labels
- status labels
-->

**Common Labels**:
- `[label1]`: [Usage from issue analysis]
- `[label2]`: [Usage from issue analysis]
- `[label3]`: [Usage from issue analysis]

### Issue Linking

<!-- From PR analysis:
- Fixes #123 pattern
- Closes #123 pattern
- Issue number in commit messages
-->

**Linking Pattern**: [Pattern detected from PRs/commits]

**Example**: [Actual example from recent PRs]

## 🔄 Continuous Integration

### CI Triggers

<!-- From .github/workflows/ or CI config:
- On push
- On PR
- On tag
- Scheduled
-->

**Triggers**:
- [Trigger 1 from CI config]
- [Trigger 2 from CI config]

### CI Jobs

<!-- List main CI jobs from workflow files -->

**Jobs**:
1. **[Job 1]**: [Purpose from workflow]
2. **[Job 2]**: [Purpose from workflow]
3. **[Job 3]**: [Purpose from workflow]

### Status Checks

<!-- Required status checks from branch protection or CI config -->

**Required for Merge**:
- [Check 1]
- [Check 2]
- [Check 3]

## 🛡️ Branch Protection

<!-- Extract from branch protection rules if accessible:
- Require PR reviews
- Require status checks
- Require linear history
- etc.
-->

**Protected Branches**: [Branch names with protection]

**Rules**:
- [Rule 1 from protection settings or docs]
- [Rule 2 from protection settings or docs]
- [Rule 3 from protection settings or docs]

## 🔐 Security

### Secrets Management

<!-- From CONTRIBUTING.md or security docs:
- How secrets are handled
- .env files
- CI secrets
-->

**Guidelines**:
- [Guideline 1 from docs]
- [Guideline 2 from docs]

### Sensitive Data

<!-- From .gitignore and docs -->

**Never Commit**:
- [File type 1 from .gitignore]
- [File type 2 from .gitignore]
- [File type 3 from .gitignore]

## 🚦 Common Git Commands

<!-- Extract from CONTRIBUTING.md or create from detected workflow -->

### Creating a Feature Branch

```bash
# Pattern from branch naming convention
[Commands for creating and working with feature branch]
```

### Making Changes

```bash
# Pattern from commit convention
[Commands for staging and committing]
```

### Updating Your Branch

```bash
# From workflow documentation or common practices
[Commands for staying up to date with main]
```

### Creating a Pull Request

```bash
# From workflow documentation
[Commands for pushing and creating PR]
```

## 📚 Resources

<!-- Links from CONTRIBUTING.md or README -->

- [Link to contributing guide if exists]
- [Link to code of conduct if exists]
- [Link to style guide if exists]

## 🆘 Getting Help

<!-- From CONTRIBUTING.md or README:
- Where to ask questions
- Communication channels
-->

**Channels**:
- [Channel 1 from docs]
- [Channel 2 from docs]

---

**Last updated**: [Current date]
**Workflow Version**: [From CONTRIBUTING.md version if exists]
**Related**: See [CONTRIBUTING.md](../../CONTRIBUTING.md) for full guidelines
