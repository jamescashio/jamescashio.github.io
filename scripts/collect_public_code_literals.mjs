#!/usr/bin/env node
// Emit only static public-facing literals, retaining a class-attribute context.
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

function isClassProperty(node) {
  for (let current = node; current.parent; current = current.parent) {
    const parent = current.parent;
    if (ts.isJsxAttribute(parent)) {
      return parent.name.text === "className" || parent.name.text === "class";
    }
    if (ts.isPropertyAssignment(parent) && parent.initializer === current) {
      const name = parent.name;
      return ts.isIdentifier(name) && (name.text === "className" || name.text === "class");
    }
    if (ts.isSourceFile(parent) || ts.isStatement(parent)) return false;
  }
  return false;
}

function literalValue(node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isTemplateExpression(node)) {
    let value = node.head.text;
    for (const span of node.templateSpans) {
      // A dynamic interpolation is a whitespace wildcard: it cannot join two
      // words, but it cannot conceal HOSTS ... ONLINE either.
      value += literalValue(span.expression) ?? " ";
      value += span.literal.text;
    }
    return value;
  }
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    const left = literalValue(node.left);
    const right = literalValue(node.right);
    return left !== null && right !== null ? left + right : null;
  }
  if (ts.isParenthesizedExpression(node)) return literalValue(node.expression);
  if (ts.isConditionalExpression(node)) {
    if (node.condition.kind === ts.SyntaxKind.TrueKeyword) return literalValue(node.whenTrue);
    if (node.condition.kind === ts.SyntaxKind.FalseKeyword) return literalValue(node.whenFalse);
    const whenTrue = literalValue(node.whenTrue);
    const whenFalse = literalValue(node.whenFalse);
    return whenTrue !== null && whenTrue === whenFalse ? whenTrue : null;
  }
  return null;
}

function hasEvaluableParent(node) {
  const parent = node.parent;
  return Boolean(parent && ts.isExpression(parent) && literalValue(parent) !== null);
}

const results = [];
for (const filename of process.argv.slice(2)) {
  const source = fs.readFileSync(filename, "utf8");
  const scriptKind = filename.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.JS;
  const file = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true, scriptKind);
  if (file.parseDiagnostics.length) {
    throw new Error(`unsupported or invalid source syntax in ${filename}`);
  }
  function visit(node) {
    const value = literalValue(node);
    if (value !== null && !hasEvaluableParent(node)) {
      results.push({ file: path.normalize(filename), value, context: isClassProperty(node) ? "class" : "literal" });
    }
    if (ts.isJsxText(node) && node.getText().trim()) {
      results.push({ file: path.normalize(filename), value: node.getText(), context: "visible" });
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
}
process.stdout.write(JSON.stringify(results));
