---
name: assign-to-ali
description: "Assign a task to Ali, the ITGuru intern. Creates a feature branch in the ITGuru repo and writes the task to Ali's inbox. Ali picks it up at the start of her next session."
---

Assign a task to Ali in the ITGuru task inbox and create a feature branch for it.

$ARGUMENTS

## How to use

```
/assign-to-ali <title> | <priority> | <description> | <acceptance criteria>
```

Example:
```
/assign-to-ali Add hero section animation | High | Animate the hero title on page load using CSS transitions | Title fades in within 300ms; no layout shift; build passes
```

## What this command does

1. Reads `C:/Users/bmidd/development/ITGuru/.claude/ali/task-inbox.md`
2. Determines the next task ID (TASK-NNN) by counting existing `### TASK-` entries
3. Derives a branch name: `feature/task-NNN-<kebab-case-title>` (lowercase, spaces → hyphens, max 50 chars total)
4. Creates the feature branch in the ITGuru repo:
   ```bash
   git -C "C:/Users/bmidd/development/ITGuru" checkout main
   git -C "C:/Users/bmidd/development/ITGuru" pull
   git -C "C:/Users/bmidd/development/ITGuru" checkout -b feature/task-NNN-<slug>
   ```
5. Appends the task to the inbox in this format:

```markdown
### TASK-NNN — <title>
- **Assigned by:** <current board member>
- **Priority:** <priority>
- **Status:** TODO
- **Branch:** feature/task-NNN-<slug>
- **Description:** <description>
- **Acceptance criteria:** <acceptance criteria>
- **Assigned on:** <today's date>
```

6. Confirms to the board:
   > Task TASK-NNN assigned to Ali: `<title>`
   > Branch created: `feature/task-NNN-<slug>`
   > Ali will pick it up in her next ITGuru session.

If $ARGUMENTS is empty, prompt the board for: title, priority (High/Medium/Low), description, and acceptance criteria before proceeding.

## Branch naming rules
- Format: `feature/task-NNN-<slug>` where slug is the title in lowercase with spaces replaced by hyphens
- Strip special characters; keep only alphanumerics and hyphens
- Truncate slug so the full branch name stays under 50 characters
- Example: "Add hero section animation" → `feature/task-001-add-hero-section-animation`
