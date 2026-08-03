
'use server';

/**
 * @fileOverview A Genkit flow for sending order update emails using Nodemailer.
 *
 * - sendOrderUpdateEmail - A function that sends an email notification to a customer when their order status changes.
 * - SendOrderUpdateEmailInput - The input type for the sendOrderUpdateEmail function.
 * - SendOrderUpdateEmailOutput - The return type for the sendOrderUpdateEmail function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import nodemailer from 'nodemailer';

const CartItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  name: z.string(),
  image: z.string().url(),
  quantity: z.number(),
  variant: z.object({
    id: z.string(),
    name: z.string(),
    price: z.number(),
    originalPrice: z.number().optional(),
    stock: z.number(),
  })
});

const SendOrderUpdateEmailInputSchema = z.object({
  orderId: z.string().optional().describe('The ID of the order.'),
  status: z.string().describe('The new status of the order. Can be custom for different email types (e.g., "Confirmed").'),
  recipientEmail: z.string().email().describe('The email address of the recipient (customer or admin).'),
  customerName: z.string().describe('The name of the customer.'),
  appName: z.string().describe('The name of the application.'),
  deliveryMethod: z.string().optional().describe('The delivery method for the order (e.g., "pickup", "delivery").'),
  paymentMethod: z.string().optional().describe('The payment method for the order (e.g., "on_delivery").'),
  total: z.number().optional().describe('The total amount of the order.'),
  items: z.array(CartItemSchema).optional().describe('The items in the order.'),
  resetLink: z.string().url().optional().describe('A password reset link.'),
});
export type SendOrderUpdateEmailInput = z.infer<typeof SendOrderUpdateEmailInputSchema>;

const SendOrderUpdateEmailOutputSchema = z.object({
  success: z.boolean().describe('Whether the email was sent successfully.'),
  message: z.string().describe('A message indicating the result of the operation.'),
});
export type SendOrderUpdateEmailOutput = z.infer<typeof SendOrderUpdateEmailOutputSchema>;

const getEmailContent = (
    status: string, 
    orderId: string | undefined, 
    customerName: string, 
    appName: string, 
    recipient: 'customer' | 'admin',
    input: SendOrderUpdateEmailInput
) => {
    const { deliveryMethod, paymentMethod, total, items, resetLink } = input;
    let subject = `Your ${appName} Order #${orderId} has been updated`;
    let mainContent = `<p>Hi ${customerName},</p><p>There's an update on your order #${orderId}. The new status is: <strong>${status}</strong>.</p>`;

    const isPickup = deliveryMethod === 'pickup';

    const itemsHtml = items && items.length > 0 ? `
      <h3>Order Summary</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        ${items.map(item => {
          // Use a reliable placeholder if the image source is from picsum.
          const imageSrc = item.image.includes('picsum.photos') 
            ? `https://placehold.co/64x64/EFEFEF/333333?text=${item.name.charAt(0)}` 
            : item.image;
          return `
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 10px 0;"><img src="${imageSrc}" alt="${item.name}" width="64" height="64" style="border-radius: 4px; object-fit: cover;"/></td>
            <td style="padding: 10px; vertical-align: top;">
              ${item.name} (${item.variant.name})<br>
              <span style="color: #888;">Qty: ${item.quantity}</span>
            </td>
            <td style="padding: 10px; text-align: right; vertical-align: top;">GH₵${(item.variant.price * item.quantity).toFixed(2)}</td>
          </tr>
        `}).join('')}
      </table>
      <p style="text-align: right; font-size: 1.2em; font-weight: bold;">Total: GH₵${total?.toFixed(2)}</p>
    ` : '';

    switch (status.toLowerCase()) {
        case 'password reset':
            subject = `Reset Your Password for ${appName}`;
            mainContent = `
                <h2>Password Reset Request</h2>
                <p>Hi ${customerName},</p>
                <p>We received a request to reset your password. Click the button below to choose a new one. This link will expire in 1 hour.</p>
                <p>If you did not request this, you can safely ignore this email.</p>
            `;
            break;
        case 'confirmed':
             subject = `✅ Your ${appName} Order Confirmation #${orderId}`;
             mainContent = `
                <h2>Thanks for your order, ${customerName}!</h2>
                <p>We've received your order #${orderId} and are getting it ready. We'll notify you as soon as it's ready for pickup or has shipped.</p>
             `;

             if (isPickup && paymentMethod === 'on_delivery' && total) {
                mainContent += `<p><b>Please remember to bring GH₵${total.toFixed(2)} when you come to pick up your order.</b></p>`;
             }
             
            break;
        case 'new order': // For Admin
            subject = `🎉 New Order Received! #${orderId}`;
            mainContent = `
                <h2>You've received a new order!</h2>
                <p>A new order (#${orderId}) was placed by ${customerName}.</p>
                <p>Please review it in the admin dashboard to begin processing.</p>
            `;
            break;
        case 'shipped':
            if (isPickup) {
                 subject = `✅ Your ${appName} Order #${orderId} is Ready for Pickup!`;
                 mainContent = `
                    <h2>Great News, ${customerName}!</h2>
                    <p>Your order #${orderId} is now ready for you to pick up at our store.</p>
                 `;
                  if (paymentMethod === 'on_delivery' && total) {
                    mainContent += `<p><b>Please remember to bring GH₵${total.toFixed(2)} to complete your payment.</b></p>`;
                 }
                 mainContent += `<p>We look forward to seeing you!</p>`;
            } else {
                subject = `🚀 Your ${appName} Order #${orderId} Has Shipped!`;
                mainContent = `
                    <h2>Great News, ${customerName}!</h2>
                    <p>Your order #${orderId} is on its way to you.</p>
                    <p>We're so excited for you to receive your items!</p>
                `;
            }
            break;
        case 'delivered':
             subject = `✅ Your ${appName} Order #${orderId} Has Been Delivered!`;
             mainContent = `
                <h2>Hooray, ${customerName}!</h2>
                <p>Your order #${orderId} has arrived. We hope you enjoy your new items!</p>
                <p>Thank you for shopping with us.</p>
            `;
            break;
        case 'cancelled':
            subject = `Your ${appName} Order #${orderId} Has Been Cancelled`;
            mainContent = `
                <h2>Order Cancellation</h2>
                <p>Hi ${customerName}, as requested, your order #${orderId} has been cancelled.</p>
                <p>If you have any questions, please feel free to contact our support team.</p>
            `;
            break;
    }
    
    // Append the order summary at the end for order-related emails
    const finalHtml = status.toLowerCase() !== 'password reset' ? `${mainContent}${itemsHtml}` : mainContent;

    return { subject, html: styleEmail(finalHtml, appName, orderId, recipient, status, resetLink) };
};

const styleEmail = (content: string, appName: string, orderId: string | undefined, recipient: 'customer' | 'admin', status: string, resetLink?: string) => {
    // Use environment variable for the base URL, with fallbacks for Vercel and local dev.
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:9002');
    
    let buttonUrl = '#';
    let buttonText = '';

    if (status.toLowerCase() === 'password reset') {
        buttonUrl = resetLink || '#';
        buttonText = 'Reset Your Password';
    } else if (recipient === 'admin') {
        buttonUrl = `${baseUrl}/admin/orders/${orderId}`;
        buttonText = 'View in Admin Panel';
    } else {
        buttonUrl = `${baseUrl}/orders/${orderId}`;
        buttonText = 'View Order in Store';
    }

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
              .button-container { text-align: center; margin-top: 20px; margin-bottom: 20px; }
              .button { background-color: #1976d2; color: #ffffff !important; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; }
              .footer { text-align: center; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #888; }
              h2 { color: #1a1a1a; }
              h3 { border-bottom: 1px solid #eee; padding-bottom: 10px; margin-top: 30px; }
              p { margin-bottom: 1em; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>${appName}</h1>
              </div>
              <div class="content">
                ${content}
                <div class="button-container">
                    <a href="${buttonUrl}" class="button">${buttonText}</a>
                </div>
              </div>
              <div class="footer">
                  <p>Thank you for choosing ${appName}!</p>
              </div>
          </div>
      </body>
      </html>
    `;
};


export async function sendOrderUpdateEmail(input: SendOrderUpdateEmailInput): Promise<SendOrderUpdateEmailOutput> {
  return sendOrderUpdateEmailFlow(input);
}


const sendOrderUpdateEmailFlow = ai.defineFlow(
  {
    name: 'sendOrderUpdateEmailFlow',
    inputSchema: SendOrderUpdateEmailInputSchema,
    outputSchema: SendOrderUpdateEmailOutputSchema,
  },
  async (input) => {
    const { orderId, status, recipientEmail, customerName, appName } = input;
    
    const {
        EMAIL_HOST,
        EMAIL_PORT,
        EMAIL_USER,
        EMAIL_PASS,
        ADMIN_EMAIL
    } = process.env;

    if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASS) {
        const errorMessage = 'Email service is not configured. Please set required EMAIL environment variables for Nodemailer.';
        console.error(errorMessage);
        return { success: false, message: errorMessage };
    }

    const transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: parseInt(EMAIL_PORT, 10),
      secure: parseInt(EMAIL_PORT, 10) === 465, // true for 465, false for other ports
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });
    
    const recipientType = recipientEmail === ADMIN_EMAIL ? 'admin' : 'customer';

    const { subject, html } = getEmailContent(status, orderId, customerName, appName, recipientType, input);
    
    const fromAddress = `"${appName}" <${EMAIL_USER}>`;

    const mailOptions = {
      from: fromAddress,
      to: recipientEmail,
      subject: subject,
      html: html,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${recipientEmail}`);
      return { success: true, message: `Update email sent to ${recipientEmail}.` };
    } catch (error: any) {
      console.error('Failed to send email:', error);
      return { success: false, message: `Failed to send email: ${error.message}` };
    }
  }
);
