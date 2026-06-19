// ── State ──────────────────────────────────────────────
let current     = '0';   // what's shown on display
let previous    = '';    // left-hand operand
let operator    = null;  // pending operator (÷ × − +)
let freshResult = false; // true right after = is pressed
let memory      = 0;     // memory store (MC / MR)
let isInv       = false; // INV toggle state
let angleMode   = 'deg'; // 'deg' or 'rad'

// ── DOM refs ──────────────────────────────────────────
const display    = document.getElementById('display');
const expression = document.getElementById('expression');

// ── Helpers ──────────────────────────────────────────

// Convert degrees → radians when needed
function toRad(val) {
  return angleMode === 'deg' ? val * Math.PI / 180 : val;
}

// Convert radians → degrees when displaying asin/acos/atan
function fromRad(val) {
  return angleMode === 'deg' ? val * 180 / Math.PI : val;
}

// Format a number cleanly (no JS float junk)
function fmt(n) {
  if (isNaN(n) || !isFinite(n)) return 'Error';
  const s = parseFloat(n.toPrecision(10)).toString();
  return s.length > 14 ? n.toExponential(6) : s;
}

// ── Mode controls ─────────────────────────────────────

function setMode(mode) {
  angleMode = mode;
  document.getElementById('btnDeg').classList.toggle('active', mode === 'deg');
  document.getElementById('btnRad').classList.toggle('active', mode === 'rad');
}

function toggleInv() {
  isInv = !isInv;
  document.getElementById('btnInv').classList.toggle('active', isInv);

  // Swap button labels between normal and inverse
  const swaps = {
    'btn-sqrt': ['√',   'x√y'],
    'btn-sq'  : ['x²',  'x³'],
    'btn-log' : ['log', '10ˣ'],
    'btn-ln'  : ['ln',  'eˣ'],
    'btn-sin' : ['sin', 'sin⁻¹'],
    'btn-cos' : ['cos', 'cos⁻¹'],
    'btn-tan' : ['tan', 'tan⁻¹'],
  };

  for (const [id, [normal, inverse]] of Object.entries(swaps)) {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = isInv ? inverse : normal;
      el.onclick = () => act(isInv ? inverse : normal);
    }
  }
}

// ── Binary compute ────────────────────────────────────

function compute(a, b, op) {
  const A = parseFloat(a);
  const B = parseFloat(b);
  switch (op) {
    case '+':   return A + B;
    case '−':   return A - B;
    case '×':   return A * B;
    case '÷':   return B !== 0 ? A / B : NaN;
    case 'x√y': return Math.pow(B, 1 / A);  // A-th root of B
    default:    return B;
  }
}

// ── Main action handler ───────────────────────────────

function act(value) {

  // ── Clear ──
  if (value === 'AC') {
    current = '0'; previous = ''; operator = null; freshResult = false;
    expression.textContent = '';
  }

  // ── Memory ──
  else if (value === 'MC') { memory = 0; }
  else if (value === 'MR') { current = String(memory); freshResult = true; }
  else if (value === 'M+') { memory += parseFloat(current); freshResult = true; }

  // ── Constants ──
  else if (value === 'π') { current = String(Math.PI); freshResult = true; }
  else if (value === 'e') { current = String(Math.E);  freshResult = true; }

  // ── Unary scientific functions ──
  else if (value === '%')    { current = fmt(parseFloat(current) / 100); }
  else if (value === 'x²')   { current = fmt(Math.pow(parseFloat(current), 2));  freshResult = true; }
  else if (value === 'x³')   { current = fmt(Math.pow(parseFloat(current), 3));  freshResult = true; }
  else if (value === '√')    { current = fmt(Math.sqrt(parseFloat(current)));     freshResult = true; }
  else if (value === 'log')  { current = fmt(Math.log10(parseFloat(current)));    freshResult = true; }
  else if (value === 'ln')   { current = fmt(Math.log(parseFloat(current)));      freshResult = true; }
  else if (value === '10ˣ')  { current = fmt(Math.pow(10, parseFloat(current)));  freshResult = true; }
  else if (value === 'eˣ')   { current = fmt(Math.exp(parseFloat(current)));      freshResult = true; }
  else if (value === 'sin')  { current = fmt(Math.sin(toRad(parseFloat(current)))); freshResult = true; }
  else if (value === 'cos')  { current = fmt(Math.cos(toRad(parseFloat(current)))); freshResult = true; }
  else if (value === 'tan')  { current = fmt(Math.tan(toRad(parseFloat(current)))); freshResult = true; }
  else if (value === 'sin⁻¹'){ current = fmt(fromRad(Math.asin(parseFloat(current)))); freshResult = true; }
  else if (value === 'cos⁻¹'){ current = fmt(fromRad(Math.acos(parseFloat(current)))); freshResult = true; }
  else if (value === 'tan⁻¹'){ current = fmt(fromRad(Math.atan(parseFloat(current)))); freshResult = true; }

  // ── Binary operators ──
  else if (['+','−','×','÷','x√y'].includes(value)) {
    if (operator && !freshResult) {
      const result = compute(previous, current, operator);
      previous = fmt(result); current = fmt(result);
    } else {
      previous = current;
    }
    operator    = value;
    freshResult = false;
    current     = '0';
    expression.textContent = previous + ' ' + value;
  }

  // ── Parentheses (passed to Function eval) ──
  else if (value === '(') {
    if (current === '0' || freshResult) { current = '('; freshResult = false; }
    else current += '(';
  }
  else if (value === ')') { current += ')'; }

  // ── Equals ──
  else if (value === '=') {
    if (operator) {
      const result = compute(previous, current, operator);
      expression.textContent = previous + ' ' + operator + ' ' + current + ' =';
      current  = fmt(result);
      operator = null; previous = ''; freshResult = true;
    } else {
      // No operator — try evaluating as expression (e.g. parenthesis chains)
      try {
        const result = Function('"use strict"; return (' + current + ')')();
        current  = fmt(result);
        freshResult = true;
      } catch (err) {
        current = 'Error';
      }
    }
  }

  // ── Decimal point ──
  else if (value === '.') {
    if (freshResult) { current = '0'; freshResult = false; }
    if (!current.includes('.')) current += '.';
  }

  // ── Digits ──
  else {
    if (current === '0' || freshResult) {
      current = value; freshResult = false;
    } else if (current.length < 15) {
      current += value;
    }
  }

  display.textContent = current;
}

// ── Keyboard support ──────────────────────────────────
document.addEventListener('keydown', (e) => {
  if (e.key >= '0' && e.key <= '9') act(e.key);
  else if (e.key === '.')      act('.');
  else if (e.key === '+')      act('+');
  else if (e.key === '-')      act('−');
  else if (e.key === '*')      act('×');
  else if (e.key === '/') { e.preventDefault(); act('÷'); }
  else if (e.key === 'Enter' || e.key === '=') act('=');
  else if (e.key === 'Escape') act('AC');
  else if (e.key === '(')      act('(');
  else if (e.key === ')')      act(')');
  else if (e.key === 'Backspace') {
    current = current.length > 1 ? current.slice(0, -1) : '0';
    display.textContent = current;
  }
});