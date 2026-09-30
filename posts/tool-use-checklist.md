# A Practical Tool-Use Checklist

Tools are the boundary where an agent stops proposing text and starts changing the world. That boundary deserves the same engineering discipline as a payment API, deployment system, or database migration.

A function name and a JSON Schema are not enough. A production tool must define what the operation means, who may run it, which effects it can create, how failures are classified, and how the final state is verified.

This guide treats every tool call as a small transaction:

```text
intent
  → validate
  → authorize
  → prepare
  → execute
  → verify
  → commit trace
```

If any stage is missing, the agent may still work in a demo. The missing stage will eventually become an incident in production.

## 1. Start with the effect, not the function signature

Before defining parameters, classify what the tool can do.

| Class | Examples | Default control |
|---|---|---|
| Read | Search documents, inspect a task | Auto-execute with audit |
| Reversible write | Create a draft, update a label | Policy check and verification |
| External communication | Send email, post a message | Preview and scoped confirmation |
| Irreversible write | Delete data, publish, transfer funds | Explicit checkpoint and strong identity |

Risk depends on more than the HTTP method. A `GET` endpoint can expose sensitive data; a reversible write may still affect thousands of records. Evaluate:

- reversibility;
- blast radius;
- data sensitivity;
- external visibility;
- financial or legal impact;
- time sensitivity;
- required identity.

The resulting risk class should travel with the tool definition and appear in traces, policy decisions, and evaluation results.

## 2. Define a complete contract

### Structural contract

Use a strict schema:

- reject unknown fields;
- distinguish required, optional, and nullable values;
- use closed enums where possible;
- set string lengths and collection limits;
- specify formats for IDs, timestamps, currency, and time zones;
- avoid untyped `metadata` bags unless their contents are separately validated.

```json
{
  "type": "object",
  "additionalProperties": false,
  "required": ["calendar_id", "title", "start_at", "end_at"],
  "properties": {
    "calendar_id": {
      "type": "string",
      "pattern": "^cal_[a-z0-9]+$"
    },
    "title": {
      "type": "string",
      "minLength": 1,
      "maxLength": 120
    },
    "start_at": {
      "type": "string",
      "format": "date-time"
    },
    "end_at": {
      "type": "string",
      "format": "date-time"
    },
    "attendee_ids": {
      "type": "array",
      "maxItems": 20,
      "items": {
        "type": "string"
      }
    }
  }
}
```

Schema validation should happen before authorization and execution. The downstream service should never receive an argument set that the harness already knows is invalid.

### Semantic contract

JSON Schema cannot express all business rules. Add deterministic validators for relationships such as:

- `end_at` must be later than `start_at`;
- all attendees must belong to the allowed tenant;
- the selected currency must match the account;
- a task cannot transition directly from `draft` to `completed`;
- a batch operation cannot exceed the approved scope.

Do not delegate rules with known answers to the model. Deterministic checks are cheaper, more stable, and easier to audit.

### Result contract

The result should separate business data from execution metadata:

```json
{
  "status": "accepted",
  "data": {
    "event_id": "evt_42"
  },
  "execution": {
    "request_id": "req_91",
    "idempotency_key": "task_8f2a:create_event:v1",
    "started_at": "2026-09-30T10:18:22Z",
    "duration_ms": 184
  }
}
```

Avoid returning ambiguous strings such as `"done"` or `"something went wrong"`. The harness needs machine-readable states.

## 3. Make authorization contextual

Tool availability and tool authorization are different.

The model may know that `delete_document` exists, but execution should depend on:

- the authenticated user;
- the current tenant or workspace;
- the target resource;
- the requested scope;
- the task's original intent;
- the risk class;
- whether confirmation is still valid.

A useful policy decision returns more than allow or deny:

```json
{
  "decision": "require_confirmation",
  "reason": "external_visibility",
  "scope": {
    "tool": "publish_document",
    "resource_id": "doc_42",
    "version": 7
  },
  "expires_at": "2026-09-30T10:30:00Z"
}
```

Confirmation must bind to the exact action. A user approving "publish version 7 of document 42" should not authorize a later publish of version 8 or another document.

### Separate preview from commit

High-impact tools benefit from a two-phase interface:

1. **Prepare** validates inputs and returns a complete preview.
2. **Commit** accepts a preview ID and a scoped confirmation token.

The preview should show the target, final content, recipients, monetary amount, and irreversible effects. The commit endpoint should reject stale previews.

## 4. Design idempotency before retries

Retries are only safe when repeated execution preserves the intended business result.

### Use a business-scoped key

An idempotency key should identify the intent, not the network attempt:

```text
task_id + tool_name + normalized_target + semantic_version
```

Generating a random key for every retry defeats idempotency. Reusing one key across unrelated actions can incorrectly collapse valid operations.

The downstream service should store:

- the idempotency key;
- a hash of normalized arguments;
- execution status;
- response or resource ID;
- retention expiry.

If the same key arrives with different arguments, return a conflict instead of guessing.

### Treat timeouts as unknown outcomes

A timeout means the caller did not observe a result. It does not prove that the server did nothing.

```text
request sent
  → caller timeout
  → server may have committed
  → retry without reconciliation
  → duplicate side effect
```

After a timeout:

1. query by idempotency key or business identifier;
2. verify whether the desired object exists;
3. continue if invariants match;
4. compensate or escalate if state is partial;
5. retry only if absence is authoritative.

## 5. Use typed failure semantics

The tool adapter should map service-specific errors into a small stable taxonomy.

