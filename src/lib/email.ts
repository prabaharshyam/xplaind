// Sends one email through Resend, with the headers mail apps need for one-click unsubscribe. Node only.
export async function sendEmail(to: string, subject: string, text: string, html: string, unsubscribeUrl: string): Promise<boolean> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.COMMIT_EMAIL_FROM || "Xplaind <hello@xplaind.in>",
      to,
      subject,
      text,
      html,
      headers: { "List-Unsubscribe": `<${unsubscribeUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
    }),
  });
  return res.ok;
}
