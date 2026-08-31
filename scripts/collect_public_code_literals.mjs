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

function staticValue(value) {
  return {
    value,
    hasDynamicAlphaJoin: false,
    canBeEmpty: value.length === 0,
    startsAlpha: /^[A-Za-z]/.test(value),
    endsAlpha: /[A-Za-z]$/.test(value),
    startsUnknown: false,
    endsUnknown: false,
  };
}

function unknownValue() {
  return {
    value: " ",
    hasDynamicAlphaJoin: false,
    canBeEmpty: true,
    startsAlpha: false,
    endsAlpha: false,
    startsUnknown: true,
    endsUnknown: true,
  };
}

function concatenate(left, right) {
  return {
    value: left.value + right.value,
    hasDynamicAlphaJoin:
      left.hasDynamicAlphaJoin ||
      right.hasDynamicAlphaJoin ||
      (left.endsUnknown && right.startsAlpha) ||
      (left.endsAlpha && right.startsUnknown),
    canBeEmpty: left.canBeEmpty && right.canBeEmpty,
    startsAlpha: left.startsAlpha || (left.canBeEmpty && right.startsAlpha),
    endsAlpha: right.endsAlpha || (right.canBeEmpty && left.endsAlpha),
    startsUnknown: left.startsUnknown || (left.canBeEmpty && right.startsUnknown),
    endsUnknown: right.endsUnknown || (right.canBeEmpty && left.endsUnknown),
  };
}

function alternatives(...branches) {
  return {
    value: branches.map((branch) => branch.value).join(" "),
    hasDynamicAlphaJoin: branches.some((branch) => branch.hasDynamicAlphaJoin),
    canBeEmpty: branches.some((branch) => branch.canBeEmpty),
    startsAlpha: branches.some((branch) => branch.startsAlpha),
    endsAlpha: branches.some((branch) => branch.endsAlpha),
    startsUnknown: branches.some((branch) => branch.startsUnknown),
    endsUnknown: branches.some((branch) => branch.endsUnknown),
  };
}

function evaluate(node, scope, resolving = new Set()) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return staticValue(node.text);
  if (ts.isJsxText(node)) return staticValue(node.getFullText());
  if (ts.isTemplateExpression(node)) {
    let result = staticValue(node.head.text);
    for (const span of node.templateSpans) {
      result = concatenate(result, evaluate(span.expression, scope, resolving));
      result = concatenate(result, staticValue(span.literal.text));
    }
    return result;
  }
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    const left = evaluate(node.left, scope, resolving);
    const right = evaluate(node.right, scope, resolving);
    return concatenate(left, right);
  }
  if (ts.isParenthesizedExpression(node)) return evaluate(node.expression, scope, resolving);
  if (ts.isConditionalExpression(node)) {
    if (node.condition.kind === ts.SyntaxKind.TrueKeyword) return evaluate(node.whenTrue, scope, resolving);
    if (node.condition.kind === ts.SyntaxKind.FalseKeyword) return evaluate(node.whenFalse, scope, resolving);
    const whenTrue = evaluate(node.whenTrue, scope, resolving);
    const whenFalse = evaluate(node.whenFalse, scope, resolving);
    return alternatives(whenTrue, whenFalse);
  }
  if (ts.isJsxExpression(node)) return node.expression ? evaluate(node.expression, scope, resolving) : staticValue("");
  if (ts.isJsxElement(node) || ts.isJsxFragment(node)) {
    return node.children.reduce(
      (result, child) =>
        concatenate(
          result,
          ts.isJsxElement(child) || ts.isJsxFragment(child) || ts.isJsxSelfClosingElement(child)
            ? staticValue(" ")
            : evaluate(child, scope, resolving),
        ),
      staticValue(""),
    );
  }
  if (ts.isIdentifier(node)) {
    for (let current = scope; current; current = current.parent) {
      const binding = current.bindings.get(node.text);
      if (!binding) continue;
      if (resolving.has(binding)) return unknownValue();
      resolving.add(binding);
      const value = evaluate(binding.initializer, binding.scope, resolving);
      resolving.delete(binding);
      return value;
    }
  }
  return unknownValue();
}

function hasEvaluableParent(node, scope) {
  if (ts.isJsxElement(node) || ts.isJsxFragment(node)) return false;
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
    if ((result.value.trim() || result.hasDynamicAlphaJoin) && !hasEvaluableParent(node, scope)) {
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
