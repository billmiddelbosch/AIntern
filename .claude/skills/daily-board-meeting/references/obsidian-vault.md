# Obsidian Vault — Location and Structure

## Vault Root

```
C:/Users/bmidd/OneDrive/Documents/Obsidian Vault/Bill/
```

## Thought Journal

Thought journal entries live under:
```
C:/Users/bmidd/OneDrive/Documents/Obsidian Vault/Bill/Thoughts/
```

Subdirectories are organized by theme, for example:
- `Technologie & Toekomst/`
- `Business & Strategie/`
- (other theme folders may exist — list the directory to discover them)

Each entry is a dated markdown file:
```
2026-04-05 AI maakt procesautomatisering bereikbaar voor iedere organisatie.md
```

## How to Extract Topic Seeds (Phase 4)

1. List files in all `Thoughts/` subdirectories, sorted by modification date (most recent first):
   ```bash
   ls -t "C:/Users/bmidd/OneDrive/Documents/Obsidian Vault/Bill/Thoughts/**/*.md" | head -10
   ```
   On Windows with bash: use `find` or glob patterns as appropriate.

2. Read the 3 most recent files — extract:
   - Core idea or thesis (1 sentence)
   - Any specific statistics, examples, or pain points mentioned
   - Whether it maps to AIntern's target audience (Lightspeed webshop, MKB, AI automation)

3. Score each entry for audience relevance:
   - **High**: directly about AI, automation, MKB, e-commerce, Lightspeed
   - **Medium**: adjacent topic (productivity, digital transformation, SMB operations)
   - **Low**: too abstract or unrelated to the target client's daily reality

4. Use the top 1–2 high/medium-relevance entries as Kennisbank topic seeds.

## Meeting Minutes Folder

Save meeting summaries to:
```
C:/Users/bmidd/OneDrive/Documents/Obsidian Vault/Bill/Aintern Meeting Minutes/
```

Create the folder if it does not exist. File naming convention:
```
YYYY-MM-DD AIntern Board Meeting.md
```

Example: `2026-04-11 AIntern Board Meeting.md`
