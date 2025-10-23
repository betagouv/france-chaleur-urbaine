---
name: output-style:new
description: Create a new output style with structured guidance and best practices
---

# Create Output Style: $ARGUMENTS

I'll help you create a professional output style for the role: **$ARGUMENTS**

## What This Command Does

This command creates a new output style by:
1. Analyzing the role and its characteristics
2. Defining core expertise and domains
3. Establishing communication style and response structure
4. Creating a comprehensive prompt that embodies the role
5. Saving it to `.ai/avatars` if it exists or `~/.claude/output-styles/`

## Role Definition Framework

To create an effective output style, I'll structure it around these key sections:

### 1. Role Overview
- Who is this person? (e.g., "Senior UX Designer with 10+ years experience")
- What's their primary expertise?
- What problems do they solve?

### 2. Core Expertise & Domains
- Key areas of knowledge (3-5 main domains)
- Specialized skills and methodologies
- Industry standards and frameworks they use
- Tools and technologies they master

### 3. Communication Style
- Tone: Formal/Informal? Technical/Accessible?
- Approach: Analytical/Creative? Structured/Flexible?
- Key characteristics: Empathetic? Risk-aware? User-focused?
- Language style: Precise terminology? Visual descriptions?

### 4. Response Structure
- How should responses be organized?
- What sections should appear consistently?
- What format works best? (numbered lists, headings, bullet points)
- Example: "For X requests: 1. Context, 2. Analysis, 3. Recommendations..."

### 5. Key Behaviors & Principles
- What should they always do? (e.g., "Ask clarifying questions first")
- What should they never do? (e.g., "Never recommend aggressive schemes")
- What do they prioritize? (e.g., "User value over technical elegance")
- How do they make decisions?

### 6. Frameworks & Methodologies
- Industry-standard frameworks (e.g., RICE, Design Thinking, Agile)
- Mental models they use
- Decision-making processes
- Analysis approaches

### 7. Output Format
- Preferred structure for deliverables
- Use of examples, templates, or patterns
- Visual descriptions or code snippets
- Success metrics or validation criteria

## Examples from Existing Output Styles

**Product Owner Style**:
- User-centric thinking connecting to business outcomes
- Structured user story format with acceptance criteria
- RICE/MoSCoW prioritization frameworks
- Clear separation of MVP vs V2 vs Backlog

**UX Designer Style**:
- Design Thinking methodology (Empathize → Define → Ideate → Prototype → Test)
- Accessibility-first (WCAG standards)
- Mobile-first and responsive design principles
- Usability heuristics and established design patterns

**Avocat Fiscaliste Style**:
- Risk-aware and compliance-focused
- Comparative analysis across jurisdictions
- Structured by use case (expatriation vs company creation)
- Always includes disclaimer and references to legal frameworks

## Best Practices

✅ **Do**:
- Define clear expertise boundaries
- Provide structured response templates
- Include concrete examples and patterns
- Specify decision-making frameworks
- Use role-appropriate terminology
- Consider edge cases and limitations

❌ **Don't**:
- Make it too generic or vague
- Forget about communication style nuances
- Omit response structure guidance
- Ignore frameworks and methodologies the role uses
- Forget disclaimers if needed (legal, medical, etc.)

---

Now I'll create the output style using the Task tool with the output-style-setup subagent.

## Creating: **$ARGUMENTS**

I'll structure this role with:
- Comprehensive expertise definition
- Clear communication guidelines
- Practical response templates
- Relevant frameworks and methodologies
- Examples and best practices
