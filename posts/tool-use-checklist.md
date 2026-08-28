# A Practical Tool-Use Checklist

Before shipping an agent tool, verify the following.

## Contract

- Inputs and outputs are typed and documented.
- Required and optional fields are unambiguous.
- Errors are distinguishable from empty success.

## Safety

- Permissions follow least privilege.
- Sensitive values never appear in prompts or logs.
- Destructive or external actions have explicit boundaries.

## Execution

- Retries are safe or idempotency keys are supported.
- Timeouts and rate limits are handled.
- Partial completion is detectable.

## Verification

- The agent reads the authoritative post-action state.
- Success criteria are machine-checkable where possible.
- Rollback or recovery paths exist.

## Evaluation

- Happy paths and adversarial cases are covered.
- Tool selection and argument quality are measured separately.
- Production traces feed regression tests.

[Back to notes](../)
