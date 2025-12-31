import sgMail from "@sendgrid/mail";

interface SendGridError extends Error {
  response?: {
    body?: {
      errors?: Array<{ message?: string }>;
    };
  };
}

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// IMPORTANT: Using admin@easychamp.com because it's the only verified sender in SendGrid
// To use noreply@edufeed.app, you need to:
// 1. Authenticate edufeed.app domain in SendGrid (Settings > Sender Authentication)
// 2. Add noreply@edufeed.app as a verified sender
const FROM_EMAIL = "admin@easychamp.com";
const FROM_NAME = "EduFeed";

// Brand colors
const BRAND = {
  purple: "#9333ea",
  purpleLight: "#a855f7",
  purpleDark: "#7c3aed",
  background: "#000000",
  cardBg: "#111111",
  textPrimary: "#ffffff",
  textSecondary: "#9ca3af",
  border: "rgba(255, 255, 255, 0.1)",
};

// Base email template with EduFeed branding
function getBaseTemplate(content: string, preheader: string = ""): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>EduFeed</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    body {
      margin: 0;
      padding: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: ${BRAND.background};
      color: ${BRAND.textPrimary};
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    .preheader {
      display: none !important;
      visibility: hidden;
      mso-hide: all;
      font-size: 1px;
      line-height: 1px;
      max-height: 0;
      max-width: 0;
      opacity: 0;
      overflow: hidden;
    }

    .email-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }

    .logo-container {
      text-align: center;
      margin-bottom: 32px;
    }

    .logo {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
    }

    .logo-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, ${BRAND.purple} 0%, ${BRAND.purpleLight} 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .logo-text {
      font-size: 28px;
      font-weight: 700;
      color: ${BRAND.textPrimary};
    }

    .card {
      background-color: ${BRAND.cardBg};
      border: 1px solid ${BRAND.border};
      border-radius: 16px;
      padding: 40px;
      margin-bottom: 24px;
    }

    .title {
      font-size: 24px;
      font-weight: 600;
      color: ${BRAND.textPrimary};
      margin: 0 0 16px 0;
      text-align: center;
    }

    .subtitle {
      font-size: 16px;
      color: ${BRAND.textSecondary};
      margin: 0 0 32px 0;
      text-align: center;
      line-height: 1.6;
    }

    .button {
      display: inline-block;
      background: linear-gradient(135deg, ${BRAND.purple} 0%, ${BRAND.purpleDark} 100%);
      color: ${BRAND.textPrimary} !important;
      text-decoration: none;
      font-weight: 600;
      font-size: 16px;
      padding: 16px 32px;
      border-radius: 12px;
      text-align: center;
      transition: opacity 0.2s;
    }

    .button:hover {
      opacity: 0.9;
    }

    .button-container {
      text-align: center;
      margin: 32px 0;
    }

    .divider {
      height: 1px;
      background-color: ${BRAND.border};
      margin: 32px 0;
    }

    .code-box {
      background-color: rgba(147, 51, 234, 0.1);
      border: 1px solid rgba(147, 51, 234, 0.3);
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      margin: 24px 0;
    }

    .code {
      font-family: 'SF Mono', Monaco, 'Courier New', monospace;
      font-size: 32px;
      font-weight: 700;
      color: ${BRAND.purpleLight};
      letter-spacing: 8px;
    }

    .note {
      font-size: 14px;
      color: ${BRAND.textSecondary};
      text-align: center;
      margin-top: 24px;
      line-height: 1.6;
    }

    .footer {
      text-align: center;
      padding: 24px;
    }

    .footer-text {
      font-size: 13px;
      color: ${BRAND.textSecondary};
      margin: 0 0 16px 0;
      line-height: 1.6;
    }

    .footer-links {
      margin-top: 16px;
    }

    .footer-link {
      color: ${BRAND.purpleLight};
      text-decoration: none;
      font-size: 13px;
      margin: 0 12px;
    }

    .footer-link:hover {
      text-decoration: underline;
    }

    .warning {
      background-color: rgba(251, 191, 36, 0.1);
      border: 1px solid rgba(251, 191, 36, 0.3);
      border-radius: 12px;
      padding: 16px;
      margin-top: 24px;
    }

    .warning-text {
      font-size: 14px;
      color: #fbbf24;
      margin: 0;
      line-height: 1.6;
    }

    @media only screen and (max-width: 600px) {
      .email-container {
        padding: 20px 16px;
      }
      .card {
        padding: 24px;
      }
      .title {
        font-size: 20px;
      }
      .code {
        font-size: 24px;
        letter-spacing: 4px;
      }
    }
  </style>
