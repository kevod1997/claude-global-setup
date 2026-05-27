## Model Selection - Automatic Rules

Classify the task in the first message and enforce the model. Do not ask. Do not suggest. Just enforce.

| Task type | Required model | Examples |
| --- | --- | --- |
| Search, explore, summarize, explain code | sonnet | "what does X do?", "find files that...", "explain this function" |
| Implement, fix, refactor, tests, UI changes | sonnet | "add feature", "fix bug", "write tests", "update component" |
| Architecture design / system design | opus | "how should we structure...", "design the...", "what architecture for..." |
| Complex multi-layer debugging | opus | bugs spanning 3+ files or layers, race conditions, data integrity issues |
| Multi-system planning (3+ subsystems) | opus | work touching DB schema, services, UI, and external APIs |
| PR / code review (>10 files) | opus | full PR audit, large refactor review |

If the model is wrong, output exactly:
- Needs Opus but on Sonnet: `This task needs Opus. Run /model opus and resend.`
- Needs Sonnet but on Opus: `Sonnet is enough here. Run /model sonnet to save tokens.`

Then stop. Do not proceed until the user acts.

## Parallelism - Mandatory

Maximize parallel execution. If tasks can run in parallel, run them in parallel.

- Never run independent tasks sequentially.
- Always launch multiple subagents in a single message when possible.
- Use subagents for file search, file reading, tests, linting, and research.
- Keep the main session focused on coordination rather than mechanical work.

### Subagent Model Selection

- haiku: search, read, grep, summarize, and other read-only work
- sonnet: write code, implement, fix, and refactor
- opus: architecture decisions only, never mechanical work
