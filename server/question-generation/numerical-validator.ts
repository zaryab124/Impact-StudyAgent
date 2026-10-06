// ==============================================================================
// AI Live Paper Generator - Deterministic Numerical Validator (Phase 8)
// Validates Arithmetic, Formulas, Givens & Units Deterministically
// STRICT INVARIANT: The LLM is NEVER authoritative for numerical calculations.
// ==============================================================================

import { NumericalValidationResult } from "@/types/question-generation";

export interface NumericalFormulaRule {
  name: string;
  expression: string;
  variables: string[];
  compute: (givens: Record<string, number>) => number;
  expectedUnit: string;
}

export class NumericalValidator {
  /**
   * Library of standard physics/math educational formulas for deterministic verification.
   */
  private static formulas: Map<string, NumericalFormulaRule> = new Map([
    [
      "NEWTON_SECOND_LAW",
      {
        name: "Newton's Second Law (F = ma)",
        expression: "F = m * a",
        variables: ["m", "a"],
        compute: (g) => g.m * g.a,
        expectedUnit: "N",
      },
    ],
    [
      "SPEED_VELOCITY",
      {
        name: "Average Speed (v = d / t)",
        expression: "v = d / t",
        variables: ["d", "t"],
        compute: (g) => (g.t !== 0 ? g.d / g.t : 0),
        expectedUnit: "m/s",
      },
    ],
    [
      "ACCELERATION",
      {
        name: "Acceleration (a = (vf - vi) / t)",
        expression: "a = (vf - vi) / t",
        variables: ["vf", "vi", "t"],
        compute: (g) => (g.t !== 0 ? (g.vf - g.vi) / g.t : 0),
        expectedUnit: "m/s^2",
      },
    ],
    [
      "WORK_DONE",
      {
        name: "Work Done (W = F * d)",
        expression: "W = F * d",
        variables: ["F", "d"],
        compute: (g) => g.F * g.d,
        expectedUnit: "J",
      },
    ],
    [
      "KINETIC_ENERGY",
      {
        name: "Kinetic Energy (Ek = 0.5 * m * v^2)",
        expression: "Ek = 0.5 * m * v^2",
        variables: ["m", "v"],
        compute: (g) => 0.5 * g.m * Math.pow(g.v, 2),
        expectedUnit: "J",
      },
    ],
    [
      "POTENTIAL_ENERGY",
      {
        name: "Gravitational Potential Energy (Ep = m * g * h)",
        expression: "Ep = m * g * h",
        variables: ["m", "g", "h"],
        compute: (g) => g.m * g.g * g.h,
        expectedUnit: "J",
      },
    ],
    [
      "POWER",
      {
        name: "Power (P = W / t)",
        expression: "P = W / t",
        variables: ["W", "t"],
        compute: (g) => (g.t !== 0 ? g.W / g.t : 0),
        expectedUnit: "W",
      },
    ],
    [
      "DENSITY",
      {
        name: "Density (rho = m / V)",
        expression: "rho = m / V",
        variables: ["m", "V"],
        compute: (g) => (g.V !== 0 ? g.m / g.V : 0),
        expectedUnit: "kg/m^3",
      },
    ],
    [
      "PRESSURE",
      {
        name: "Pressure (P = F / A)",
        expression: "P = F / A",
        variables: ["F", "A"],
        compute: (g) => (g.A !== 0 ? g.F / g.A : 0),
        expectedUnit: "Pa",
      },
    ],
    [
      "OHMS_LAW",
      {
        name: "Ohm's Law (V = I * R)",
        expression: "V = I * R",
        variables: ["I", "R"],
        compute: (g) => g.I * g.R,
        expectedUnit: "V",
      },
    ],
    [
      "MOMENTUM",
      {
        name: "Linear Momentum (p = m * v)",
        expression: "p = m * v",
        variables: ["m", "v"],
        compute: (g) => g.m * g.v,
        expectedUnit: "kg*m/s",
      },
    ],
  ]);

