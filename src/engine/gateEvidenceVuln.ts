// Intentionally vulnerable code for the gate-evidence exercise (CR-021).
// Reflected DOM XSS: untrusted location.search flows into innerHTML
// unsanitized (CWE-79). CodeQL's default JS/TS query pack traces this
// source->sink data flow (js/xss / js/unsafe-jquery-plugin family).
// Removed before this branch is deleted; never merged.
export function renderGreeting(el: HTMLElement): void {
  const name = new URLSearchParams(window.location.search).get("name");
  el.innerHTML = "Hello, " + name;
}
