import test from "node:test"
import assert from "node:assert/strict"
import { getClaudeModelCandidates, shouldRetryWithNextModel } from "./claude-models"

test("prefers configured Anthropic model and falls back to known alternatives", () => {
  assert.deepEqual(getClaudeModelCandidates({ ANTHROPIC_MODEL: "custom-model" }), [
    "custom-model",
    "claude-3-7-sonnet-latest",
    "claude-3-5-sonnet-latest",
    "claude-sonnet-4-5",
  ])

  assert.deepEqual(getClaudeModelCandidates({}), [
    "claude-3-7-sonnet-latest",
    "claude-3-5-sonnet-latest",
    "claude-sonnet-4-5",
  ])
})

test("retries when Anthropic reports an unavailable or invalid model", () => {
  assert.equal(shouldRetryWithNextModel({ status: 400, message: "model not found" }), true)
  assert.equal(shouldRetryWithNextModel({ status: 404, message: "The model does not exist" }), true)
  assert.equal(shouldRetryWithNextModel({ status: 422, message: "Invalid model" }), true)
  assert.equal(shouldRetryWithNextModel({ status: 429, message: "Rate limit exceeded" }), false)
})