</head>
<body>
  <span class="preheader">${preheader}</span>
  <div class="email-container">
    <div class="logo-container">
      <a href="https://edufeed.app" class="logo">
        <div class="logo-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
        </div>
        <span class="logo-text">EduFeed</span>
      </a>
    </div>

    ${content}

    <div class="footer">
      <p class="footer-text">
        This email was sent by EduFeed. If you didn't request this email, you can safely ignore it.
      </p>
      <div class="footer-links">
        <a href="https://edufeed.app" class="footer-link">Visit EduFeed</a>
        <a href="https://edufeed.app/support" class="footer-link">Help Center</a>
        <a href="https://edufeed.app/privacy" class="footer-link">Privacy Policy</a>
      </div>
      <p class="footer-text" style="margin-top: 24px; color: #6b7280;">
        &copy; ${new Date().getFullYear()} EduFeed. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
`;
}

// Password Reset Email
export async function sendPasswordResetEmail(
  email: string,
  resetLink: string,
  userName?: string
): Promise<{ success: boolean; error?: string }> {
  const content = `
    <div class="card">
      <h1 class="title">Reset Your Password</h1>
      <p class="subtitle">
        ${userName ? `Hi ${userName},<br><br>` : ""}
        We received a request to reset your password for your EduFeed account.
        Click the button below to create a new password.
      </p>

      <div class="button-container">
        <a href="${resetLink}" class="button">Reset Password</a>
      </div>

      <div class="divider"></div>

      <p class="note">
        This link will expire in <strong>1 hour</strong> for security reasons.<br>
        If you didn't request a password reset, you can safely ignore this email.
      </p>

      <div class="warning">
        <p class="warning-text">
          &#9888; Never share this link with anyone. EduFeed will never ask for your password.
        </p>
      </div>
    </div>
  `;

  const msg = {
    to: email,
    from: {
      email: FROM_EMAIL,
      name: FROM_NAME,
    },
    subject: "Reset Your EduFeed Password",
    html: getBaseTemplate(content, "Reset your password to regain access to your EduFeed account"),
    text: `
Reset Your Password

${userName ? `Hi ${userName},\n\n` : ""}We received a request to reset your password for your EduFeed account.

Click the link below to create a new password:
${resetLink}

This link will expire in 1 hour for security reasons.

If you didn't request a password reset, you can safely ignore this email.

- The EduFeed Team
    `.trim(),
  };

  try {
    await sgMail.send(msg);
    console.log(`Password reset email sent to ${email}`);
    return { success: true };
  } catch (error) {
    const err = error as SendGridError;
    console.error("SendGrid error:", err);
    return {
      success: false,
      error: err.response?.body?.errors?.[0]?.message || err.message || "Failed to send email"
    };
  }
}

// Password Reset Success Email
export async function sendPasswordResetSuccessEmail(
  email: string,
  userName?: string
): Promise<{ success: boolean; error?: string }> {
  const content = `
    <div class="card">
      <h1 class="title">Password Changed Successfully</h1>
      <p class="subtitle">
        ${userName ? `Hi ${userName},<br><br>` : ""}
        Your EduFeed password has been successfully changed. You can now sign in with your new password.
      </p>

      <div class="button-container">
        <a href="https://edufeed.app/login" class="button">Sign In to EduFeed</a>
      </div>

      <div class="warning">
        <p class="warning-text">
          &#9888; If you didn't make this change, please reset your password immediately or contact our support team.
        </p>
      </div>
    </div>
  `;

  const msg = {
    to: email,
    from: {
      email: FROM_EMAIL,
      name: FROM_NAME,
    },
    subject: "Your EduFeed Password Has Been Changed",
    html: getBaseTemplate(content, "Your password has been successfully changed"),
    text: `
Password Changed Successfully

${userName ? `Hi ${userName},\n\n` : ""}Your EduFeed password has been successfully changed. You can now sign in with your new password.

