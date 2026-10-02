/**
 * Copies text to the clipboard with a textarea fallback for non-secure contexts.
 * @returns Whether the copy succeeded.
 */
export async function copyText(text: string): Promise<boolean> {
  if (typeof text !== "string" || text.length === 0) {
    return false;
  }

  try {
    if (typeof navigator !== "undefined" && navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to execCommand fallback */
  }

  if (typeof document === "undefined") {
    return false;
  }

  const helper = document.createElement("textarea");
  helper.value = text;
  helper.setAttribute("readonly", "");
  helper.style.position = "fixed";
  helper.style.left = "-9999px";
  document.body.appendChild(helper);
  helper.select();
  helper.setSelectionRange(0, text.length);

  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }

  document.body.removeChild(helper);
  return ok;
}
