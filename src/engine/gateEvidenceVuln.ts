// Intentionally vulnerable code for the gate-evidence exercise (CR-021).
// eval() of unsanitized input is arbitrary code execution (CWE-95) -
// CodeQL's default JS/TS query pack flags this. Removed before this
// branch is deleted; never merged.
export function runUserCode(code: string): unknown {
  return eval(code);
}
