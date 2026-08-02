/**
 * Messenger (unlike WhatsApp's wa.me?text=) has no supported way to
 * pre-fill what a visitor's message says — m.me links can only open a
 * chat, not type into it for them. The honest, reliable workaround: copy
 * the order text to their clipboard and tell them to paste it in.
 */
export function buildMessengerUrl(username) {
  return `https://m.me/${username}`;
}

/** Returns true if the copy succeeded (so the UI can show the right instruction). */
export async function copyAndOpenMessenger(message, username) {
  let copied = false;
  try {
    await navigator.clipboard.writeText(message);
    copied = true;
  } catch {
    copied = false;
  }
  window.open(buildMessengerUrl(username), "_blank", "noopener,noreferrer");
  return copied;
}
