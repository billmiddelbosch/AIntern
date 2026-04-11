cd C:\Users\bmidd\AIntern
$prompt = @"
You are working on branch feature/board-2026-04-11. First run: git status. If not on that branch, run: git checkout feature/board-2026-04-11.

Your task: Execute L-14 Marketing Alignment - stap 1 and 2 only.

Read product/sections/marketing-alignment/spec.md first for full context. Then execute:

Stap 1: Remove the incorrect social proof claim from HeroSection.vue
- Remove the "20+ MKB-bedrijven draaien al hun eigen AI-stagiaire" text
- Remove the avatar stack of placeholder avatars

Stap 2: Restore accurate pilot-case figures per the spec (read the spec for the correct values).

After implementing both steps:
1. Run: npm run type-check
2. Commit to branch feature/board-2026-04-11 with message: feat: L-14 stap 1-2 - fix social proof claim and pilot-case figures

Then output a Terminal Summary with: branch, files changed, commit message, and status (Done/Failed).
"@
claude $prompt
