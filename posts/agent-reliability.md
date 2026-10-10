# From Demo to Production: Four Reliability Pillars for Agents

Agent demos optimize for possibility. Production systems optimize for repeatability under uncertainty.

A convincing demo can be built with a model, a prompt, and a few tools. A dependable product needs more: explicit state, bounded execution, verified side effects, recovery paths, and enough evidence to explain what happened after the fact. Those capabilities form the **agent harness** around the model.

The model proposes the next action. The harness decides whether that action is allowed, executes it under constraints, verifies the result, and records the transition.

```text
request
  → assemble context
  → propose action
  → authorize
  → execute
  → verify state
  → continue | complete | escalate
```

This article develops four reliability pillars and shows how they fit into one production control loop.

## 1. Explicit state: make the task inspectable

Conversation history is not a task state. It is an unstructured transcript containing requests, guesses, tool output, corrections, and stale assumptions. If the system can only recover by replaying that transcript into another model call, recovery is probabilistic.

A production agent should maintain a compact task record outside the prompt:

```json
{
  "task_id": "task_8f2a",
  "goal": "Schedule a design review with the API team",
  "status": "awaiting_confirmation",
  "constraints": {
    "deadline": "2026-10-03T18:00:00+08:00",
    "timezone": "Asia/Shanghai",
    "max_attendees": 8
  },
  "facts": [
    {
      "value": "Tuesday 15:00 is free for all required attendees",
      "source": "calendar.freebusy",
      "observed_at": "2026-09-30T10:18:22+08:00"
    }
  ],
  "pending_action": {
    "tool": "calendar.create_event",
    "risk": "reversible_write",
    "requires_confirmation": true
  },
  "last_verified_step": "availability_checked"
}
```

The important distinction is between four kinds of information:

| Kind | Meaning | Example |
|---|---|---|
| Goal | What the user wants achieved | A review meeting exists |
| Constraint | A boundary that must remain true | Before Friday, required attendees only |
| Fact | A claim backed by a source | Calendar free/busy result |
| Proposal | An action that has not happened yet | Create Tuesday 15:00 event |

Mixing facts and proposals is a common source of false completion. A model may mention an action in natural language and later treat that mention as evidence that the action occurred. Typed state prevents that category error.

### State must survive interruption

Every externally meaningful step should end with a checkpoint. A checkpoint contains the normalized input, the action attempt, the observed result, and the next legal states. If a worker crashes, another worker can resume from the last **verified** checkpoint instead of repeating the entire task.

Useful invariants include:

- A completed state always references verification evidence.
- A pending side effect is never represented as completed.
- An irreversible action cannot be retried without an idempotency or reconciliation strategy.
- Expired observations are re-read before they influence a new action.

## 2. Contract-first tools: treat every call as a transaction

Tool use is where an agent stops generating text and starts changing external state. That boundary needs a stronger contract than a function name plus JSON Schema.

A production tool contract should define:

1. **Structural rules**: types, required fields, formats, enums, and size limits.
2. **Semantic rules**: relationships between fields, such as `end_at > start_at`.
3. **Authorization rules**: which identity may perform which operation on which resource.
4. **Effect semantics**: what can be created, changed, deleted, sent, or published.
5. **Failure semantics**: retryable, rejected, conflicted, timed out, or partially completed.
6. **Verification rules**: where the authoritative post-action state can be read.
7. **Recovery rules**: retry, compensate, reconcile, or escalate.

For example:

```json
{
  "name": "create_calendar_event",
  "risk": "reversible_write",
  "idempotency": {
    "required": true,
    "scope": "organizer + attendees + start_at"
  },
  "timeout_ms": 8000,
  "verification": {
    "read": "calendar.get_event(result.event_id)",
    "invariants": [
      "status == confirmed",
      "start_at == request.start_at",
      "required_attendees subset_of attendees"
    ]
  }
}
```

### Success is an observed state, not a return string

An HTTP 200 may mean "accepted for processing." A tool response saying `success: true` may still precede asynchronous validation, eventual consistency, or a downstream failure. The harness should read the authoritative object and compare explicit invariants.

```text
prepare → authorize → execute → read authoritative state → compare invariants
```

This is the difference between **request success** and **task success**.

## 3. Bounded execution: replace open loops with a state machine

The most dangerous implementation of an agent is an unconstrained loop:

```python
while True:
    next_action = model(context)
    if next_action.type == "finish":
        break
    execute(next_action)
```

The model controls termination, cost, and side effects. A malformed tool result or a weak prompt can create repeated calls, growing context, and duplicated writes.

A safer runtime uses explicit states and global guards:

```text
RECEIVED
  → CONTEXT_READY
  → DECIDING
  → ACTION_PENDING
  → EXECUTING
  → VERIFYING
  → DECIDING | COMPLETED | BLOCKED

Global guards:
- max_steps
- deadline
- token_budget
- tool_budget
- repeated_action_limit
- side_effect_budget
- human_checkpoint
```

Each transition should answer:

- What condition allows entry?
- Which inputs are trusted?
- Which outputs are produced?
- What evidence is recorded?
- Which failures are retryable?
- What is the next legal state?

The model can still choose among allowed actions, but it no longer controls the boundaries of the system.

### Detecting unproductive loops

