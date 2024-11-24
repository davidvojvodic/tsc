import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) {
  if (process.env.NODE_ENV === "development") {
    console.log("Email would be sent in production:");
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("Text:", text);
    console.log("HTML:", html);
    return;
  }

  try {
    const data = await resend.emails.send({
      from: process.env.EMAIL_FROM || "onboarding@resend.dev",
      to,
      subject,
      text,
      html: html || text.replace(/\n/g, "<br>"),
    });

    return data;
  } catch (error) {
    console.error("Failed to send email:", error);
    throw new Error("Failed to send email");
  }
}

export function createPasswordResetEmailHtml(baseUrl: string) {
  // Ensure we have our base URL
  if (!baseUrl) {
    throw new Error("Base URL is required for password reset email");
  }

  // Remove any trailing slashes
  const cleanBaseUrl = baseUrl.replace(/\/+$/, "");

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333; text-align: center;">Reset Your Password</h2>
      <p style="color: #666; margin: 20px 0;">
        You requested to reset your password. Click the button below to create a new password:
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${cleanBaseUrl}" 
           style="background-color: #007bff; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 4px; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p style="color: #666; margin: 20px 0;">
        If you didn't request this password reset, you can safely ignore this email.
      </p>
      <p style="color: #666; margin: 20px 0;">
        This link will expire in 1 hour for security reasons.
      </p>
      <hr style="border: 1px solid #eee; margin: 30px 0;" />
      <p style="color: #999; font-size: 12px; text-align: center;">
        If the button doesn't work, you can copy and paste this link into your browser:<br>
        <span style="color: #666;">${cleanBaseUrl}</span>
      </p>
    </div>
  `;
}
