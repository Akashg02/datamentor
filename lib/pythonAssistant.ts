export interface RepairSuggestion {
  fixedCode: string;
  explanation: string;
  confidence: "high" | "medium" | "low";
}

const COMMON_FIXES: Array<{
  pattern: RegExp;
  fix: (code: string, match: RegExpMatchArray) => RepairSuggestion;
}> = [
  {
    pattern: /ModuleNotFoundError: No module named '(\w+)'/,
    fix: (code, match) => ({
      fixedCode: `import ${match[1]}\n` + code,
      explanation: `Added missing import for '${match[1]}'.`,
      confidence: "high",
    }),
  },
  {
    pattern: /NameError: name '(\w+)' is not defined/,
    fix: (code, match) => ({
      fixedCode: code,
      explanation: `Variable '${match[1]}' is not defined. Make sure previous cells have been run.`,
      confidence: "medium",
    }),
  },
  {
    pattern: /TypeError: unsupported operand type/,
    fix: (code) => ({
      fixedCode: code.replace(/(\w+)\s*\+\s*(\w+)/g, "float($1) + float($2)"),
      explanation: "Attempted to cast operands to float to resolve type mismatch.",
      confidence: "low",
    }),
  },
  {
    pattern: /ValueError: could not convert string to float/,
    fix: (code) => ({
      fixedCode: code.replace(/pd\.to_numeric\(([^)]+)\)/g, "pd.to_numeric($1, errors='coerce')"),
      explanation: "Added errors='coerce' to pd.to_numeric to handle non-numeric strings.",
      confidence: "high",
    }),
  },
  {
    pattern: /KeyError: '(\w+)'/,
    fix: (code, match) => ({
      fixedCode: code,
      explanation: `Column '${match[1]}' not found in DataFrame. Check the column name using df.columns.`,
      confidence: "medium",
    }),
  },
];

export function repairCode(code: string, errorOutput: string): RepairSuggestion | null {
  for (const { pattern, fix } of COMMON_FIXES) {
    const match = errorOutput.match(pattern);
    if (match) return fix(code, match);
  }
  return null;
}