A step limit alone stops a runaway task but does not explain it. Record a normalized action fingerprint:

```text
fingerprint = tool_name + canonical_arguments + relevant_state_version
```

Repeated fingerprints without new evidence indicate a loop. Repeated reasoning with no change in the task state indicates stagnation. Both should trigger a different strategy or a human checkpoint before the hard step limit is reached.

## 4. Recovery-first execution

Failures are normal when an agent coordinates APIs, browsers, databases, and human approval. Recovery must be designed before retries are enabled.

### Retry only transient failures

Rate limits, temporary network failures, and service unavailability may be retried with bounded exponential backoff. Invalid arguments, permission errors, policy rejections, and business conflicts should not be retried unchanged.

Every error should be mapped to a typed category:

```text
TRANSIENT
INVALID_INPUT
UNAUTHORIZED
CONFLICT
PARTIAL_SUCCESS
UNKNOWN_OUTCOME
POLICY_BLOCKED
```

`UNKNOWN_OUTCOME` deserves special treatment. A timeout does not prove that the downstream action failed. Before retrying, the harness must query the authoritative state using an idempotency key or business identifier.

### Resume from verified checkpoints

Recovery should continue from the last known-good state:

```text
attempt action
  → timeout
  → query by idempotency key
  → object exists and invariants match
  → mark verified
  → continue
```

Restarting the whole task can duplicate emails, orders, approvals, or calendar events. Checkpoint recovery turns failure handling into a deterministic workflow instead of another prompt.

### Escalate ambiguity, not every error

Human intervention is valuable when uncertainty meets consequence:

- the target object is ambiguous;
- required authorization is missing;
- a CAPTCHA or physical confirmation is required;
- an irreversible action is ready to commit;
- the external result cannot be reconciled safely.

The handoff should include the goal, current state, evidence, attempted actions, and the exact decision required. "Something failed, please help" is not a usable checkpoint.

## 5. Layered evaluation: measure outcome, process, and operations

A final-answer score is insufficient for agents. Two runs may produce the same answer while one uses valid evidence and the other guesses. Two runs may call the same tool while one has correct parameters and the other accidentally succeeds.

Evaluate three dimensions:

```text
Task quality
  = outcome quality
  × process integrity
  × operational reliability
```

| Dimension | Questions |
|---|---|
| Outcome | Was the user's goal actually achieved? |
| Process | Were context, tool choice, arguments, permissions, and evidence correct? |
| Operations | Were latency, cost, retries, and recovery within budget? |

A useful evaluation stack combines:

1. deterministic checks for schemas, permissions, citations, and state invariants;
2. model-based judges for semantic quality;
3. trace review for tool choice and recovery behavior;
4. online outcomes such as correction rate, abandonment, and human takeover.

No single layer replaces the others.

## 6. Observability and control

Logs centered on model requests are too narrow. The unit of observability should be the task and its state transitions.

A minimum trace should include:

- task ID, user goal, channel, and policy scope;
- model, prompt, tool, and policy versions;
- context sources, timestamps, and token allocation;
- every proposed and selected action;
- authorization decisions and human checkpoints;
- tool latency, result category, retry count, and response summary;
- verification evidence and final business state;
- total tokens, cost, wall time, and execution steps.

Sensitive values should be excluded by schema, not removed later with best-effort string replacement. Use field allowlists, hashed identifiers, summaries, and controlled sampling.

Budgets are also control mechanisms:

| Budget | Prevents |
|---|---|
| Step budget | Infinite decision loops |
| Token budget | Unbounded context growth |
| Tool budget | Repeated or fan-out calls |
| Time budget | Tasks that never converge |
| Side-effect budget | Excessive external changes |

When a budget is reached, the system should produce a structured `BLOCKED` result with the reason and evidence rather than pretending to finish.

## 7. A production architecture

The four pillars map naturally to six runtime layers:

| Layer | Responsibility |
|---|---|
| Ingress | Normalize request, identity, attachments, and channel |
| Context engine | Retrieve, rank, compact, cite, and budget |
| Decision loop | Produce bounded action candidates |
| Execution plane | Validate, authorize, invoke, and verify |
| State store | Persist checkpoints, facts, and pending actions |
| Observability and eval | Trace, replay, diagnose, and gate releases |

The model is replaceable inside this architecture. State contracts and verification boundaries should remain stable when the model changes.

## Release checklist

- [ ] Task state is structured and serializable.
- [ ] Facts include source and observation time.
- [ ] Every loop has step, time, token, and tool limits.
- [ ] Side-effecting tools declare risk and authorization requirements.
- [ ] Writes support idempotency or safe reconciliation.
- [ ] Completion requires authoritative post-action verification.
- [ ] Recovery resumes from a verified checkpoint.
- [ ] Repeated actions and stagnant state are detected.
- [ ] High-impact actions have an explicit human checkpoint.
- [ ] Traces can answer why each action happened.
- [ ] Production failures can be converted into replayable regression cases.

## Conclusion

Reliable agents are not created by asking the model to be more careful. They are created by placing an uncertain decision component inside a system with explicit state, strict tool contracts, bounded execution, verified effects, and recoverable transitions.

The model determines what is possible. The harness determines what is dependable.

[Back to notes](../)
