export const verdictJsonSchema = {
    type: "object",
    additionalProperties: false,
    required: ["result", "oneLine", "reasoning", "penalties", "faultRatio", "lawRefs", "intensity"],
    properties: {
      result: { type: "string", enum: ["GUILTY", "NOT_GUILTY", "BOTH_AT_FAULT", "SETTLEMENT"] },
      intensity: { type: "string", enum: ["low", "mid", "high"] },
      lawRefs: {
        type: "array",
        minItems: 1,
        maxItems: 3,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["id", "category"],
          properties: { id: { type: "string" }, category: { type: "string" } }
        }
      },
      oneLine: { type: "string" },
      reasoning: { type: "string" },
      penalties: {
        type: "object",
        additionalProperties: false,
        required: ["serious", "funny"],
        properties: {
          serious: {
            type: "array",
            minItems: 1,
            maxItems: 3,
            items: { type: "string" }
          },
          funny: {
            type: "array",
            minItems: 1,
            maxItems: 3,
            items: { type: "string" }
          }
        }
      },
      faultRatio: {
        type: "object",
        additionalProperties: false,
        required: ["plaintiff", "defendant"],
        properties: {
          plaintiff: { type: "integer", minimum: 0, maximum: 100 },
          defendant: { type: "integer", minimum: 0, maximum: 100 }
        }
      }
    }
  };