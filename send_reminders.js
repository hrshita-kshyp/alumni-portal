// send_reminders.js
// Usage:
//   node send_reminders.js        -> sends emails
//   node send_reminders.js --dry  -> prints who WOULD receive emails, doesn't send

import dotenv from "dotenv";
dotenv.config();

import { createClient } from "@supabase/supabase-js";
import sgMail from "@sendgrid/mail";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL; // e.g. "Alumni Portal <no-reply@yourdomain.com>"
const FRONTEND_URL = process.env.FRONTEND_URL || "https://your-portal.example.com"; // change to your dev URL in .env

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env");
  process.exit(1);
}
if (!SENDGRID_API_KEY && process.argv.indexOf("--dry") === -1) {
  console.error("Missing SENDGRID_API_KEY in env (or run with --dry)");
  process.exit(1);
}
if (!FROM_EMAIL && process.argv.indexOf("--dry") === -1) {
  console.error("Missing FROM_EMAIL in env (or run with --dry)");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }, // server-side usage
});

if (SENDGRID_API_KEY) sgMail.setApiKey(SENDGRID_API_KEY);

const dryRun = process.argv.includes("--dry");

async function main() {
  console.log(new Date().toISOString(), "Starting reminder run", dryRun ? "(dry run)" : "");

  // compute 6 months ago
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  // Fetch profiles needing reminder:
  // - last_verified is null OR last_verified < sixMonthsAgo
  // - AND last_reminder_sent is null OR last_reminder_sent < sixMonthsAgo
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, last_verified, last_reminder_sent")
    .or(
      `last_verified.is.null,last_verified.lt.${sixMonthsAgo.toISOString()}`
    )
    .or(
      `last_reminder_sent.is.null,last_reminder_sent.lt.${sixMonthsAgo.toISOString()}`
    )
    .limit(500); // batch cap, adjust if needed

  if (error) {
    console.error("Error fetching profiles:", error.message);
    process.exit(1);
  }

  if (!profiles || profiles.length === 0) {
    console.log("No profiles need reminders right now.");
    return;
  }

  console.log(`Found ${profiles.length} profiles to consider.`);

  // We'll email each profile that has an email
  const toEmailProfiles = profiles.filter(p => p.email && p.email.includes("@"));
  const missingEmails = profiles.filter(p => !p.email || !p.email.includes("@"));

  if (missingEmails.length > 0) {
    console.log("Profiles missing email (will skip):", missingEmails.map(p => p.id));
  }

  for (const p of toEmailProfiles) {
    const displayName = p.full_name || "Alumni";
    const updateLink = `${FRONTEND_URL}/auth`; // user should log in then go to /profile to update
    const subject = "Please verify or update your alumni profile";
    const html = `
      <p>Hi ${sanitize(displayName)},</p>
      <p>We try to keep our alumni database up-to-date. Our records show you haven't verified your details since ${formatDate(p.last_verified)}.</p>
      <p>Please <a href="${updateLink}">log in to the Alumni Portal</a> and confirm your details (or click "Data is same").</p>
      <p>If your details haven't changed, simply click “Data is same” after logging in. If you'd like to update, edit the form and save.</p>
      <p>Thanks,<br/>Alumni Team</p>
    `;

    

    try {
      await sgMail.send({
        to: p.email,
        from: FROM_EMAIL,
        subject,
        html
      });
      console.log("Sent to", p.email);

      // mark last_reminder_sent
      const { error: upErr } = await supabase
        .from("profiles")
        .update({ last_reminder_sent: new Date().toISOString() })
        .eq("id", p.id);

      if (upErr) console.error("Failed to update last_reminder_sent for", p.id, upErr.message);
    } catch (sendErr) {
      console.error("Error sending to", p.email, sendErr);
    }
  }

  console.log("Done.");
}

function sanitize(s) {
  return (s || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function formatDate(d) {
  if (!d) return "never";
  try { return new Date(d).toLocaleDateString(); } catch { return String(d); }
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
