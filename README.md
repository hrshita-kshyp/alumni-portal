# Alumni Database Update Automation

A simple project to automate the process of keeping an alumni database up-to-date by sending email reminders to alumni whose records are outdated. Built using **Next.js**, **Supabase**, and **SendGrid**.

---

## Features

- Tracks alumni data and last update timestamps.
- Sends automated email reminders when data is outdated.
- Easy to deploy and extend.
- Minimal configuration required.

---

## Tech Stack

- **Frontend/Backend:** [Next.js](https://nextjs.org/)  
- **Database:** [Supabase](https://supabase.com/) (PostgreSQL)  
- **Email Service:** [SendGrid](https://sendgrid.com/)  
- **Hosting:** Vercel / any Node.js hosting

---

## Setup & Installation

1. **Clone the repository**

```bash
git clone <your-repo-url>
cd alumni-database-update
```
2. Install dependencies
   ```bash
    npm run dev
   ```
3. Set up environment variables
   Create a .env.local file at the root:
   
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
SENDGRID_API_KEY=<your-sendgrid-api-key>
FROM_EMAIL=<your-email>

Supabase database setup



Create a table alumni with columns:

Column Name	Type	Description

id	uuid	Primary key
name	text	Alumni name
email	text	Alumni email
last_updated	timestamp	Last time the record updated
reminder_sent	boolean	Whether reminder was sent


5. Running the project locally



npm run dev

Your app should now be running on http://localhost:3000.


---

How it works

1. The system checks the last_updated column for each alumni record.


2. If the record hasn’t been updated for more than 6 months (configurable), it triggers an email reminder via SendGrid.


3. After sending the reminder, reminder_sent is updated to avoid duplicate emails.


4. The process can be automated using Vercel cron jobs or Supabase Edge Functions.




---

Deployment

Vercel: Connect your GitHub repo and deploy. Make sure your .env variables are set in the Vercel dashboard.

Supabase Edge Functions (optional): Can be used to schedule the email sending task instead of running it manually.

Future Improvements

Add a front-end dashboard to view alumni and their update status.

SMS notifications using Twilio.

Support for dynamic email templates per alumni category.

More robust scheduling with retries for failed emails.

