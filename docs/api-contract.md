# DecisionLab API Contract (MVP)

## Purpose

This document defines the API contract between frontend and backend teams.

Frontend should build against these request/response shapes.

---

# Scenario

A scenario represents an engineering decision-making challenge.

Example:

```json
{
  "id": "scenario_1",
  "title": "Database Scaling",
  "description": "Traffic increased from 10k to 100k requests per minute. Database CPU is consistently above 95%. What would you do?",
  "difficulty": "MEDIUM",
  "createdAt": "2026-06-08T10:00:00Z"
}
```

---

# GET /api/scenarios

Returns all available scenarios.

## Response

```json
[
  {
    "id": "scenario_1",
    "title": "Database Scaling",
    "difficulty": "MEDIUM"
  },
  {
    "id": "scenario_2",
    "title": "JWT Authentication",
    "difficulty": "EASY"
  }
]
```

---

# GET /api/scenarios/:id

Returns a single scenario.

## Response

```json
{
  "id": "scenario_1",
  "title": "Database Scaling",
  "description": "Traffic increased from 10k to 100k requests per minute. Database CPU is consistently above 95%. What would you do?",
  "difficulty": "MEDIUM"
}
```

---

# POST /api/submissions

Submit a user's answer.

## Request

```json
{
  "scenarioId": "scenario_1",
  "answer": "I would first identify slow queries and analyze bottlenecks before introducing caching."
}
```

## Response

```json
{
  "submissionId": "sub_123"
}
```

---

# POST /api/evaluate

Evaluates a submission using Gemini.

## Request

```json
{
  "submissionId": "sub_123"
}
```

## Response

```json
{
  "score": 82,
  "feedback": "Strong problem identification and tradeoff analysis. Risk analysis could be improved.",
  "breakdown": {
    "problemUnderstanding": 22,
    "tradeoffAnalysis": 21,
    "riskAnalysis": 17,
    "decisionQuality": 22
  }
}
```

---

# Evaluation Rubric

Maximum score: 100

## Problem Understanding

25 points

Can the engineer identify the actual problem?

---

## Tradeoff Analysis

25 points

Can the engineer compare alternatives and justify decisions?

---

## Risk Analysis

25 points

Can the engineer identify failure modes and unintended consequences?

---

## Decision Quality

25 points

Is the recommendation reasonable given the scenario constraints?

---

# Error Response

All endpoints return:

```json
{
  "message": "Human readable error message"
}
```