Sign in: https://edufeed.app/login

If you didn't make this change, please reset your password immediately or contact our support team.

- The EduFeed Team
    `.trim(),
  };

  try {
    await sgMail.send(msg);
    console.log(`Password reset success email sent to ${email}`);
    return { success: true };
  } catch (error) {
    const err = error as SendGridError;
    console.error("SendGrid error:", error);
    return {
      success: false,
      error: err.response?.body?.errors?.[0]?.message || err.message || "Failed to send email"
    };
  }
}

// Welcome Email
export async function sendWelcomeEmail(
  email: string,
  userName?: string
): Promise<{ success: boolean; error?: string }> {
  const content = `
    <div class="card">
      <h1 class="title">Welcome to EduFeed! 🎓</h1>
      <p class="subtitle">
        ${userName ? `Hi ${userName},<br><br>` : ""}
        Thanks for joining EduFeed! We're excited to help you learn faster with
        AI-powered educational videos and study tools.
      </p>

      <div class="button-container">
        <a href="https://edufeed.app/feed" class="button">Start Learning</a>
      </div>

      <div class="divider"></div>

      <p class="note">
        <strong>What you can do with EduFeed:</strong><br>
        &#10003; Generate educational videos from any topic<br>
        &#10003; Create AI-powered flashcards and quizzes<br>
        &#10003; Study with personalized learning paths<br>
        &#10003; Track your progress and achievements
      </p>
    </div>
  `;

  const msg = {
    to: email,
    from: {
      email: FROM_EMAIL,
      name: FROM_NAME,
    },
    subject: "Welcome to EduFeed! 🎓",
    html: getBaseTemplate(content, "Welcome to EduFeed - Your AI-powered learning platform"),
    text: `
Welcome to EduFeed! 🎓

${userName ? `Hi ${userName},\n\n` : ""}Thanks for joining EduFeed! We're excited to help you learn faster with AI-powered educational videos and study tools.

Start learning: https://edufeed.app/feed

What you can do with EduFeed:
- Generate educational videos from any topic
- Create AI-powered flashcards and quizzes
- Study with personalized learning paths
- Track your progress and achievements

- The EduFeed Team
    `.trim(),
  };

  try {
    await sgMail.send(msg);
    console.log(`Welcome email sent to ${email}`);
    return { success: true };
  } catch (error) {
    const err = error as SendGridError;
    console.error("SendGrid error:", error);
    return {
      success: false,
      error: err.response?.body?.errors?.[0]?.message || err.message || "Failed to send email"
    };
  }
}

// Email Verification Email
export async function sendEmailVerificationEmail(
  email: string,
  verificationLink: string,
  userName?: string
): Promise<{ success: boolean; error?: string }> {
  const content = `
    <div class="card">
      <h1 class="title">Verify Your Email</h1>
      <p class="subtitle">
        ${userName ? `Hi ${userName},<br><br>` : ""}
        Thanks for signing up for EduFeed! Please verify your email address to complete your registration.
      </p>

      <div class="button-container">
        <a href="${verificationLink}" class="button">Verify Email Address</a>
      </div>

      <div class="divider"></div>

      <p class="note">
        This link will expire in <strong>24 hours</strong>.<br>
        If you didn't create an EduFeed account, you can safely ignore this email.
      </p>
    </div>
  `;

  const msg = {
    to: email,
    from: {
      email: FROM_EMAIL,
      name: FROM_NAME,
    },
    subject: "Verify Your EduFeed Email",
    html: getBaseTemplate(content, "Please verify your email to complete your EduFeed registration"),
    text: `
Verify Your Email

${userName ? `Hi ${userName},\n\n` : ""}Thanks for signing up for EduFeed! Please verify your email address to complete your registration.

Click the link below to verify your email:
${verificationLink}

This link will expire in 24 hours.

If you didn't create an EduFeed account, you can safely ignore this email.

- The EduFeed Team
    `.trim(),
  };

  try {
    await sgMail.send(msg);
    console.log(`Verification email sent to ${email}`);
    return { success: true };
  } catch (error) {
    const err = error as SendGridError;
    console.error("SendGrid error:", error);
    return {
      success: false,
      error: err.response?.body?.errors?.[0]?.message || err.message || "Failed to send email"
    };
  }
}
