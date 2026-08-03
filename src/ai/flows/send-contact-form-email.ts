
'use server';

/**
 * @fileOverview A Genkit flow for sending contact form submissions via email.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import nodemailer from 'nodemailer';

const SendContactFormEmailInputSchema = z.object({
  fromName: z.string().describe('The name of the person sending the message.'),
  fromEmail: z.string().email().describe('The email address of the person sending the message.'),
  subject: z.string().describe('The subject of the message.'),
  message: z.string().describe('The content of the message.'),
  appName: z.string().describe('The name of the application sending the email.'),
});
export type SendContactFormEmailInput = z.infer<typeof SendContactFormEmailInputSchema>;

const SendContactFormEmailOutputSchema = z.object({
  success: z.boolean().describe('Whether the email was sent successfully.'),
  message: z.string().describe('A message indicating the result of the operation.'),
});
export type SendContactFormEmailOutput = z.infer<typeof SendContactFormEmailOutputSchema>;


const styleEmail = (appName: string, fromName: string, fromEmail: string, subject: string, message: string) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
          <style>
              body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; margin: 0; padding: 20px; background-color: #f4f4f4; }
              .container { max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); background-color: #fff; }
              .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #eee; }
              .header h1 { color: #1a1a1a; font-size: 24px; margin: 0;}
              .content { padding: 20px 0; }
              .message-block { background-color: #f9f9f9; border: 1px solid #eee; padding: 15px; border-radius: 5px; }
              .footer { text-align: center; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #888; }
              h2 { color: #1a1a1a; }
              p { margin-bottom: 1em; }
              blockquote { margin: 0; padding-left: 15px; border-left: 3px solid #ccc; color: #555; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>New Message via ${appName} Contact Form</h1>
              </div>
              <div class="content">
                <p>You have received a new message from your website's contact form.</p>
                <div class="message-block">
                    <p><strong>From:</strong> ${fromName} (${fromEmail})</p>
                    <p><strong>Subject:</strong> ${subject}</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 15px 0;">
                    <p><strong>Message:</strong></p>
                    <blockquote>${message.replace(/\n/g, '<br>')}</blockquote>
                </div>
              </div>
              <div class="footer">
                  <p>This is an automated notification from ${appName}.</p>
              </div>
          </div>
      </body>
      </html>
    `;
};


export async function sendContactFormEmail(input: SendContactFormEmailInput): Promise<SendContactFormEmailOutput> {
  return sendContactFormEmailFlow(input);
}


const sendContactFormEmailFlow = ai.defineFlow(
  {
    name: 'sendContactFormEmailFlow',
    inputSchema: SendContactFormEmailInputSchema,
    outputSchema: SendContactFormEmailOutputSchema,
  },
  async (input) => {
    const { fromName, fromEmail, subject, message, appName } = input;
    
    const {
        EMAIL_HOST,
        EMAIL_PORT,
        EMAIL_USER,
        EMAIL_PASS,
        ADMIN_EMAIL,
    } = process.env;

    if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASS) {
        const errorMessage = 'Email service is not configured. Please set required EMAIL environment variables.';
        console.error(errorMessage);
        return { success: false, message: errorMessage };
    }
    
    if (!ADMIN_EMAIL) {
        const errorMessage = 'Admin email is not configured. Please set the ADMIN_EMAIL environment variable.';
        console.error(errorMessage);
        return { success: false, message: errorMessage };
    }

    const transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: parseInt(EMAIL_PORT, 10),
      secure: parseInt(EMAIL_PORT, 10) === 465,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });
    
    const emailHtml = styleEmail(appName, fromName, fromEmail, subject, message);
    const emailSubject = `New Contact Form Submission: ${subject}`;
    const fromAddress = `"${appName} Contact Form" <${EMAIL_USER}>`;

    const mailOptions = {
      from: fromAddress,
      to: ADMIN_EMAIL,
      replyTo: `"${fromName}" <${fromEmail}>`,
      subject: emailSubject,
      html: emailHtml,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Contact form email sent successfully to ${ADMIN_EMAIL}`);
      return { success: true, message: 'Message sent successfully.' };
    } catch (error: any) {
      console.error('Failed to send contact form email:', error);
      return { success: false, message: `Failed to send email: ${error.message}` };
    }
  }
);
