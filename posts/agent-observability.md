# Agent Observability: Metrics That Expose Failure

Traditional service monitoring asks whether a request succeeded, how long it took, and which dependency failed. Agent systems add another layer: the request may return 200 while the task fails, the model may call healthy tools in the wrong order, and cost may grow because the execution loop does not converge.

Observability therefore has to follow the task, not only the HTTP request.

```text
service telemetry
  + model telemetry
  + tool telemetry
  + task state
  + verified outcome
  = agent observability
```

This article defines a practical measurement model for task completion, execution depth, token use, cost, latency, tools, and human intervention.

## 1. Choose the correct unit of observation

An agent task often spans multiple model calls, tools, retries, workers, and human checkpoints. Request-level dashboards fragment that work into unrelated events.

Use four nested identifiers:

| Level | Identifier | Meaning |
|---|---|---|
| Task | `task_id` | One user goal from accepted input to final outcome |
| Run | `run_id` | One execution attempt, including resumes |
| Step | `step_id` | One state transition or model decision |
| Operation | `operation_id` | One model, retrieval, policy, or tool call |

The task is the product unit. The operation is the debugging unit.

```json
{
  "task_id": "task_8f2a",
  "run_id": "run_03",
  "step_id": "step_07",
  "operation_id": "tool_11",
  "task_type": "calendar_scheduling",
  "state": "verifying"
}
```

Stable IDs allow traces, logs, metrics, and external audit records to be joined without copying full payloads into every system.

## 2. Define completion as a verified business state

The easiest metric to publish is response success rate. It is also one of the least useful.

```text
HTTP success ≠ model success ≠ tool success ≠ task success
```

Use a task outcome taxonomy:

```text
COMPLETED_VERIFIED
COMPLETED_UNVERIFIED
PARTIAL
BLOCKED_USER_INPUT
BLOCKED_PERMISSION
FAILED_RETRYABLE
FAILED_TERMINAL
ABANDONED
```

The primary success metric should be:

```text
verified completion rate
  = COMPLETED_VERIFIED tasks / eligible tasks
```

Keep the denominator explicit. Exclude unsupported requests only when they are classified before execution. Silently removing hard or failed tasks creates a misleading success rate.

### Track correction and reversal

A task that looks successful may be corrected later. Useful delayed signals include:

- user edits immediately after agent completion;
- downstream rollback;
- reopened tickets;
- canceled events;
- repeated request for the same goal;
- negative feedback tied to a task ID.

Measure both immediate completion and completion that remains accepted after a time window.

## 3. Measure execution depth

Agent latency and cost are heavily influenced by how many decisions the system makes before completion.

Core metrics:

- steps per task;
- model calls per task;
- tool calls per task;
- retries per operation;
- repeated action fingerprints;
- state transitions without new evidence;
- maximum and P95 execution depth.

Averages hide the long tail. A system with a median of three steps and a P99 of eighty steps has a convergence problem.

### Detect loops and stagnation

Define an action fingerprint:

```text
tool + normalized arguments + relevant state version
```

Then track:

```text
repeated_action_rate
stagnant_step_rate
tasks_hitting_step_limit
tasks_hitting_tool_limit
```

A repeated action may be legitimate after new evidence. Repetition with unchanged state is the stronger failure signal.

### Segment depth by outcome

Compare step distributions for:

- verified success;
- user takeover;
- terminal failure;
- high-cost outliers;
- each task type and tool.

If failed tasks consume far more steps than successful tasks, introduce earlier stop conditions or route ambiguous cases to clarification.

## 4. Attribute token use and cost

Total token count is not enough. Attribute tokens to their purpose.

```text
input tokens
  = system instructions
  + conversation
  + retrieved context
  + tool results
  + task state

output tokens
  = reasoning-facing output
  + tool arguments
  + final response
```

Capture:

- input and output tokens per model call;
- cumulative tokens per task;
- tokens by context source;
- tokens added by tool results;
- cached versus uncached tokens;
- model-specific price at execution time;
- cost per verified task.

The key business metric is not cost per request:

```text
cost per verified completion
  = total eligible task cost / verified completed tasks
```

Cheaper requests do not improve efficiency if they require more retries or reduce completion.

