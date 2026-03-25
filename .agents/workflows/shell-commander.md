---
description: How to use desktop-commander MCP for shell commands
---

This workflow defines how to integrate the `desktop-commander` MCP server when executing shell commands to ensure better system context and safer execution.

1. **Information Gathering**: Before running a complex command, use `desktop-commander` tools to understand the current system state (e.g., active windows, system processes).
2. **Command Selection**: Choose the appropriate shell command based on the gathered context.
// turbo
3. **Execution**: Execute the command using the standard `run_command` tool.
4. **Verification**: Confirm the command's success using both `run_command` output and `desktop-commander` system observation tools if necessary.