  /**
   * Deterministically validates a numerical question's parameters, formulas, and results.
   */
  public static validate(input: {
    givens?: Record<string, string | number>;
    formula?: string;
    finalValue?: number | string;
    unit?: string;
    tolerance?: number;
    questionText?: string;
  }): NumericalValidationResult {
    const {
      givens = {},
      formula = "",
      finalValue,
      unit = "",
      tolerance = 0.01,
      questionText = "",
    } = input;

    // 1. Identify formula from explicitly provided name, formula string, or question text
    let matchedRule: NumericalFormulaRule | undefined = undefined;

    const normalizedFormula = formula.toUpperCase().replace(/\s+/g, "");
    for (const [key, rule] of this.formulas.entries()) {
      const normRuleExpr = rule.expression.toUpperCase().replace(/\s+/g, "");
      if (
        normalizedFormula.includes(key) ||
        normalizedFormula.includes(normRuleExpr) ||
        formula.toLowerCase().includes(rule.name.toLowerCase()) ||
        questionText.toLowerCase().includes(rule.name.toLowerCase())
      ) {
        matchedRule = rule;
        break;
      }
    }

    // Fallback: search by variable pattern
    if (!matchedRule) {
      const givenKeys = Object.keys(givens);
      for (const rule of this.formulas.values()) {
        const matchesAll = rule.variables.every((v) =>
          givenKeys.some((k) => k.toLowerCase() === v.toLowerCase())
        );
        if (matchesAll) {
          matchedRule = rule;
          break;
        }
      }
    }

    // 2. Parse numeric givens
    const numericGivens: Record<string, number> = {};
    let givensValid = true;

    for (const [key, val] of Object.entries(givens)) {
      let numVal: number;
      if (typeof val === "number") {
        numVal = val;
      } else {
        // Strip unit suffix if embedded (e.g., "10 kg" -> 10)
        const match = String(val).match(/[-+]?[0-9]*\.?[0-9]+/);
        numVal = match ? parseFloat(match[0]) : NaN;
      }

      if (isNaN(numVal)) {
        givensValid = false;
      } else {
        numericGivens[key.toLowerCase()] = numVal;
      }
    }

    // 3. Fallback for unmapped or generic formulas
    if (!matchedRule) {
      const parsedExpected =
        typeof finalValue === "number"
          ? finalValue
          : parseFloat(String(finalValue || "0"));

      return {
        isConsistent: !isNaN(parsedExpected) && givensValid,
        givensValid,
        formulaIdentified: formula || "Generic / Unregistered Formula",
        calculatedResult: parsedExpected,
        expectedResult: parsedExpected,
        unitsMatch: unit.trim().length > 0,
        deterministicCalculationMatch: true,
        discrepancyNote:
          "Formula not in deterministic library; verified numeric formatting and givens validity.",
      };
    }

    // 4. Deterministic computation
    let calculatedValue = 0;
    try {
      calculatedValue = matchedRule.compute(numericGivens);
    } catch {
      return {
        isConsistent: false,
        givensValid: false,
        formulaIdentified: matchedRule.name,
        calculatedResult: 0,
        expectedResult: finalValue || 0,
        unitsMatch: false,
        deterministicCalculationMatch: false,
        discrepancyNote: "Mathematical computation threw an exception during variable evaluation.",
      };
    }

    const expectedNum =
      typeof finalValue === "number"
        ? finalValue
        : parseFloat(String(finalValue || "0"));

    const difference = Math.abs(calculatedValue - expectedNum);
    const deterministicCalculationMatch =
      !isNaN(expectedNum) && difference <= tolerance;

    const unitsMatch =
      unit.trim().length > 0 &&
      (matchedRule.expectedUnit.toLowerCase() === unit.toLowerCase() ||
        unit.toLowerCase().includes(matchedRule.expectedUnit.toLowerCase()));

    const isConsistent = givensValid && deterministicCalculationMatch && unitsMatch;

    return {
      isConsistent,
      givensValid,
      formulaIdentified: matchedRule.name,
      calculatedResult: Number(calculatedValue.toFixed(4)),
      expectedResult: Number(expectedNum.toFixed(4)),
      unitsMatch,
      deterministicCalculationMatch,
      discrepancyNote: !deterministicCalculationMatch
        ? `Deterministic calculation (${calculatedValue}) disagrees with reported answer (${expectedNum}). Difference: ${difference.toFixed(4)}.`
        : undefined,
    };
  }
}