### Context efficiency

Useful context metrics include:

| Metric | Interpretation |
|---|---|
| Retrieved tokens per task | Context volume |
| Cited-source utilization | Evidence actually used |
| Irrelevant-context rate | Retrieval waste |
| Repeated-context ratio | Duplication across steps |
| Context growth slope | Whether the loop accumulates history |
| Compaction frequency | Pressure on the context window |

A rapidly growing context with flat task progress is a warning sign. Compaction can reduce tokens but may hide the underlying loop, so correlate it with state transitions.

## 5. Decompose latency

End-to-end latency should be decomposed into stages:

```text
task latency
  = queue
  + context assembly
  + model inference
  + policy
  + tool execution
  + verification
  + human wait
```

Record active system time separately from time waiting for a person.

| Metric | Why it matters |
|---|---|
| Time to first useful action | Perceived responsiveness |
| Time to verified completion | Actual task duration |
| Model P50/P95/P99 | Inference tail |
| Tool P50/P95/P99 | Dependency tail |
| Queue delay | Capacity pressure |
| Verification delay | Eventual consistency or polling |
| Human wait time | Workflow rather than system latency |

Parallel calls can reduce wall time while increasing cost and blast radius. Track fan-out width and canceled operations so latency optimization does not become uncontrolled concurrency.

## 6. Observe tools as transactions

For each tool and version, measure:

- selection count;
- valid-argument rate;
- authorization allow, deny, and confirmation rates;
- execution success by typed error;
- retries and retry recovery;
- idempotency conflicts;
- unknown outcomes;
- verification pass rate;
- side effects per task;
- latency and response size.

Separate three failure points:

```text
selection failed
argument construction failed
execution failed
```

Combining them into "tool error" prevents ownership. A model or prompt change affects selection and arguments; an adapter release affects execution and verification; a policy change affects authorization.

### Track version dimensions

Every event should include:

- model version;
- prompt version;
- tool schema and adapter version;
- policy version;
- retrieval index or corpus version;
- experiment assignment.

Without these dimensions, a dashboard can show a regression but cannot identify the change responsible.

## 7. Measure human control

Human intervention is not automatically a failure. It may be the correct behavior for a high-risk or ambiguous task.

Classify checkpoints:

```text
CLARIFICATION
AUTHORIZATION
HIGH_RISK_CONFIRMATION
CAPTCHA_OR_LOGIN
AMBIGUOUS_STATE
OPERATOR_RECOVERY
```

Track:

- checkpoint rate by task type and risk class;
- acceptance, edit, and rejection rate;
- time to response;
- percentage of handoffs with complete context;
- task success after intervention;
- unnecessary-confirmation rate.

The goal is not zero human involvement. The goal is to place humans where judgment changes the outcome while automating routine, well-bounded work.

## 8. Design a useful event schema

Metrics should be derivable from structured events rather than parsed log sentences.

```json
{
  "event": "agent.step.completed",
  "timestamp": "2026-09-30T10:18:22.481Z",
  "task_id": "task_8f2a",
  "run_id": "run_03",
  "step_id": "step_07",
  "task_type": "calendar_scheduling",
  "from_state": "executing",
  "to_state": "verifying",
  "model": {
    "name": "model-2026-09",
    "prompt_version": "scheduler-v14",
    "input_tokens": 2180,
    "output_tokens": 164
  },
  "tool": {
    "name": "calendar.create_event",
    "version": "3",
    "attempt": 1,
    "duration_ms": 184,
    "result_type": "success"
  },
  "budget": {
    "step": 7,
    "max_steps": 12,
    "cost_usd": 0.018
  },
  "verification": {
    "status": "pending"
  }
}
```

### Control cardinality

Do not place task IDs, user IDs, full URLs, prompts, or arbitrary error strings in metric labels. They create unbounded cardinality and cost.

Use:

- low-cardinality dimensions in metrics;
- task IDs in traces;
- structured details in logs;
- sampled payloads in restricted storage.

### Protect content

Observability is not permission to store everything.

- redact before telemetry leaves the process;
- hash identifiers used for correlation;
- store prompt and tool payloads only when necessary;
- separate debugging access from aggregate dashboard access;
- set retention by sensitivity;
- audit access to raw traces.

