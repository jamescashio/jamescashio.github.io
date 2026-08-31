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

function literalValue(node, scope, resolving = new Set()) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isTemplateExpression(node)) {
    let value = node.head.text;
    for (const span of node.templateSpans) {
      // A dynamic interpolation is a whitespace wildcard: it cannot join two
      // words, but it cannot conceal HOSTS ... ONLINE either.
      const resolved = literalValue(span.expression, scope, resolving);
      if (resolved === null) {
        const joinsAlphabeticFragments = /[A-Za-z]$/.test(value) && /^[A-Za-z]/.test(span.literal.text);
        const hasStatusMarker = /\b(?:current|online|status)\b/i.test(value + span.literal.text);
        value += joinsAlphabeticFragments && hasStatusMarker ? "" : " ";
      } else {
        value += resolved;
      }
      value += span.literal.text;
    }
    return value;
  }
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    const left = literalValue(node.left, scope, resolving);
    const right = literalValue(node.right, scope, resolving);
    return left !== null && right !== null ? left + right : null;
  }
  if (ts.isParenthesizedExpression(node)) return literalValue(node.expression, scope, resolving);
  if (ts.isConditionalExpression(node)) {
    if (node.condition.kind === ts.SyntaxKind.TrueKeyword) return literalValue(node.whenTrue, scope, resolving);
    if (node.condition.kind === ts.SyntaxKind.FalseKeyword) return literalValue(node.whenFalse, scope, resolving);
    const whenTrue = literalValue(node.whenTrue, scope, resolving);
    const whenFalse = literalValue(node.whenFalse, scope, resolving);
    return whenTrue !== null && whenTrue === whenFalse ? whenTrue : null;
  }
  if (ts.isIdentifier(node)) {
    for (let current = scope; current; current = current.parent) {
      const binding = current.bindings.get(node.text);
      if (!binding) continue;
      if (resolving.has(binding)) return null;
      resolving.add(binding);
      const value = literalValue(binding.initializer, binding.scope, resolving);
      resolving.delete(binding);
      return value;
    }
  }
  return null;
}

function hasEvaluableParent(node, scope) {
  const parent = node.parent;
  return Boolean(parent && ts.isExpression(parent) && literalValue(parent, scope) !== null);
}

function hasDynamicAlphaJoin(node, scope) {
  if (ts.isTemplateExpression(node)) {
    let left = node.head.text;
    for (const span of node.templateSpans) {
      const unresolved = literalValue(span.expression, scope) === null;
      if (unresolved && /[A-Za-z]$/.test(left) && /^[A-Za-z]/.test(span.literal.text)) return true;
      if (hasDynamicAlphaJoin(span.expression, scope)) return true;
      left += (unresolved ? " " : literalValue(span.expression, scope)) + span.literal.text;
    }
  }
  if (ts.isBinaryExpression(node) || ts.isConditionalExpression(node)) {
    return ts.forEachChild(node, (child) => hasDynamicAlphaJoin(child, scope)) ?? false;
  }
  return false;
}

const results = [];
for (const filename of process.argv.slice(2)) {
  const source = fs.readFileSync(filename, "utf8");
  const scriptKind = filename.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.JS;
  const file = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true, scriptKind);
  if (file.parseDiagnostics.length) {
    throw new Error(`unsupported or invalid source syntax in ${filename}`);
  }
  const scopeFor = new WeakMap();
  const rootScope = { parent: null, bindings: new Map() };
  function indexScopes(node, scope) {
    let active = scope;
    if (node !== file && (ts.isBlock(node) || ts.isFunctionLike(node))) {
      active = { parent: scope, bindings: new Map() };
    }
    scopeFor.set(node, active);
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      const list = node.parent;
      if (ts.isVariableDeclarationList(list) && list.flags & ts.NodeFlags.Const) {
        active.bindings.set(node.name.text, { initializer: node.initializer, scope: active });
      }
    }
    ts.forEachChild(node, (child) => indexScopes(child, active));
  }
  indexScopes(file, rootScope);
  function visit(node) {
    const scope = scopeFor.get(node) ?? rootScope;
    const value = literalValue(node, scope);
    if (value !== null && !hasEvaluableParent(node, scope)) {
      results.push({
        file: path.normalize(filename),
        value,
        context: isClassProperty(node) ? "class" : "literal",
        hasDynamicAlphaJoin: hasDynamicAlphaJoin(node, scope),
      });
    }
    if (ts.isJsxText(node) && node.getText().trim()) {
      results.push({
        file: path.normalize(filename),
        value: node.getText(),
        context: "visible",
        hasDynamicAlphaJoin: false,
      });
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
}
process.stdout.write(JSON.stringify(results));
