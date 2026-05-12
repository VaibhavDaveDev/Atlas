import { Parser } from 'expr-eval-fork';

// Date utilities
export const formatDate = (date: Date, format: string = 'YYYY-MM-DD'): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day);
};

// Currency utilities
export const formatCurrency = (
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
};

// String utilities
export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const truncate = (text: string, length: number): string => {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

// Validation utilities
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s-()]+$/;
  return phoneRegex.test(phone);
};

// Array utilities
export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
};

// Number utilities
export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return (value / total) * 100;
};

export const roundToDecimal = (value: number, decimals: number = 2): number => {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

// ============================================
// Formula utilities (inlined from formula-evaluator.ts)
// ============================================

const ALLOWED_FUNCTIONS = ['sin', 'cos', 'tan', 'log', 'exp', 'sqrt', 'abs', 'ceil', 'floor', 'round'];
const MAX_FORMULA_LENGTH = 500;

/**
 * Validates formula string for security and sanity.
 * @throws Error if invalid
 */
const validateFormulaInput = (formula: string): void => {
  if (!formula || typeof formula !== 'string') {
    throw new Error('Formula must be a non-empty string');
  }

  if (formula.length > MAX_FORMULA_LENGTH) {
    throw new Error(`Formula too long (max ${MAX_FORMULA_LENGTH} characters)`);
  }

  // Basic syntax check - allowed characters (alphanumeric, spaces, basic operators, parens, dot, comma)
  if (!/^[a-zA-Z0-9\s\+\-\*\/\(\)\.,_]+$/.test(formula)) {
    throw new Error('Formula contains unauthorized characters');
  }

  // Count operators to limit complexity
  const operatorCount = (formula.match(/[\+\-\*\/]/g) || []).length;
  if (operatorCount > 50) {
    throw new Error('Formula too complex (too many operators)');
  }
};

/**
 * Evaluates a mathematical formula with a given context of variables.
 *
 * @param formula The string formula to evaluate (e.g., "BS * 0.4 + HRA")
 * @param context An object containing variable values (e.g., { BS: 5000, HRA: 2000 })
 * @returns The calculated result as a number
 * @throws Error if the formula is invalid or variables are missing
 */
export const evaluateFormula = (formula: string, context: Record<string, number>): number => {
  try {
    validateFormulaInput(formula);
    const parser = new Parser();

    // Whitelist functions
    parser.functions = {};
    ALLOWED_FUNCTIONS.forEach(fn => {
      parser.functions[fn] = (Parser as any).functions[fn];
    });

    const expr = parser.parse(formula);

    // Check for unauthorized identifiers (variables not in context and not in whitelisted functions)
    const variables = expr.variables();
    const contextKeys = Object.keys(context);
    for (const v of variables) {
      if (!contextKeys.includes(v) && !ALLOWED_FUNCTIONS.includes(v)) {
        throw new Error(`Unauthorized identifier: ${v}`);
      }
    }

    return expr.evaluate(context);
  } catch (error: any) {
    throw new Error(`Formula evaluation failed: ${error.message}`);
  }
};

/**
 * Validates a formula string to ensure it's syntactically correct and safe.
 *
 * @param formula The formula to validate
 * @returns boolean
 */
export const isValidFormula = (formula: string): boolean => {
  try {
    validateFormulaInput(formula);
    const parser = new Parser();
    parser.parse(formula);
    return true;
  } catch {
    return false;
  }
};
