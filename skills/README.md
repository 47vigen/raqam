# Agent skills (raqam)

This directory holds **agent skills** for developers using the `[raqam](https://www.npmjs.com/package/raqam)` npm package. They are **not** required to work inside the raqam library repo itself.

## Published skill


| Skill | Folder           | Description                                                  |
| ----- | ---------------- | ------------------------------------------------------------ |
| raqam | [raqam/](raqam/) | Full-stack guidance for the raqam React number-input library |


## Install with the skills CLI

From a **project** that should load the skill (after this repo is on GitHub):

```bash
# Install only the raqam skill from this repository
npx skills add https://github.com/47vigen/raqam/tree/main/skills/raqam
```

Or clone locally:

```bash
npx skills add /path/to/raqam/skills/raqam
```

List what will be installed:

```bash
npx skills add https://github.com/47vigen/raqam --list
```

(Use the repo root if you add multiple skills later; the CLI discovers `skills/*/SKILL.md`.)

## skills.sh

The public directory at [skills.sh](https://skills.sh/) reflects **anonymous install telemetry** from the `skills` CLI, not a separate manual upload. Publishing is: **push the skill to a public Git URL** and share/install it with `npx skills add …` as above. See [vercel-labs/skills](https://github.com/vercel-labs/skills) for the CLI and [Agent Skills](https://agentskills.io) for the spec.

## Layout

Each skill is a directory containing at minimum `SKILL.md` (YAML frontmatter + instructions). Optional files here follow the usual pattern: `reference.md`, `examples.md`, `scripts/`.