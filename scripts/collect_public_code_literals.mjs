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

const SCAN_RESET = 0;
const SCAN_ALPHA = 1;
const SCAN_ALPHA_UNKNOWN = 2;
const SCAN_RISK = 3;
const SCAN_STATE_COUNT = 4;

const BLOCK_TEXT_TAGS = new Set([
  "address",
  "article",
  "aside",
  "blockquote",
  "div",
  "dl",
  "fieldset",
  "figcaption",
  "figure",
  "footer",
  "form",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "hr",
  "li",
  "main",
  "nav",
  "ol",
  "p",
  "pre",
  "section",
  "table",
  "ul",
]);

function mapRelation(step) {
  return Array.from({ length: SCAN_STATE_COUNT }, (_, state) => 1 << step(state));
}

function composeRelations(left, right) {
  return left.map((leftMask) => {
    let resultMask = 0;
    for (let state = 0; state < SCAN_STATE_COUNT; state += 1) {
      if (leftMask & (1 << state)) resultMask |= right[state];
    }
    return resultMask;
  });
}

function unionRelations(...relations) {
  return Array.from({ length: SCAN_STATE_COUNT }, (_, state) =>
    relations.reduce((mask, relation) => mask | relation[state], 0),
  );
}

function staticRelation(value) {
  let relation = mapRelation((state) => state);
  for (const character of value) {
    const alphabetic = /[A-Za-z]/.test(character);
    relation = composeRelations(
      relation,
      mapRelation((state) => {
        if (state === SCAN_RISK) return SCAN_RISK;
        if (!alphabetic) return SCAN_RESET;
        return state === SCAN_ALPHA_UNKNOWN ? SCAN_RISK : SCAN_ALPHA;
      }),
    );
  }
  return relation;
}

function result(value, relation) {
  return {
    value,
    relation,
    hasDynamicAlphaJoin: Boolean(relation[SCAN_RESET] & (1 << SCAN_RISK)),
  };
}

function staticValue(value) {
  return result(value, staticRelation(value));
}

function unknownValue() {
  return result(
    " ",
    mapRelation((state) => {
      if (state === SCAN_RISK) return SCAN_RISK;
      return state === SCAN_ALPHA || state === SCAN_ALPHA_UNKNOWN ? SCAN_ALPHA_UNKNOWN : SCAN_RESET;
    }),
  );
}

function concatenate(left, right) {
  return result(left.value + right.value, composeRelations(left.relation, right.relation));
}

function alternatives(...branches) {
  return result(
    branches.map((branch) => branch.value).join(" "),
    unionRelations(...branches.map((branch) => branch.relation)),
  );
}

function propertyNameText(name) {
  return ts.isIdentifier(name) || ts.isStringLiteral(name) ? name.text : null;
}

function jsxSourceTag(node) {
  const tag = ts.isJsxElement(node) ? node.openingElement.tagName : node.tagName;
  return ts.isIdentifier(tag) ? tag.text.toLowerCase() : null;
}

function jsxFactoryName(expression) {
  if (ts.isIdentifier(expression)) return expression.text;
  if (ts.isPropertyAccessExpression(expression)) return expression.name.text;
  return null;
}

function isJsxFactoryCall(node) {
  if (!ts.isCallExpression(node)) return false;
  return ["jsx", "jsxs", "jsxDEV"].includes(jsxFactoryName(node.expression));
}

function jsxFactoryTag(node) {
  if (!isJsxFactoryCall(node)) return null;
  const tag = node.arguments[0];
  return tag && (ts.isStringLiteral(tag) || ts.isNoSubstitutionTemplateLiteral(tag)) ? tag.text.toLowerCase() : null;
}

function isBlockTextNode(node) {
  if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
    return BLOCK_TEXT_TAGS.has(jsxSourceTag(node));
  }
  return isJsxFactoryCall(node) && BLOCK_TEXT_TAGS.has(jsxFactoryTag(node));
}

function isJsxChildrenArray(node) {
  const property = node.parent;
  if (!ts.isPropertyAssignment(property) || propertyNameText(property.name) !== "children") return false;
  const props = property.parent;
  const call = props.parent;
  return ts.isObjectLiteralExpression(props) && isJsxFactoryCall(call) && call.arguments[1] === props;
}

function jsxChildrenArrayCall(node) {
  return isJsxChildrenArray(node) ? node.parent.parent.parent : null;
}

function jsxFactoryHasVisualTextSeparation(call) {
  if (!call || !isJsxFactoryCall(call)) return false;
  const props = call.arguments[1];
  if (!props || !ts.isObjectLiteralExpression(props)) return false;
  const classProperty = props.properties.find(
    (property) => ts.isPropertyAssignment(property) && ["class", "className"].includes(propertyNameText(property.name)),
  );
  if (!classProperty || !ts.isPropertyAssignment(classProperty)) return false;
  const initializer = classProperty.initializer;
  if (!ts.isStringLiteral(initializer) && !ts.isNoSubstitutionTemplateLiteral(initializer)) return false;
  return /(?:^|\s)(?:gap(?:-[xy])?-[^\s]+|space-[xy]-[^\s]+)(?:\s|$)/.test(initializer.text);
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
  if (ts.isJsxSelfClosingElement(node)) return staticValue("");
  if (ts.isJsxElement(node) || ts.isJsxFragment(node)) {
    return node.children.reduce(
      (result, child) =>
        concatenate(result, isBlockTextNode(child) ? staticValue(" ") : evaluate(child, scope, resolving)),
      staticValue(""),
    );
  }
  if (ts.isArrayLiteralExpression(node)) {
    const preserveAdjacency = isJsxChildrenArray(node);
    if (!preserveAdjacency) return staticValue("");
    const separateChildren = jsxFactoryHasVisualTextSeparation(jsxChildrenArrayCall(node));
    return node.elements.reduce((result, element, index) => {
      const separated = separateChildren && index > 0 ? concatenate(result, staticValue(" ")) : result;
      return concatenate(separated, isBlockTextNode(element) ? staticValue(" ") : evaluate(element, scope, resolving));
    }, staticValue(""));
  }
  if (isJsxFactoryCall(node)) {
    const props = node.arguments[1];
    if (!props || !ts.isObjectLiteralExpression(props)) return staticValue("");
    const children = props.properties.find(
      (property) => ts.isPropertyAssignment(property) && propertyNameText(property.name) === "children",
    );
    return children && ts.isPropertyAssignment(children)
      ? evaluate(children.initializer, scope, resolving)
      : staticValue("");
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
  if (isJsxFactoryCall(node) && isBlockTextNode(node)) return false;
  const parent = node.parent;
  if (parent && ts.isArrayLiteralExpression(parent) && !isJsxChildrenArray(parent)) return false;
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
