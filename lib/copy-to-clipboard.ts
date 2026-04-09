/**
 * Clipboard write that still works when the browser tab or document is not focused
 * (e.g. game canvas, overlays). Falls back to execCommand when the Clipboard API refuses.
 */
export async function copyTextToClipboard(text: string): Promise<void> {
  try {
    if (typeof window !== "undefined") {
      window.focus();
    }
    await navigator.clipboard.writeText(text);
    return;
  } catch {
    /* fall through */
  }

  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  ta.style.top = "0";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  ta.setSelectionRange(0, text.length);
  const ok = document.execCommand("copy");
  document.body.removeChild(ta);
  if (!ok) {
    throw new Error(
      "Could not copy — click the page once, then try the button again.",
    );
  }
}
