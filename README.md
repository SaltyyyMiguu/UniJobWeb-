# UniJobLink - UCSI Internship Management System

UniJobLink is a full-stack web platform built for UCSI University to streamline the internship placement pipeline. It connects three core user roles: **Students**, **Academic Supervisors**, and **Corporate Employers**, facilitating everything from job applications to official offer extensions.

---

## 🛠️ The Technology Stack

**Frontend (Client-Side)**
*   **Framework:** React.js (via Vite)
*   **Styling:** Tailwind CSS + Custom CSS Variables (for dual-theme support)
*   **Design System:** Structural tokens based on Vercel's DESIGN.md (precision spacing, radius, and stacked shadows)
*   **Hosting:** Vercel

**Backend (Server-Side)**
*   **Environment:** Node.js with Express.js
*   **Authentication:** JSON Web Tokens (JWT) & bcrypt for password hashing
*   **Email Utility:** Nodemailer (Custom HTML transactional emails)
*   **Hosting:** Render

**Database & Cloud Storage**
*   **Database:** MySQL (Hosted on Aiven)
*   **Driver:** `mysql2` (Promise-based)
*   **File Storage:** Cloudinary (Used for student profile images and PDF resumes)

---

## ⚙️ System Architecture: How It Connects

UniJobLink operates on a decoupled client-server architecture:

1.  **Client-Side Rendering:** The React frontend handles the UI state and routing. It communicates with the backend exclusively via RESTful API endpoints.
2.  **Authentication Flow:** When a user logs in, the backend verifies credentials against the Aiven MySQL database and issues a secure JWT. This token is passed in the header of subsequent requests to authorize actions based on the user's role.
3.  **File Management:** When a student uploads a resume, the backend intercepts the file and routes it directly to Cloudinary. Cloudinary returns a secure URL, which the backend then stores in the MySQL database.
4.  **Notification Pipeline:** Key database updates (e.g., an employer changing an application status to "Offered") trigger the backend's `mailer.js` utility. This utility injects the recipient's data into a custom HTML template (complete with an embedded CID logo) and fires a transactional email via SMTP.

---

## 📁 Project Structure: Which File Does What

The repository is split into two independent directories to allow for separate deployments.

### `/frontend` (React + Tailwind)
*   `src/index.css`: The master styling file. Contains the custom CSS properties for the light/dark mode theme, as well as the structural design tokens (rounded corners, shadows) for core UI elements (`.btn`, `.card`, `.input`, `.modal-panel`).
*   `src/context/`: Contains global state managers, such as `ThemeContext` (handling the `data-theme="dark"` toggle) and Auth context.
*   `src/components/`: Reusable UI elements (e.g., Modals, Navigation bars, Cards).
*   `src/pages/`: The primary views (e.g., Student Dashboard, Login, Forgot Password).

### `/backend` (Node.js + Express)
*   `server.js`: The entry point. Configures Express, CORS, and mounts the API routes.
*   `config/database.js`: Establishes the secure SSL connection to the Aiven MySQL database.
*   `routes/`: Maps URL endpoints to specific controller functions (e.g., `/api/auth/login`).
*   `controllers/`: The brains of the backend. Contains the business logic for creating users, updating application statuses, and handling Cloudinary uploads.
*   `utils/mailer.js`: The centralized email dispatcher. Contains the `wrapTemplate()` function that wraps dynamic text into the UniJobLink branded HTML layout and attaches the local logo (`backend/assets/logo.png`) as a MIME CID.

---

## 🚀 Key Engineering Implementations (FYP Highlights)

*   **Secure Password Reset:** Utilizes a magic-link workflow. Tokens are strictly delivered via the email pipeline and never exposed to the frontend UI, preventing account hijacking.
*   **Dual-Theme UI:** Avoids Tailwind's disconnected `dark:` variant in favor of a robust CSS custom-property system (`--bg`, `--surface`), ensuring instant, flicker-free toggling between light and dark modes.
*   **Cloudinary PDF Handling:** Overcomes standard cloud storage CORS limitations by uploading resumes with `resource_type: 'image'` and `allowedFormats: ['pdf']`, paired with explicit security delivery toggles in the Cloudinary console.
*   **Render Sleep Prevention:** Integrates UptimeRobot to ping the backend API every 5 minutes, preventing the free-tier Render instance from spinning down and dropping the Aiven database connection.
