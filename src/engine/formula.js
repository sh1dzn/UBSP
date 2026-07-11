// Безопасный парсер формул ЕППБ — без eval/new Function.
// Токенизатор + рекурсивный спуск (арифметика) и отдельный слой сравнений/логики для правил.

const FUNCTIONS = {
  pct(part, whole) {
    const w = toNum(whole);
    if (w <= 0) return 0;
    return Math.round(((toNum(part) / w) * 100) * 10) / 10;
  },
  min(a, b) {
    return Math.min(toNum(a), toNum(b));
  },
  max(a, b) {
    return Math.max(toNum(a), toNum(b));
  },
  round(a) {
    return Math.round(toNum(a));
  },
  annuity(principal, ratePercentYear, months) {
    const p = toNum(principal);
    const n = toNum(months);
    const ratePct = toNum(ratePercentYear);
    if (n <= 0) return 0;
    if (ratePct === 0) return p / n;
    const r = ratePct / 100 / 12;
    const factor = (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return p * factor;
  },
};

function toNum(v) {
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

// ---------- токенизатор ----------

const TOKEN_RE = /\s*(=>|<=|>=|==|!=|&&|\|\||[()+\-*/,<>]|[A-Za-z_][A-Za-z0-9_.]*|\d+(?:\.\d+)?)\s*/y;

function tokenize(expr) {
  const tokens = [];
  const src = String(expr || "");
  let pos = 0;
  TOKEN_RE.lastIndex = 0;
  while (pos < src.length) {
    TOKEN_RE.lastIndex = pos;
    const m = TOKEN_RE.exec(src);
    if (!m || m[0].length === 0) {
      // непонятный символ — пропускаем, чтобы не падать
      pos += 1;
      continue;
    }
    if (m[1] !== undefined) tokens.push(m[1]);
    pos = TOKEN_RE.lastIndex;
  }
  return tokens;
}

// ---------- парсер арифметики ----------
// grammar:
// expr    := term (('+' | '-') term)*
// term    := unary (('*' | '/') unary)*
// unary   := '-' unary | primary
// primary := number | call | ident | '(' expr ')'
// call    := ident '(' (expr (',' expr)*)? ')'

function createArithParser(tokens, ctx) {
  let i = 0;

  function peek() {
    return tokens[i];
  }
  function next() {
    return tokens[i++];
  }

  function parseExpr() {
    let value = parseTerm();
    while (peek() === "+" || peek() === "-") {
      const op = next();
      const rhs = parseTerm();
      value = op === "+" ? value + rhs : value - rhs;
    }
    return value;
  }

  function parseTerm() {
    let value = parseUnary();
    while (peek() === "*" || peek() === "/") {
      const op = next();
      const rhs = parseUnary();
      value = op === "*" ? value * rhs : rhs === 0 ? 0 : value / rhs;
    }
    return value;
  }

  function parseUnary() {
    if (peek() === "-") {
      next();
      return -parseUnary();
    }
    if (peek() === "+") {
      next();
      return parseUnary();
    }
    return parsePrimary();
  }

  function parsePrimary() {
    const tok = peek();
    if (tok === undefined) return 0;

    if (tok === "(") {
      next();
      const value = parseExpr();
      if (peek() === ")") next();
      return value;
    }

    if (/^\d+(\.\d+)?$/.test(tok)) {
      next();
      return parseFloat(tok);
    }

    if (/^[A-Za-z_][A-Za-z0-9_.]*$/.test(tok)) {
      next();
      if (peek() === "(") {
        // вызов функции
        next();
        const args = [];
        if (peek() !== ")") {
          args.push(parseExpr());
          while (peek() === ",") {
            next();
            args.push(parseExpr());
          }
        }
        if (peek() === ")") next();
        const fn = FUNCTIONS[tok];
        return typeof fn === "function" ? toNum(fn(...args)) : 0;
      }
      // идентификатор — значение из контекста
      return toNum(resolvePath(ctx, tok));
    }

    // неизвестный токен — пропускаем
    next();
    return 0;
  }

  return { parseExpr, tokens, get pos() { return i; }, set pos(v) { i = v; } };
}

function resolvePath(ctx, path) {
  if (!ctx) return 0;
  if (path in ctx) return ctx[path];
  const parts = path.split(".");
  let cur = ctx;
  for (const p of parts) {
    if (cur == null) return 0;
    cur = cur[p];
  }
  return cur;
}

export function evalFormula(expr, ctx) {
  try {
    const tokens = tokenize(expr);
    const parser = createArithParser(tokens, ctx || {});
    const value = parser.parseExpr();
    return Number.isFinite(value) ? value : 0;
  } catch (e) {
    return 0;
  }
}

// ---------- правила: сравнения + логика поверх арифметики ----------
// grammar:
// logicOr  := logicAnd ('||' logicAnd)*
// logicAnd := comparison ('&&' comparison)*
// comparison := arithExpr ((>=|<=|>|<|==|!=) arithExpr)?

function createRuleParser(tokens, ctx) {
  let i = 0;
  function peek() {
    return tokens[i];
  }
  function next() {
    return tokens[i++];
  }

  function parseArith() {
    const parser = createArithParser(tokens, ctx);
    parser.pos = i;
    const value = parser.parseExpr();
    i = parser.pos;
    return value;
  }

  function parseComparison() {
    const lhs = parseArith();
    const op = peek();
    if (["<=", ">=", "==", "!=", "<", ">"].includes(op)) {
      next();
      const rhs = parseArith();
      switch (op) {
        case ">=":
          return lhs >= rhs;
        case "<=":
          return lhs <= rhs;
        case ">":
          return lhs > rhs;
        case "<":
          return lhs < rhs;
        case "==":
          return lhs === rhs;
        case "!=":
          return lhs !== rhs;
        default:
          return false;
      }
    }
    return !!lhs;
  }

  function parseAnd() {
    let value = parseComparison();
    while (peek() === "&&") {
      next();
      const rhs = parseComparison();
      value = value && rhs;
    }
    return value;
  }

  function parseOr() {
    let value = parseAnd();
    while (peek() === "||") {
      next();
      const rhs = parseAnd();
      value = value || rhs;
    }
    return value;
  }

  return { parseOr };
}

export function evalRule(expr, ctx) {
  try {
    const tokens = tokenize(expr);
    const parser = createRuleParser(tokens, ctx || {});
    return !!parser.parseOr();
  } catch (e) {
    return false;
  }
}
