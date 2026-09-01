#!/usr/bin/env node
// Emit only static public-facing literals, retaining a class-attribute context.
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

function isClassProperty(node) {
  if (ts.isJsxAttribute(node)) return node.name.text === "className" || node.name.text === "class";
  if (ts.isPropertyAssignment(node)) {
    const name = node.name;
    return ts.isIdentifier(name) && (name.text === "className" || name.text === "class");
  }
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

function result(value, relation, supported = true) {
  return {
    value,
    relation,
    supported,
    hasDynamicAlphaJoin: Boolean(relation[SCAN_RESET] & (1 << SCAN_RISK)),
  };
}

function staticValue(value) {
  return result(value, staticRelation(value));
}

function unknownValue(supported = true) {
  return result(
    " ",
    mapRelation((state) => {
      if (state === SCAN_RISK) return SCAN_RISK;
      return state === SCAN_ALPHA || state === SCAN_ALPHA_UNKNOWN ? SCAN_ALPHA_UNKNOWN : SCAN_RESET;
    }),
    supported,
  );
}

function concatenate(left, right) {
  return result(
    left.value + right.value,
    composeRelations(left.relation, right.relation),
    left.supported && right.supported,
  );
}

function alternatives(...branches) {
  return result(
    branches.map((branch) => branch.value).join(" "),
    unionRelations(...branches.map((branch) => branch.relation)),
    branches.every((branch) => branch.supported),
  );
}

function unsupportedValue(node, scope, resolving) {
  const branches = [unknownValue()];
  ts.forEachChild(node, (child) => {
    if (ts.isExpression(child)) {
      branches.push(
        ts.isCallExpression(node) && ts.isArrayLiteralExpression(child)
          ? renderedArrayValue(child, scope, resolving, false)
          : evaluate(child, scope, resolving),
      );
    }
  });
  const combined = alternatives(...branches);
  return result(combined.value, combined.relation, false);
}

function renderedArrayValue(node, scope, resolving, separateChildren) {
  return node.elements.reduce((combined, element, index) => {
    const separated = separateChildren && index > 0 ? concatenate(combined, staticValue(" ")) : combined;
    if (ts.isArrayLiteralExpression(element)) {
      return concatenate(separated, renderedArrayValue(element, scope, resolving, separateChildren));
    }
    return concatenate(separated, isBlockTextNode(element) ? staticValue(" ") : evaluate(element, scope, resolving));
  }, staticValue(""));
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
  if (ts.isElementAccessExpression(expression)) {
    const argument = expression.argumentExpression;
    if (argument && (ts.isStringLiteral(argument) || ts.isNoSubstitutionTemplateLiteral(argument))) {
      return argument.text;
    }
  }
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

function isDirectJsxChildrenArray(node) {
  const property = node.parent;
  if (!ts.isPropertyAssignment(property) || propertyNameText(property.name) !== "children") return false;
  const props = property.parent;
  const call = props.parent;
  return ts.isObjectLiteralExpression(props) && isJsxFactoryCall(call) && call.arguments[1] === props;
}

function jsxChildrenArrayRoot(node) {
  let root = node;
  while (ts.isArrayLiteralExpression(root.parent)) root = root.parent;
  return isDirectJsxChildrenArray(root) ? root : null;
}

function isJsxChildrenArray(node) {
  return Boolean(jsxChildrenArrayRoot(node));
}

function jsxChildrenArrayCall(node) {
  const root = jsxChildrenArrayRoot(node);
  return root ? root.parent.parent.parent : null;
}

function jsxFactoryHasVisualTextSeparation(call) {
  if (!call || !isJsxFactoryCall(call)) return false;
  const props = call.arguments[1];
  if (!props || !ts.isObjectLiteralExpression(props)) return false;
  return jsxPropsHaveVisualTextSeparation(props);
}

function jsxPropsHaveVisualTextSeparation(props) {
  const classProperty = props.properties.find(
    (property) => ts.isPropertyAssignment(property) && ["class", "className"].includes(propertyNameText(property.name)),
  );
  if (!classProperty || !ts.isPropertyAssignment(classProperty)) return false;
  const initializer = classProperty.initializer;
  if (!ts.isStringLiteral(initializer) && !ts.isNoSubstitutionTemplateLiteral(initializer)) return false;
  return /(?:^|\s)(?:gap(?:-[xy])?-[^\s]+|space-[xy]-[^\s]+)(?:\s|$)/.test(initializer.text);
}

function resolveObjectLiteral(node, scope, resolving) {
  if (ts.isObjectLiteralExpression(node)) return { node, scope };
  if (ts.isParenthesizedExpression(node)) return resolveObjectLiteral(node.expression, scope, resolving);
  if (!ts.isIdentifier(node)) return null;
  for (let current = scope; current; current = current.parent) {
    const binding = current.bindings.get(node.text);
    if (!binding) continue;
    if (resolving.has(binding)) return null;
    resolving.add(binding);
    const resolved = resolveObjectLiteral(binding.initializer, binding.scope, resolving);
    resolving.delete(binding);
    return resolved;
  }
  return null;
}

function jsxPropsChildrenValue(props, scope, resolving, seenProps = new Set()) {
  if (seenProps.has(props)) return unknownValue(false);
  seenProps.add(props);
  const branches = [];
  for (const property of props.properties) {
    if (ts.isPropertyAssignment(property) && propertyNameText(property.name) === "children") {
      branches.push(
        ts.isArrayLiteralExpression(property.initializer)
          ? renderedArrayValue(property.initializer, scope, resolving, jsxPropsHaveVisualTextSeparation(props))
          : evaluate(property.initializer, scope, resolving),
      );
      continue;
    }
    if (ts.isSpreadAssignment(property)) {
      const spread = resolveObjectLiteral(property.expression, scope, resolving);
      branches.push(
        spread
          ? jsxPropsChildrenValue(spread.node, spread.scope, resolving, seenProps)
          : unsupportedValue(property.expression, scope, resolving),
      );
    }
  }
  seenProps.delete(props);
  return branches.length ? alternatives(...branches) : staticValue("");
}

function nestedObjectLiterals(node, scope, resolving, found = [], seen = new Set()) {
  if (seen.has(node)) return found;
  seen.add(node);
  if (ts.isObjectLiteralExpression(node)) {
    found.push({ node, scope });
    return found;
  }
  if (ts.isIdentifier(node)) {
    for (let current = scope; current; current = current.parent) {
      const binding = current.bindings.get(node.text);
      if (!binding) continue;
      if (resolving.has(binding)) return found;
      resolving.add(binding);
      nestedObjectLiterals(binding.initializer, binding.scope, resolving, found, seen);
      resolving.delete(binding);
      return found;
    }
    return found;
  }
  ts.forEachChild(node, (child) => {
    if (ts.isExpression(child) && !(ts.isCallExpression(node) && child === node.expression)) {
      nestedObjectLiterals(child, scope, resolving, found, seen);
    }
  });
  return found;
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
    return renderedArrayValue(node, scope, resolving, separateChildren);
  }
  if (isJsxFactoryCall(node)) {
    const props = node.arguments[1];
    if (!props || props.kind === ts.SyntaxKind.NullKeyword) return staticValue("");
    const resolved = resolveObjectLiteral(props, scope, resolving);
    if (!resolved) {
      const candidates = nestedObjectLiterals(props, scope, resolving);
      if (!candidates.length) return unsupportedValue(props, scope, resolving);
      const retained = alternatives(
        ...candidates.map((candidate) => jsxPropsChildrenValue(candidate.node, candidate.scope, resolving)),
      );
      return result(retained.value, retained.relation, false);
    }
    return jsxPropsChildrenValue(resolved.node, resolved.scope, resolving);
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
    return unknownValue();
  }
  return unsupportedValue(node, scope, resolving);
}

function hasEvaluableParent(node, scope) {
  if (ts.isJsxElement(node) || ts.isJsxFragment(node)) return false;
  if (isJsxFactoryCall(node) && isBlockTextNode(node)) return false;
  const parent = node.parent;
  if (parent && ts.isArrayLiteralExpression(parent) && !isJsxChildrenArray(parent)) return false;
  return Boolean(parent && ts.isExpression(parent) && evaluate(parent, scope).supported);
}

const results = [];
for (const filename of process.argv.slice(2)) {
  const source = fs.readFileSync(filename, "utf8");
  const scriptKind = filename.endsWith(".tsx")
    ? ts.ScriptKind.TSX
    : filename.endsWith(".ts")
      ? ts.ScriptKind.TS
      : ts.ScriptKind.JS;
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