## 9. Build dashboards around decisions

A useful dashboard answers a sequence of questions.

### Overview

- Is verified completion changing?
- Are latency and cost within budget?
- Is human takeover increasing?
- Which task types explain the movement?

### Execution

- Are tasks taking more steps?
- Which tools have rising retries or verification failures?
- Are repeated actions or unknown outcomes increasing?
- Did a model, prompt, tool, or policy version change?

### Cost

- Which task types consume the most tokens?
- Is input growth caused by retrieval, tool output, or conversation history?
- What is cost per verified completion?
- Are expensive tasks actually more successful?

### Failure analysis

- What are the top typed failure classes?
- Which new failure clusters appeared?
- Can representative traces be replayed?
- Does the regression affect a critical risk segment?

Avoid one dashboard with dozens of unrelated charts. Use an overview for detection and linked diagnostic views for explanation.

## 10. Alert on symptoms with user impact

Alerts should identify a meaningful deviation and point to a diagnostic slice.

Strong alerts:

- verified completion drops for a critical task type;
- duplicate side effects exceed zero;
- verification coverage falls below the release invariant;
- unknown outcomes rise after a tool release;
- P95 steps or cost per success crosses a budget;
- policy denials unexpectedly spike for one tenant or tool.

Weak alerts:

- raw token volume increased;
- one model request was slow;
- tool calls increased without task context;
- average latency moved slightly while the distribution remained healthy.

Use burn-rate or sustained-window alerts to avoid reacting to small random changes. For safety invariants such as duplicate irreversible actions, alert immediately.

## 11. Diagnose one regression end to end

Suppose cost per verified task rises 38 percent after a release.

Start with the decomposition:

```text
cost per verified task
  = cost per attempt
  × attempts per task
  / verified completion rate
```

Then inspect:

1. Input tokens increased, output tokens stayed flat.
2. The increase is isolated to `research_summary`.
3. Retrieved tokens per step are stable, but repeated-context ratio doubled.
4. Step count P95 increased from 8 to 15.
5. Traces show the same search result appended after every retry.
6. The retry path rebuilds context without deduplicating evidence.

The dashboard did not merely show "token cost is high." The joined task, step, and context metrics identified a specific state-management defect.

## 12. A practical rollout

### Phase 1: establish identifiers and outcomes

- propagate task, run, step, and operation IDs;
- define the task outcome taxonomy;
- require verification evidence for completed writes;
- record model, prompt, tool, and policy versions.

### Phase 2: add budgets and component metrics

- token, step, tool, time, and side-effect budgets;
- latency decomposition;
- typed tool errors;
- cost per verified completion.

### Phase 3: connect traces to evaluation

- sample corrections, takeovers, and outliers;
- classify failure modes;
- create replayable regression cases;
- link release versions to metric movement.

### Phase 4: add targeted alerts

- critical task completion;
- duplicate effects;
- verification coverage;
- high-cost execution tails;
- new failure clusters.

## Instrumentation checklist

- [ ] Task, run, step, and operation IDs are stable.
- [ ] Completion means a verified business state.
- [ ] Outcomes distinguish blocked, partial, failed, and abandoned tasks.
- [ ] Step count and repeated-action fingerprints are recorded.
- [ ] Tokens are attributed to context, tools, and outputs.
- [ ] Cost per verified completion is available.
- [ ] Latency is split by queue, model, tool, verification, and human wait.
- [ ] Tool selection, arguments, execution, and verification are separate metrics.
- [ ] Model, prompt, tool, policy, and experiment versions are dimensions.
- [ ] Sensitive content is excluded before telemetry emission.
- [ ] Dashboards link aggregate changes to representative traces.
- [ ] Production failures can become regression cases.

## Conclusion

Agent observability is not a larger version of an API dashboard. It is a measurement system for goal completion, decision quality, external effects, resource use, and control.

When telemetry follows the task from intent to verified outcome, teams can answer the questions that matter: Did the agent finish the work? Was the path safe? Why did cost change? Where did execution diverge? Can the failure be reproduced?

[Back to notes](../)
