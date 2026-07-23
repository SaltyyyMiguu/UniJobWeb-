# UniJobLink - UCSI Internship Management System

This is the Final Year Project (FYP) repository for UniJobLink, a full-stack internship pipeline system designed to connect students, academic supervisors, and companies.

## 🛠 Tech Stack
*   **Frontend:** React, Tailwind CSS, Vercel
*   **Backend:** Node.js, Express, Render
*   **Database:** MySQL (Hosted on Aiven), `mysql2` driver
*   **Storage:** Cloudinary (Images & PDF Resumes)
*   **Email System:** Nodemailer (Custom HTML templates)

---

## 🚀 Deployment & Hosting Quirks (Important!)

### 1. Backend Sleep Prevention (Render)
Render's free tier spins down the backend after 15 minutes of inactivity, which causes the Aiven database connection to drop. 
*   **The Fix:** UptimeRobot is configured to ping the backend URL (`https://unijobweb.onrender.com`) every 5 minutes using an `HTTP(s)` monitor. This keeps the server permanently awake and the database connected.

### 2. Database SSL Warning (Aiven + MySQL2)
By default, Aiven appends `?ssl-mode=REQUIRED` to the database URL. The `mysql2` Node driver throws constant warning spam in the logs when it sees this.
*   **The Fix:** The `?ssl-mode=REQUIRED` flag must be manually deleted from the `DATABASE_URL` string in the Render Environment Variables. SSL is hardcoded securely in `database.js` instead.

---

## 📁 Cloudinary Storage Configuration

### PDF Resume Handling
Cloudinary treats PDFs as `raw` files by default, which strips CORS headers and prevents browsers from rendering them in our custom UI.
*   **The Fix:** PDFs are uploaded with `resource_type: 'image'` and `allowedFormats: ['pdf']`.
*   **CRITICAL SETTING:** For this to work, you must log into the Cloudinary Console -> Settings -> Security -> and ensure **"Allow delivery of PDF and ZIP files"** is toggled **ON**. If this is off, all resumes will return a 401 error.

---

## ✉️ Email Notification System (Nodemailer)

The system sends automated, HTML-styled transactional emails for OTPs, Application Approvals, Interview Invites, and Job Offers. 

### Custom Branding (Logo)
Because webmail clients (like Outlook) have spotty support for WebP images and external URLs can break, the UniJobLink logo is natively embedded into the emails.
*   **Location:** The logo is stored locally on the backend at `backend/assets/logo.png`. (Converted from WebP to PNG specifically for email compatibility).
*   **Implementation:** It is attached to the email payload using Nodemailer's Content-ID (CID) feature (`cid:unijoblogo`). 
*   **Templates:** All 6 email triggers route through a single `wrapTemplate()` function in `mailer.js` for centralized styling.

### Security Note: Password Resets
The password reset flow is strictly email-based. The backend generates a token but **never** returns it to the frontend UI to prevent account hijacking. The token is exclusively delivered via Nodemailer to the verified user's inbox.

---

## 🔒 Environment Variables Reference

When setting up this project locally, ensure your `.env` file contains the following keys:

**Backend:**
*   `PORT`
*   `DATABASE_URL` (Remember: remove the Aiven SSL tag)
*   `CLOUDINARY_CLOUD_NAME`
*   `CLOUDINARY_API_KEY`
*   `CLOUDINARY_API_SECRET`
*   `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` (For Nodemailer)
*   `JWT_SECRET`

**Frontend:**
*   `VITE_API_BASE_URL` (Points to Render in Prod, Localhost in Dev)
