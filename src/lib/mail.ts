import nodemailer, { type Transporter } from "nodemailer";

const g = globalThis as unknown as { mailer?: Promise<Transporter> };

/**
 * SMTP_* env set → real SMTP. Otherwise a free Ethereal test inbox is created
 * on first use; every send returns a previewUrl you can open in the browser.
 */
function getTransport(): Promise<Transporter> {
  if (!g.mailer) {
    g.mailer = (async () => {
      if (process.env.SMTP_HOST) {
        return nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT ?? 587),
          secure: Number(process.env.SMTP_PORT) === 465,
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });
      }
      const acc = await nodemailer.createTestAccount();
      return nodemailer.createTransport({
        host: acc.smtp.host,
        port: acc.smtp.port,
        secure: acc.smtp.secure,
        auth: { user: acc.user, pass: acc.pass },
      });
    })();
  }
  return g.mailer;
}

export type MailResult = { ok: boolean; previewUrl?: string; error?: string };

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<MailResult> {
  try {
    const t = await getTransport();
    const info = await t.sendMail({
      from: process.env.MAIL_FROM ?? "Brightloop Billing <billing@brightloop.test>",
      ...opts,
    });
    const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
    if (previewUrl) console.log(`[mail] ${opts.subject} → ${opts.to}: ${previewUrl}`);
    return { ok: true, previewUrl };
  } catch (e) {
    console.error("[mail] failed", e);
    return { ok: false, error: e instanceof Error ? e.message : "Mail failed" };
  }
}

/** Minimal branded wrapper so all emails look consistent. */
export function emailLayout(title: string, bodyHtml: string): string {
  return `<div style="font-family:Inter,Segoe UI,Arial,sans-serif;background:#f4f4f5;padding:32px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e4e4e7;border-radius:12px;padding:32px">
    <div style="font-weight:600;font-size:14px;letter-spacing:.02em;color:#18181b;margin-bottom:24px">Brightloop</div>
    <h1 style="font-size:20px;color:#18181b;margin:0 0 16px">${title}</h1>
    <div style="font-size:14px;line-height:1.6;color:#3f3f46">${bodyHtml}</div>
  </div></div>`;
}
