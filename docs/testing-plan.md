# Testing Plan

## Unit Tests

- Argument parsing:
  - scalar coercion for booleans, numbers, null, arrays, and objects.
  - `--arg key=value` validation.
  - dotted key assignment.
  - timeout parsing.
- Output rendering:
  - human, JSON, and plain tool lists.
  - MCP result text extraction.
- Safety:
  - send tools blocked without `--confirm-send`.
  - send tools blocked without an allowlist.
  - non-allowlisted recipients blocked.
  - recursive email extraction.
- Tool inventory docs:
  - markdown table generation from live schemas.
- Auth status:
  - detects missing token directory.
  - detects existing `*_tokens.json` files.

## Integration Tests

- `superhuman --help` exits `0`.
- `superhuman call <tool> --dry-run` prints resolved arguments and does not connect.
- `superhuman send --dry-run` still enforces send safety.
- `superhuman auth status` does not trigger OAuth.
- `superhuman doctor` validates local install, OAuth, and live MCP tool listing.
- `superhuman tools --json` connects to the MCP and returns tool schemas when OAuth exists.

## End-to-End Tests

Preconditions:

- `SUPERHUMAN_E2E_SELF_EMAIL` is set to the authenticated user's self-test address.
- OAuth completed with `superhuman auth login`.
- No external recipients are used.

Steps:

1. Run `superhuman tools -o docs/superhuman-mcp-tools.md` and verify the generated command inventory.
2. Run a read-only query:
   `superhuman query "recent emails from $SUPERHUMAN_E2E_SELF_EMAIL" --json`.
3. Dry-run a self-send draft:
   `superhuman draft --args-json @fixtures/self-draft.json --dry-run`.
4. Create a real draft addressed only to `SUPERHUMAN_E2E_SELF_EMAIL`. If testing a sender alias, first verify it is accepted by Superhuman as a send-as address.
5. Triple-check the resolved send arguments contain only `SUPERHUMAN_E2E_SELF_EMAIL`.
6. Send with:
   `superhuman send --args-json @fixtures/self-send.json --confirm-send --allow-recipient "$SUPERHUMAN_E2E_SELF_EMAIL"`.
7. Query for the subject to verify delivery.
8. If any step fails, fix the CLI and repeat from step 1.

Hard safety rule:

No test may send email to any address other than `SUPERHUMAN_E2E_SELF_EMAIL`.
