import test from "node:test"
import assert from "node:assert/strict"
import { getClaudeModelCandidates, shouldRetryWithNextModel } from "./claude-models"
import { tryParseJSON } from "./json-repair"

test("prefers configured Anthropic model and falls back to known alternatives", () => {
  assert.deepEqual(getClaudeModelCandidates({ ANTHROPIC_MODEL: "custom-model" }), [
    "custom-model",
    "claude-haiku-4-5-20251001",
    "claude-sonnet-4-6",
  ])

  assert.deepEqual(getClaudeModelCandidates({}), [
    "claude-haiku-4-5-20251001",
    "claude-sonnet-4-6",
  ])
})

test("retries when Anthropic reports an unavailable or invalid model", () => {
  assert.equal(shouldRetryWithNextModel({ status: 400, message: "model not found" }), true)
  assert.equal(shouldRetryWithNextModel({ status: 404, message: "The model does not exist" }), true)
  assert.equal(shouldRetryWithNextModel({ status: 422, message: "Invalid model" }), true)
  assert.equal(shouldRetryWithNextModel({ status: 429, message: "Rate limit exceeded" }), false)
})

test("repairs fenced or truncated JSON from Claude", () => {
  const fenced = '```json\n{"categories":["Work"],"assignments":[{"index":0,"category":"Work","tags":["follow-up"]}]}\n```'
  const truncated = '{"categories":["Billing"],"assignments":[{"index":0,"category":"Billing","tags":["invoice"]}'

  assert.deepEqual(tryParseJSON(fenced, { categories: [], assignments: [] }), {
    categories: ["Work"],
    assignments: [{ index: 0, category: "Work", tags: ["follow-up"] }],
  })

  assert.deepEqual(tryParseJSON(truncated, { categories: [], assignments: [] }), {
    categories: ["Billing"],
    assignments: [{ index: 0, category: "Billing", tags: ["invoice"] }],
  })
})
