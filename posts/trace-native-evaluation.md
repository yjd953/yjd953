# Trace-Native Evaluation: From a Score to a Release Gate

Agent quality is not a property of the final answer alone. It is a property of the entire execution path: which context was selected, why a tool was chosen, whether arguments were correct, what external state changed, and whether the system recovered safely.

That path is the **trace**. A trace-native evaluation system treats it as first-class test data rather than debug exhaust.

```text
task quality
  = outcome
  × process integrity
  × operational reliability
```

This article describes an evaluation stack that connects offline replay, trace diagnosis, production signals, and release decisions.

## 1. Why final-answer scoring is insufficient

Consider two agents asked to update an incident ticket.

Agent A retrieves the correct incident, verifies the requested severity, updates exactly one field, reads the ticket again, and confirms the new state.

Agent B guesses the ticket ID from conversation history, retries after a timeout, updates two tickets, and happens to return the same final sentence as Agent A.

A judge that sees only the answer may give both runs the same score. Operationally, they are completely different.

Evaluation therefore needs three dimensions:

| Dimension | What it measures | Typical failure |
|---|---|---|
| Outcome | Whether the user's goal was achieved | Ticket remains unchanged |
| Process integrity | Whether evidence and actions were correct | Wrong ticket selected |
| Operational reliability | Whether execution stayed within constraints | Duplicate update or runaway retries |

Multiplication is a useful mental model. A polished answer cannot compensate for an unsafe process, and a perfect trace cannot compensate for an unmet goal.

### Define the task before judging it

Each evaluation case should contain:

- a normalized user goal;
- the initial external state;
- relevant permissions and policy;
- allowed and forbidden actions;
- expected final-state invariants;
- acceptable alternative paths;
- latency, token, and tool budgets.

Without this task envelope, evaluators often reward plausible text rather than successful work.

## 2. Build a four-layer evaluation stack

No evaluator is reliable enough to own the entire decision. Use layers with different cost and certainty.

### Layer 1: deterministic checks

Deterministic checks are the cheapest and strongest where the expected behavior is explicit:

- JSON Schema validity;
- permission decisions;
- exact IDs and enum values;
- required citations;
- duplicate side effects;
- final-state invariants;
- step, token, latency, and cost budgets;
- forbidden tool calls.

Run these checks on every evaluation case and, where inexpensive, on every production trace.

### Layer 2: model-based judges

Use model judges for semantic properties that are difficult to encode:

- whether the response addresses the user's intent;
- whether a plan is coherent;
- whether a summary preserves critical information;
- whether cited evidence supports a claim;
- whether a clarification was necessary.

A judge needs a rubric, not a vague question such as "Is this response good?"

```text
Score 0: goal not achieved or unsafe action taken
Score 1: partial progress, major correction required
Score 2: goal achieved with a process defect
Score 3: goal achieved, evidence and process are sound
```

Calibrate judges against human-labeled examples. Track disagreement by task type and judge version. A model judge is another model dependency, not ground truth.

### Layer 3: trace review

Trace review asks whether the path was justified:

- Was the selected context relevant and current?
- Was the correct tool chosen?
- Were arguments supported by evidence?
- Did retries follow the error contract?
- Were side effects verified?
- Was a human checkpoint used at the right moment?

Trace review can be deterministic, model-based, or human. The important point is that steps remain addressable so a failure can be assigned to a stage.

### Layer 4: online outcomes

Production signals reveal value that offline tests cannot fully simulate:

- task completion and abandonment;
- user correction rate;
- human takeover rate;
- repeated-action rate;
- downstream rollback or complaint;
- time to accepted outcome;
- cost per accepted task;
- retention after agent-assisted workflows.

Online metrics are real but delayed and confounded. Use them to validate offline assumptions, not as the only quality signal.

## 3. Design traces for evaluation

A trace should be a structured event sequence, not a giant prompt dump.

```json
{
  "task_id": "task_8f2a",
  "task_type": "incident_update",
  "versions": {
    "model": "model-2026-09",
    "prompt": "incident-agent-v14",
    "policy": "prod-policy-v8",
    "tools": "toolset-v23"
  },
  "budget": {
    "max_steps": 12,
    "max_tokens": 18000,
    "deadline_ms": 45000
  },
  "steps": [],
  "outcome": {
    "status": "completed",
    "verified": true
  }
}
```

Each step should capture:

- state before the decision;
- context references and provenance;
- selected action and normalized arguments;
- policy result;
- tool timing, error category, and retry count;
- state after execution;
- verification evidence;
- cumulative budgets.

### Record evidence references, not unlimited payloads

Full tool responses can contain personal data, credentials, and large documents. Store bounded summaries in the trace and keep sensitive raw evidence behind separate access controls.

Useful techniques:

- field allowlists;
- irreversible redaction before emission;
- content hashes for equality checks;
- object references with retention policies;
- sampling based on failure class;
- separate operational and research datasets.

Trace quality and privacy are part of the same design.

## 4. Score at the right granularity

A single task score is useful for dashboards but insufficient for diagnosis. Keep component metrics.

### Context metrics

- retrieval recall on required evidence;
- irrelevant-context rate;
- stale-evidence rate;
- citation correctness;
- tokens spent per useful source.

### Decision metrics

- correct tool selection;
- unnecessary tool-call rate;
- argument validity;
- clarification precision;
- forbidden-action rate.

### Execution metrics

- tool success rate by version;
- retry and timeout rate;
- idempotency conflict rate;
- unknown-outcome rate;
- verification failure rate.

### Outcome metrics

- verified task completion;
- user correction;
- human takeover;
- rollback;
- latency and cost per accepted task.

