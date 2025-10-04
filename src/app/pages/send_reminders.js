// src/pages/api/send_reminders.js
import { createClient } from "@supabase/supabase-js";
import sgMail from "@sendgrid/mail";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL;
const FRONTEND_URL = process.env.FRONTEND_URL || "https://your-portal.example.com";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}
if (!SENDGRID_API_KEY) {
  throw new Error("Missing SENDGRID_API_KEY");
}
if (!FROM_EMAIL) {
  throw new Error("Missing FROM_EMAIL");
}

sgMail.setApiKey(SENDGRID_API_KEY);
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function sanitize(s) {
  return (s || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function formatDate(d) {
  if (!d) return "never";
  try { return new Date(d).toLocaleDateString(); } catch { return String(d); }
}

export default async function handler(req, res) {
  const dryRun = req.query.dry === "true";

  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, last_verified, last_reminder_sent")
      .or(`last_verified.is.null,last_verified.lt.${sixMonthsAgo.toISOString()}`)
      .or(`last_reminder_sent.is.null,last_reminder_sent.lt.${sixMonthsAgo.toISOString()}`)
      .limit(500);

    if (error) throw error;

    if (!profiles || profiles.length === 0) {
      return res.status(200).json({ message: "No profiles need reminders right now." });
    }

    const toEmailProfiles = profiles.filter(p => p.email && p.email.includes("@"));
    const missingEmails = profiles.filter(p => !p.email || !p.email.includes("@"));

    const skippedIds = missingEmails.map(p => p.id);

    if (dryRun) {
      return res.status(200).json({
        message: `[DRY RUN] Would send to ${toEmailProfiles.map(p => p.email).join(", ")}`,
        skippedIds,
      });
    }

    for (const p of toEmailProfiles) {
      const displayName = p.full_name || "Alumni";
      const updateLink = `${FRONTEND_URL}/auth`;
      const subject = "Please verify or update your alumni profile";
      const html = `
        <p>Hi ${sanitize(displayName)},</p>
        <p>We try to keep our alumni database up-to-date. Our records show you haven't verified your details since ${formatDate(p.last_verified)}.</p>
        <p>Please <a href="${updateLink}">log in to the Alumni Portal</a> and confirm your details (or click "Data is same").</p>
        <p>If your details haven't changed, simply click “Data is same” after logging in. If you'd like to update, edit the form and save.</p>
        <p>Thanks,<br/>Alumni Team</p>
      `;

      try {
        await sgMail.send({ to: p.email, from: FROM_EMAIL, subject, html });

        await supabase
          .from("profiles")
          .update({ last_reminder_sent: new Date().toISOString() })
          .eq("id", p.id);
      } catch (sendErr) {
        console.error("Error sending to", p.email, sendErr);
      }
    }

    res.status(200).json({ message: `Sent reminders to ${toEmailProfiles.length} profiles.`, skippedIds });
  } catch (err) {
    console.error("Fatal error:", err);
    res.status(500).json({ error: err.message });
  }
}
