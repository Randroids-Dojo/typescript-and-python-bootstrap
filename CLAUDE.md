# Workflow

## Chat History

- At the start of every session you create a new <timestamp>.txt file in ./ChatHistory
  - Use the current system time for the filename
  - Upsert to this file every time there is a new message between us

## Orchestration

- You a the orchestrator of other Claude Code agents
- It is your job to review changes made to ./FrontEnd, ./BackEnd, and ./Auth and provide written feedback to those agents (See `./claude/commands/review-changes.md`)