Component metrics prevent a model improvement from hiding a tool regression or a faster tool from hiding worse task completion.

## 5. Turn production failures into regression cases

The most valuable evaluation set grows from real failures.

```text
collect
  → classify
  → minimize
  → label invariants
  → replay
  → gate release
```

### Collect

Sample traces with meaningful signals:

- user corrections;
- verification failures;
- repeated actions;
- policy blocks;
- unusually high cost or step count;
- human takeover;
- low-confidence outcomes.

### Classify

Use a stable failure taxonomy:

```text
CONTEXT_MISSING
CONTEXT_STALE
TOOL_SELECTION
ARGUMENT_ERROR
AUTHORIZATION
EXECUTION_TRANSIENT
PARTIAL_SIDE_EFFECT
VERIFICATION_MISSING
LOOP_OR_STAGNATION
RESPONSE_QUALITY
```

The taxonomy should identify the owning system component. "The model was bad" is not an actionable class.

### Minimize

Remove unrelated history and tool data until the failure still reproduces. A minimal case is easier to understand, cheaper to run, and less likely to contain sensitive information.

Preserve:

- necessary context;
- relevant external state;
- policy configuration;
- tool behavior;
- the smallest prompt sequence that triggers the failure.

### Label invariants

Prefer outcome and process invariants over one expected sentence:

```yaml
must:
  - select incident INC-1842
  - update severity to SEV-2
  - verify the final ticket
must_not:
  - change owner
  - update any other incident
budget:
  tool_calls: 4
  wall_time_ms: 12000
```

This allows multiple valid reasoning paths while protecting the important boundaries.

## 6. Make replay realistic

An agent evaluation is only trustworthy when tool and state behavior resemble production.

Choose the replay level deliberately:

| Level | Environment | Use |
|---|---|---|
| Mock | Fixed tool responses | Fast contract and prompt tests |
| Simulator | Stateful local services | Multi-step plans and side effects |
| Shadow | Production reads, blocked writes | Real retrieval and routing |
| Canary | Limited real traffic | Final online validation |

Mocks are excellent for deterministic edge cases but hide timing, pagination, permission drift, and eventual consistency. Stateful simulation catches more process failures. Shadow and canary tests reveal integration behavior but require stronger privacy and safety controls.

### Freeze what matters

To compare releases, record:

- model and inference parameters;
- prompt and policy versions;
- tool schemas and adapters;
- retrieval corpus snapshot or document versions;
- simulator seed and clock;
- evaluator version.

Without versioned inputs, a changed score may not be attributable to the code under test.

## 7. Use release gates, not score theater

An aggregate score makes a clean chart but can hide severe regressions. Release gates should reflect risk.

Example:

```yaml
release:
  required:
    critical_task_success: ">= 0.97"
    high_risk_wrong_action: "== 0"
    duplicate_side_effect: "== 0"
    verification_coverage: ">= 0.995"
    p95_latency_regression: "<= 10%"
    cost_per_success_regression: "<= 8%"
  segmented_by:
    - task_type
    - risk_class
    - tool
    - locale
```

Important rules:

- compare against the current production baseline;
- gate critical slices separately;
- use confidence intervals for noisy metrics;
- require explanations for newly observed failure modes;
- attach a rollback plan to every canary;
- fail closed on safety invariants.

A release may improve average quality while regressing one high-risk workflow. Segmented gates make that visible.

## 8. Diagnose changes with paired traces

When a candidate release fails a case that the baseline passes, compare the runs step by step:

1. Did they retrieve the same evidence?
2. Did they normalize the same task state?
3. Where did action selection diverge?
4. Did policy or tool versions differ?
5. Did one run consume more budget before the divergence?
6. Did verification catch the problem?

This converts a score regression into an engineering hypothesis.

```text
observed:
  candidate selected update_user instead of update_ticket

evidence:
  both tools share argument name "id"
  tool descriptions omit resource type in first sentence

fix:
  rename arguments to user_id and ticket_id
  add negative selection cases
```

The best evaluation result is not "candidate scored 2.7." It is a reproducible explanation that leads to a targeted fix.

## 9. A practical rollout

### Phase 1: establish trace integrity

- assign stable task and step IDs;
- version model, prompts, tools, and policy;
- capture typed outcomes and verification;
- redact sensitive fields before storage.

### Phase 2: deterministic regression

- add schema and policy checks;
- define final-state invariants;
- create cases for duplicate actions, timeouts, and budget exhaustion;
- run on every relevant change.

### Phase 3: semantic evaluation

- create narrow judge rubrics;
- label a calibration set;
- measure agreement and drift;
- segment results by task type.

### Phase 4: production feedback loop

- sample failed and corrected tasks;
- classify and minimize traces;
- promote them into the regression suite;
- gate releases on critical slices.

## Release checklist

- [ ] Every case defines a task and initial state.
- [ ] Success is expressed as final-state invariants.
- [ ] Outcome, process, and operational metrics remain separate.
- [ ] Critical safety properties use deterministic checks.
- [ ] Model judges have calibrated rubrics and versioning.
- [ ] Traces contain sources, actions, policy decisions, and verification.
- [ ] Sensitive fields are excluded or irreversibly redacted.
- [ ] Tool behavior is realistic enough for the target test.
- [ ] Production failures can become minimized replay cases.
- [ ] Release gates compare against baseline by risk segment.

## Conclusion

Evaluation becomes an engineering system when traces, replay, diagnosis, and release gates are connected.

The purpose is not to prove that a new model is smarter. It is to prove that the complete agent system is more likely to achieve the intended outcome, through an acceptable process, within operational constraints.

[Back to notes](../)
