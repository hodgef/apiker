---
name: apiker-self-improve
description: Self-improvement loop for the Apiker repository. Load at the START of non-trivial Apiker work to pull in accumulated lessons, and at the END (or whenever you hit a surprising gotcha, wrong assumption, build/test quirk, or discover a convention) to record durable knowledge into repository memory and improve the apiker skill/docs. Use whenever the user says "remember this", after a mistake that seems repeatable, or when finishing a task that taught you something about this codebase.
---

# Apiker self-improvement loop

A lightweight loop that makes each Apiker session smarter than the last. It has two phases:
**recall** (start of work) and **capture** (end of work or on surprise).

## Phase 1 — Recall (do this before starting non-trivial work)

1. Read `.agents/AGENTS.md` and load the `apiker` skill (`.agents/skills/apiker/SKILL.md`).
2. Check repository memory for accumulated lessons:
   - View `/memories/repo/apiker-lessons.md` (create it later if missing).
3. Apply what's there. If a lesson contradicts what you were about to do, trust the recorded
   lesson (it came from a real outcome) but verify quickly against the current code.

## Phase 2 — Capture (do this at the end, or the moment you're surprised)

Record a lesson when **any** of these happen:

- An assumption about the architecture, routing, state, or build turned out wrong.
- You hit a non-obvious gotcha (singleton reset, async state, Workers-vs-Node, no new deps).
- You found a convention worth reusing (folder shape, barrel exports, test placement).
- A build/test/docs command behaved unexpectedly.
- The user corrected you or said "remember this".

### Where to write

| Kind of knowledge | Destination |
|-------------------|-------------|
| Durable, repo-specific fact/convention/gotcha | `/memories/repo/apiker-lessons.md` (memory tool) |
| A recurring pattern many tasks need | Fold into `.agents/skills/apiker/references/*.md` |
| A missing/incorrect rule in the skill itself | Edit `.agents/skills/apiker/SKILL.md` |
| A generic personal preference across all repos | `/memories/*` (user memory) |

Prefer **repository memory** for anything Apiker-specific — it persists and is scoped to this
workspace. Promote a lesson into the skill/reference docs once it has proven useful more than
once.

### How to write a good lesson

Keep entries short, concrete, and dated. Use this format in
`/memories/repo/apiker-lessons.md`:

```md
## <short title>
- Date: YYYY-MM-DD
- Context: what task/area triggered this
- Lesson: the durable fact or rule (one or two lines)
- Evidence: file/command that proves it (e.g. src/components/Request/Request.ts)
```

Rules for quality:

- One lesson = one idea. Split unrelated findings.
- State the **rule**, not the story. "Reset per-request state in `handleEntryRequest` because
  `apiker` is a singleton reused across requests" — not "I spent a while debugging…".
- Cite a file or command as evidence so future sessions can verify.
- **Update or delete** a lesson if you later find it wrong or outdated — don't accumulate
  contradictions.
- Don't record secrets, tokens, or environment-specific paths.

## Promotion checklist (memory → skill docs)

When a lesson has helped in 2+ sessions, promote it:

1. Decide the right home (`SKILL.md` rule vs a `references/*.md` recipe).
2. Add it there in the existing style.
3. Trim the now-redundant memory entry to a one-line pointer, or delete it.

## Guardrails

- Editing files under `.agents/` and writing memory are safe, reversible actions — do them
  freely when you learn something.
- Do **not** invent lessons. Only record things you actually observed or verified this session.
- Keep `apiker-lessons.md` tidy: prune duplicates and stale entries as you go.
