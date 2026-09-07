const test = require("node:test");
const assert = require("node:assert/strict");

const {
  addNamespaceComment,
  findNamespace,
  getIndexSummaries,
  parseIndexSummary,
  parseIndexValue,
  serializeIndexSummaries,
} = require("./content.js");

function createSummary(fields) {
  return {
    querySelectorAll() {
      return fields.map(([key, value]) => ({
        querySelector(selector) {
          const textContent = selector === ".index-summary-key" ? key : value;
          return { textContent };
        },
      }));
    },
  };
}

test("parses compound index field values", () => {
  const summary = createSummary([
    ["sku", " 1"],
    ["updatedAt", " -1"],
    ["isArchived", " 1"],
  ]);

  assert.deepEqual(
    { ...parseIndexSummary(summary) },
    { sku: 1, updatedAt: -1, isArchived: 1 }
  );
});

test("preserves named MongoDB index types", () => {
  assert.equal(parseIndexValue(" text"), "text");
  assert.equal(parseIndexValue(" 2dsphere"), "2dsphere");
});

test("serializes all indexes as an ordered JSON array", () => {
  const summaries = [
    createSummary([["_id", " 1"]]),
    createSummary([
      ["sku", " 1"],
      ["updatedAt", " -1"],
    ]),
  ];

  assert.equal(
    serializeIndexSummaries(summaries),
    JSON.stringify([{ _id: 1 }, { sku: 1, updatedAt: -1 }], null, 2)
  );
});

test("limits bulk operations to direct summaries in one card", () => {
  const firstSummary = { parentElement: null };
  const secondSummary = { parentElement: null };
  const nestedOtherCardSummary = { parentElement: {} };
  const container = {
    querySelectorAll() {
      return [firstSummary, secondSummary, nestedOtherCardSummary];
    },
  };
  firstSummary.parentElement = container;
  secondSummary.parentElement = container;

  assert.deepEqual(getIndexSummaries(container), [firstSummary, secondSummary]);
});

test("finds and normalizes the namespace from the card ancestor", () => {
  const namespace = { textContent: " demo_catalog.\n products " };
  const card = {
    parentElement: null,
    querySelector() {
      return namespace;
    },
  };
  const container = {
    parentElement: card,
    querySelector() {
      return null;
    },
  };

  assert.equal(findNamespace(container), "demo_catalog.products");
});

test("prepends the card namespace to copied JSON", () => {
  assert.equal(
    addNamespaceComment('{\n  "_id": 1\n}', "demo_catalog.products"),
    '// Namespace: demo_catalog.products\n{\n  "_id": 1\n}'
  );
});