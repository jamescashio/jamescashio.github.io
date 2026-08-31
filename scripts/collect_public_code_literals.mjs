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

function evaluate(node, scope, resolving = new Set()) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
    return { value: node.text, hasDynamicAlphaJoin: false };
  if (ts.isTemplateExpression(node)) {
    let value = node.head.text;
    let hasDynamicAlphaJoin = false;
    for (const span of node.templateSpans) {
      const resolved = evaluate(span.expression, scope, resolving);
      if (resolved === null) {
        const joinsAlphabeticFragments = /[A-Za-z]$/.test(value) && /^[A-Za-z]/.test(span.literal.text);
        hasDynamicAlphaJoin ||= joinsAlphabeticFragments;
        value += joinsAlphabeticFragments ? "" : " ";
      } else {
        value += resolved.value;
        hasDynamicAlphaJoin ||= resolved.hasDynamicAlphaJoin;
      }
      value += span.literal.text;
    }
    return { value, hasDynamicAlphaJoin };
  }
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    const left = evaluate(node.left, scope, resolving);
    const right = evaluate(node.right, scope, resolving);
    return left && right
      ? { value: left.value + right.value, hasDynamicAlphaJoin: left.hasDynamicAlphaJoin || right.hasDynamicAlphaJoin }
      : null;
  }
  if (ts.isParenthesizedExpression(node)) return evaluate(node.expression, scope, resolving);
  if (ts.isConditionalExpression(node)) {
    if (node.condition.kind === ts.SyntaxKind.TrueKeyword) return evaluate(node.whenTrue, scope, resolving);
    if (node.condition.kind === ts.SyntaxKind.FalseKeyword) return evaluate(node.whenFalse, scope, resolving);
    const whenTrue = evaluate(node.whenTrue, scope, resolving);
    const whenFalse = evaluate(node.whenFalse, scope, resolving);
    return whenTrue && whenFalse
      ? {
          value: `${whenTrue.value} ${whenFalse.value}`,
          hasDynamicAlphaJoin: whenTrue.hasDynamicAlphaJoin || whenFalse.hasDynamicAlphaJoin,
        }
      : null;
  }
  if (ts.isJsxExpression(node))
    return node.expression ? evaluate(node.expression, scope, resolving) : { value: "", hasDynamicAlphaJoin: false };
  if (ts.isJsxElement(node) || ts.isJsxFragment(node)) {
    const children = node.children
      .map(
        (child) =>
          evaluate(child, scope, resolving) ??
          (ts.isJsxText(child) ? { value: child.getText(), hasDynamicAlphaJoin: false } : null),
      )
      .filter(Boolean);
    return {
      value: children.map((child) => child.value).join(" "),
      hasDynamicAlphaJoin: children.some((child) => child.hasDynamicAlphaJoin),
    };
  }
  if (ts.isIdentifier(node)) {
    for (let current = scope; current; current = current.parent) {
      const binding = current.bindings.get(node.text);
      if (!binding) continue;
      if (resolving.has(binding)) return null;
      resolving.add(binding);
      const value = evaluate(binding.initializer, binding.scope, resolving);
      resolving.delete(binding);
      return value;
    }
  }
  return null;
}

function hasEvaluableParent(node, scope) {
  const parent = node.parent;
  return Boolean(parent && ts.isExpression(parent) && evaluate(parent, scope) !== null);
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
    const result = evaluate(node, scope);
    if (result !== null && !hasEvaluableParent(node, scope)) {
      results.push({
        file: path.normalize(filename),
        value: result.value,
        context: isClassProperty(node) ? "class" : "literal",
        hasDynamicAlphaJoin: result.hasDynamicAlphaJoin,
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
