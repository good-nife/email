import test from "node:test"
import assert from "node:assert/strict"
import { getClaudeModelCandidates, shouldRetryWithNextModel } from "./claude-models"

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
