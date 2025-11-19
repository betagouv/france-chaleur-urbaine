# Critical Thinking & Self-Review Guidelines

## Problem: Premature Implementation Without Critical Analysis

**Issue**: Proposing solutions too quickly without deep critical analysis, leading to iterations and partial reversals.

## Rules for Proposals

### Before Proposing Any Solution

1. **Self-Critical Review**
   - Question every element: Is this necessary? Does it add value?
   - Compare with previously identified problems: Does this reintroduce issues we criticized?
   - Check for redundancy: Are there overlapping or duplicate concepts?
   - Verify consistency: Does this align with stated goals and constraints?

2. **Anticipate User Feedback**
   - What would a critical reviewer say about this?
   - What are the potential weaknesses or ambiguities?
   - What questions might the user ask?
   - Does this solve the problem or just move it?

3. **Compare with Previous Criticisms**
   - If we criticized approach X, does this proposal use approach X in disguise?
   - If we identified problem Y, does this proposal avoid or recreate problem Y?
   - Example: If we criticized keyword matching, don't add keyword-like fields

4. **Validate Against Requirements**
   - Does this meet ALL stated requirements?
   - Does this respect stated constraints (simplicity, minimalism)?
   - Is this the simplest solution that works?

### When User Provides Feedback

1. **Understand the Root Concern**
   - Don't just fix the symptom, understand the underlying issue
   - Why did they point this out? What's the real problem?
   - Is this part of a pattern they've mentioned before?

2. **Re-evaluate the Entire Approach**
   - Don't just patch the specific issue
   - Question if the whole approach needs reconsideration
   - Check if similar issues exist elsewhere in the proposal

3. **Apply Lessons Learned**
   - If user corrected something, check if the same mistake exists elsewhere
   - If user rejected an approach, don't use similar approaches

### Red Flags to Watch For

- **Redundancy**: Multiple ways to express the same information
- **Over-engineering**: Adding complexity without clear benefit
- **Reintroducing criticized patterns**: Using approaches we previously rejected
- **Inconsistency**: Proposing something that contradicts stated goals
- **Assumptions**: Adding things "just in case" without clear need

## Example: The "Contains" Field Issue

**What happened**:
1. Proposed solution with "Contains" field
2. User said too verbose → simplified but kept "Contains"
3. User said "Contains" is redundant and like old keyword system
4. Finally removed "Contains"

**What should have happened**:
1. Before proposing: "Does 'Contains' add value? It's redundant with 'When' and similar to keyword matching we criticized."
2. When user said "too verbose": "Is 'Contains' part of the verbosity? It's redundant with 'When'."
3. Should have removed it immediately, not waited for explicit feedback

**Lesson**: Critically evaluate every element before proposing, especially if it resembles previously criticized approaches.

## Questions to Ask Before Every Proposal

1. Is every element necessary? (Remove if not)
2. Does this reintroduce problems we've already identified?
3. Is there redundancy with other elements?
4. Is this the simplest solution?
5. Would a critical reviewer find flaws?
6. Does this align with stated goals (simplicity, minimalism, clarity)?

## Priority

**Critical thinking > Speed**. Better to take time to propose the right solution than to iterate multiple times.

