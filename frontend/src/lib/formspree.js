// ============================================================
// FORMSPREE CONFIG — the only file you need to edit.
// 1. Create a free account at https://formspree.io
// 2. Create two forms: "Waitlist" and "Contact"
// 3. Open each form's Integration page and copy its ID
//    (it looks like "xrgnabcd")
// 4. Paste the IDs below in place of the placeholders
// 5. Commit, push, and redeploy. Done.
// Until you paste real IDs, the site uses its built-in
// backend instead, so nothing breaks in the meantime.
// ============================================================

export const FORMSPREE = {
  waitlist: "mwlkrqjn",
  contact: "mrpgylvy",
};

export const formspreeConfigured = (id) => Boolean(id) && !id.startsWith("PASTE_");

export async function submitToFormspree(formId, payload) {
  const response = await fetch(`https://formspree.io/f/${formId}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  let result = {};
  try {
    result = await response.json();
  } catch {
    // non-JSON response; handled by response.ok below
  }

  if (!response.ok) {
    const message =
      result?.errors?.map((e) => e.message).join(", ") ||
      result?.error ||
      `Submission failed (${response.status})`;
    throw new Error(message);
  }
  return result;
}
