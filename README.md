# Superhuman CLI

Agent-native CLI wrapper for the official Superhuman Mail MCP server.

The CLI uses the same OAuth flow as the MCP package, so authentication is handled
by `mcp-remote` and stored in `~/.mcp-auth`.

## Install

```bash
npm install -g superhuman-mcp-cli
```

For local development from this repository, run `npm install && npm link`.

## Auth

```bash
superhuman doctor
superhuman auth login
superhuman doctor
superhuman tools
```

`auth login` starts the official Superhuman OAuth flow when credentials are not
already cached.

## Common Commands

```bash
superhuman tools
superhuman doctor
superhuman describe query_email_and_calendar
superhuman query "emails from me this week"
superhuman call query_email_and_calendar --arg question="emails from me this week"
superhuman draft --arg type=new --arg to='["me@example.com"]' --arg subject='Hello' --arg body='Hi'
superhuman send --arg draft_id=draft_123 --confirm-send --allow-recipient me@example.com --safety-recipient me@example.com
```

## Output

Human-readable output is the default. Use `--json` for structured output and
`--plain` for stable line-oriented output.

Primary data is written to stdout. Diagnostics and errors are written to stderr.

## Safety

The generic `call` command can call every live MCP tool. Send-like tools
(`send_draft`, `send_email`) are blocked unless all of these are true:

- `--confirm-send` is present.
- At least one allowed recipient is configured with `--allow-recipient` or
  `SUPERHUMAN_ALLOWED_SEND_RECIPIENTS`.
- Every email address found in the tool arguments is allowlisted.
- For opaque draft sends where the MCP only accepts `draft_id`, pass
  `--safety-recipient` so the CLI can still enforce the allowlist.

The end-to-end self-check only sends to `SUPERHUMAN_E2E_SELF_EMAIL`.

## Environment

- `SUPERHUMAN_MCP_COMMAND`: command used to start the MCP transport, default `npx`.
- `SUPERHUMAN_MCP_ARGS`: argument string for the MCP command, default `-y @superhuman/mcp-mail`.
- `SUPERHUMAN_ALLOWED_SEND_RECIPIENTS`: comma-separated send allowlist.
- `NO_COLOR`, `TERM=dumb`: respected by Commander and terminal output.

## Development

```bash
npm run typecheck
npm test
npm run build
npm pack --dry-run
```

End-to-end self-send test:

```bash
npm run test:e2e
```
