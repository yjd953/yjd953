# From Demo to Production: Four Reliability Pillars for Agents

Agent demos optimize for possibility. Production systems optimize for repeatability under uncertainty.

## 1. Explicit state

Keep task state, user intent, tool results, and pending decisions structured. If the system cannot explain what it believes is true, recovery becomes guesswork.

## 2. Contract-first tools

Treat every tool as a typed boundary. Validate inputs, constrain side effects, make retries idempotent, and verify the resulting state instead of trusting a success string.

## 3. Layered evaluation

Combine deterministic checks, model-based evaluation, trace review, and online outcome metrics. A single benchmark cannot represent production behavior.

## 4. Observability and control

Capture decisions, latency, token use, tool calls, errors, and human interventions. Keep high-impact actions reversible and put a human checkpoint where uncertainty meets consequence.

## A useful mental model

```text
context → reason → act → verify → learn
```

The model matters, but the loop around the model determines whether an agent is dependable.

[Back to notes](../)
