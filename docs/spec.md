# Superhuman CLI Spec

## Name

`superhuman`

## One-liner

Fast, scriptable CLI wrapper around the official Superhuman Mail MCP server.

## Usage

```bash
superhuman [global flags] <subcommand> [args]
```

## Subcommands

- `superhuman auth login`: start OAuth if needed and verify MCP access.
- `superhuman auth status [--check]`: show local OAuth state; `--check` verifies by connecting.
- `superhuman auth logout --force`: remove local MCP OAuth token files.
- `superhuman doctor`: verify Node, package install, OAuth state, and live MCP connectivity.
- `superhuman tools [-o docs/superhuman-mcp-tools.md]`: list live MCP tools and parameter schemas.
- `superhuman describe <tool>`: show one tool schema.
- `superhuman call <tool>`: call any MCP tool with JSON or `key=value` args.
- `superhuman query [question...]`: alias for `query_email_and_calendar`.
- `superhuman draft`: alias for `create_or_update_draft`.
- `superhuman send`: alias for `send_draft` with recipient safety checks.
- `superhuman event`: alias for `create_or_update_event`.
- `superhuman availability`: alias for `get_availability`.
- `superhuman e2e self-check --to "$SUPERHUMAN_E2E_SELF_EMAIL" --confirm-self-send`: self-send smoke test.

## Global Flags

| Flag | Default | Meaning |
| --- | --- | --- |
| `-h, --help` | false | Show help. |
| `--version` | false | Print version. |
| `--json` | false | Write structured JSON. |
| `--plain` | false | Write stable line-based output. |
| `-q, --quiet` | false | Suppress non-essential diagnostics. |
| `-v, --verbose` | false | More diagnostics. |
| `--no-color` | false | Disable color. |
| `--timeout <duration>` | `120s` | MCP request timeout. |

## Call Flags

| Flag | Default | Meaning |
| --- | --- | --- |
| `--args-json <json\|@file\|->` | `{}` | Tool arguments from inline JSON, file, or stdin. |
| `--arg <key=value>` | repeatable | Tool argument override; dot paths supported. |
| `-n, --dry-run` | false | Print the resolved call without executing it. |
| `--confirm-send` | false | Required for send-like tools. |
| `--allow-recipient <email>` | repeatable | Send allowlist. Comma-separated values accepted. |
| `--safety-recipient <email>` | repeatable | Expected recipient for opaque draft sends. Comma-separated values accepted. |
| `--no-input` | false | Disable prompts. |

## I/O Contract

stdout:

- Primary command output.
- JSON when `--json` is set.
- Stable names/values when `--plain` is set.

stderr:

- OAuth/browser status from the MCP transport.
- Diagnostics, errors, and write-file notices.

## Exit Codes

- `0`: success.
- `1`: runtime failure.
- `2`: invalid usage or validation failure.
- `3`: safety policy blocked the operation.

## Auth

Auth is delegated to the official Superhuman MCP package:

```json
{
  "command": "npx",
  "args": ["-y", "@superhuman/mcp-mail"]
}
```

That package runs `mcp-remote` against `https://mcp.mail.superhuman.com/mcp`,
which performs OAuth and stores tokens in `~/.mcp-auth`.

## Config and Precedence

The CLI has no project config file. Precedence is:

1. Flags.
2. Environment variables.
3. Built-in defaults.

Environment variables:

- `SUPERHUMAN_MCP_COMMAND`
- `SUPERHUMAN_MCP_ARGS`
- `SUPERHUMAN_ALLOWED_SEND_RECIPIENTS`

## Safety

- Send-like tools require `--confirm-send`.
- Send-like tools require an allowlist.
- Every email found in the arguments must be allowlisted.
- `send_draft` requires `--safety-recipient` because the live MCP sends by `draft_id`.
- `e2e self-check` refuses every recipient except `SUPERHUMAN_E2E_SELF_EMAIL`.
- `--dry-run` is available on all call paths.

## Examples

```bash
superhuman auth login
superhuman doctor
superhuman tools --json
superhuman tools -o docs/superhuman-mcp-tools.md
superhuman describe create_or_update_draft
superhuman query "emails from me@example.com today"
superhuman call query_email_and_calendar --arg question="my meetings tomorrow"
echo '{"question":"unread email from today"}' | superhuman call query_email_and_calendar --args-json -
superhuman draft --args-json @draft.json --dry-run
superhuman send --arg draft_id=draft_123 --confirm-send --allow-recipient me@example.com --safety-recipient me@example.com
SUPERHUMAN_E2E_SELF_EMAIL=me@example.com superhuman e2e self-check --to me@example.com --confirm-self-send
```