| Error type | Retry? | Typical action |
|---|---:|---|
| `TRANSIENT` | Yes, bounded | Backoff and retry |
| `RATE_LIMITED` | Yes, scheduled | Respect retry-after |
| `INVALID_INPUT` | No | Correct arguments |
| `UNAUTHORIZED` | No | Request authorization |
| `CONFLICT` | Usually no | Re-read state and re-plan |
| `PARTIAL_SUCCESS` | No blind retry | Reconcile or compensate |
| `UNKNOWN_OUTCOME` | Not yet | Query authoritative state |
| `POLICY_BLOCKED` | No | Explain boundary or escalate |

The raw downstream message can still be attached for operators, but the decision loop should act on the typed category.

### Bound every retry policy

Define:

- maximum attempts;
- total retry time;
- exponential backoff and jitter;
- which errors qualify;
- whether the action consumes a side-effect budget;
- what evidence is required before another attempt.

Retries without these limits can amplify outages and create tool-call storms.

## 6. Verify the post-action state

The authoritative state is often different from the tool response.

| Action | Verification source | Example invariant |
|---|---|---|
| Create calendar event | Calendar read API | Time and attendee set match |
| Send message | Message history | One message with idempotency key exists |
| Update issue | Issue read API | State and assignee match |
| Submit workflow | Workflow instance API | Instance is accepted and linked |
| Delete object | Object read or tombstone | Object is absent or marked deleted |

Verification should be:

- **independent** when possible, using a read path rather than trusting the write response;
- **specific**, comparing expected invariants;
- **bounded**, with timeouts for eventually consistent systems;
- **recorded**, so completion has evidence.

```python
result = create_event(request, idempotency_key)
event = get_event(result.event_id)

assert event.status == "confirmed"
assert event.start_at == request.start_at
assert required_attendees <= set(event.attendee_ids)
```

If verification fails, do not report success. Return a typed partial or unknown state.

## 7. Protect sensitive data

Tool arguments and results often contain the most sensitive information in an agent trace. Protection should begin at the schema:

- mark secret and personal-data fields;
- exclude secrets from model-visible arguments where possible;
- use references to credentials rather than raw credentials;
- redact before logs and traces are emitted;
- hash stable identifiers used only for aggregation;
- store full payloads only behind restricted, short-retention access;
- prevent downstream error messages from echoing secrets.

Avoid generic recursive redaction as the primary control. It misses encoded data and can over-redact useful evidence. Field-level policies are more reliable.

### Minimize model-visible output

The model rarely needs the entire API response. Tool adapters should return a bounded semantic result:

```json
{
  "event_id": "evt_42",
  "status": "confirmed",
  "start_at": "2026-10-02T15:00:00+08:00",
  "attendee_count": 6
}
```

Keep raw payloads outside the prompt for debugging under stricter access controls.

## 8. Instrument the transaction

Every call should emit enough telemetry to answer:

- Why was this tool selected?
- Which policy allowed it?
- Which normalized arguments were used?
- How long did validation, authorization, execution, and verification take?
- Was the operation retried?
- Did it change external state?
- Was the final state verified?

A compact event schema:

```json
{
  "task_id": "task_8f2a",
  "step_id": "step_06",
  "tool": "calendar.create_event",
  "tool_version": "3",
  "risk": "reversible_write",
  "policy_decision": "allow",
  "attempt": 1,
  "duration_ms": 184,
  "result_type": "success",
  "verification": "passed",
  "input_tokens": 0,
  "output_bytes": 418
}
```

Aggregate metrics should include tool selection accuracy, argument validity, authorization rejection rate, retry rate, unknown-outcome rate, verification failure rate, and P95 latency.

## 9. Evaluate tools independently from the full agent

Tool quality can be tested without a live model.

### Contract tests

- valid and invalid schemas;
- semantic boundary values;
- unknown-field rejection;
- stable error mapping;
- response size limits.

### Execution tests

- timeout before and after downstream commit;
- duplicate idempotency keys;
- partial success;
- stale confirmation;
- authorization changes between prepare and commit;
- eventual consistency during verification.

### Model-facing tests

- correct tool selection among similar tools;
- required arguments inferred only from evidence;
- no invention of IDs or enum values;
- safe behavior when required input is missing;
- resistance to instructions returned by an untrusted tool.

Evaluate selection, arguments, execution, and verification separately. A single "task passed" label cannot reveal which contract failed.

## Release checklist

### Contract

- [ ] Inputs and outputs are typed and documented.
- [ ] Unknown fields are rejected.
- [ ] Cross-field business rules are deterministic.
- [ ] Results distinguish accepted, completed, partial, and unknown states.

### Authorization and effects

- [ ] Risk class and blast radius are declared.
- [ ] Authorization is evaluated against user, resource, scope, and intent.
- [ ] Confirmation binds to an exact action and expires.
- [ ] High-impact operations support preview before commit.

### Execution

- [ ] Retries are bounded and limited to eligible errors.
- [ ] A business-scoped idempotency key is supported.
- [ ] Timeouts are treated as unknown outcomes.
- [ ] Partial completion is detectable.
- [ ] Compensation or reconciliation paths exist.

### Verification

- [ ] The authoritative post-action state is readable.
- [ ] Success invariants are machine-checkable.
- [ ] Eventual consistency has a bounded policy.
- [ ] Completion records verification evidence.

### Privacy and observability

- [ ] Sensitive fields are marked at schema level.
- [ ] Raw secrets never enter prompts or general logs.
- [ ] Tool traces include policy, latency, retries, and verification.
- [ ] Production failures feed regression tests.

## Conclusion

A reliable agent tool is not merely an API the model can call. It is a transaction protocol the harness can validate, authorize, execute, verify, observe, and recover.

When that protocol is explicit, tool use becomes testable engineering rather than optimistic automation.

[Back to notes](../)
