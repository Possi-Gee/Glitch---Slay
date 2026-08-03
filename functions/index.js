/**
 * IMPORTANT: This line must be at the very top to ensure all environment variables are loaded before any other code runs.
 */
require('dotenv').config();

const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

// These imports must come AFTER dotenv.config() is called.
// CORRECTED PATH: Point to the compiled JS output in the `dist` directory.
const { sendOrderUpdateEmail } = require('./dist/functions/src/ai/flows/send-order-update-email.js');

/**
 * Sends emails when a new order is created by invoking a Genkit flow.
 * One to the customer confirming the order, and one to the admin.
 */
exports.onOrderCreate = functions.firestore
    .document("orders/{orderId}")
    .onCreate(async (snap, context) => {
        const order = snap.data();
        const appName = order.appName || "Jaytel Classic Store";
        
        functions.logger.log(`New order #${order.id} received. Invoking email flow...`);

        try {
            // --- Email to Customer ---
            functions.logger.log("Sending confirmation email to customer:", order.shippingAddress.email);
            const customerEmailResult = await sendOrderUpdateEmail({
              orderId: order.id.toString(),
              status: "Confirmed", // A new status for the initial confirmation email
              recipientEmail: order.shippingAddress.email,
              customerName: order.shippingAddress.fullName,
              appName: appName,
              deliveryMethod: order.deliveryMethod,
              paymentMethod: order.paymentMethod,
              total: order.total,
              items: order.items,
            });

            if (customerEmailResult.success) {
                functions.logger.log("Successfully sent confirmation email to customer.");
            } else {
                functions.logger.error("Failed to send confirmation email to customer:", customerEmailResult.message);
            }

            // --- Email to Admin ---
            // Note: You need to set the ADMIN_EMAIL environment variable for this to work.
            const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
            if (ADMIN_EMAIL) {
                functions.logger.log("Sending notification email to admin:", ADMIN_EMAIL);
                 const adminEmailResult = await sendOrderUpdateEmail({
                    orderId: order.id.toString(),
                    status: "New Order", // A status specific to the admin notification
                    recipientEmail: ADMIN_EMAIL,
                    customerName: order.shippingAddress.fullName, // Admin might want to know customer name
                    appName: appName,
                    items: order.items,
                    total: order.total,
                 });

                 if (adminEmailResult.success) {
                    functions.logger.log("Successfully sent admin notification email.");
                } else {
                    functions.logger.error("Failed to send admin notification email:", adminEmailResult.message);
                }
            } else {
                functions.logger.warn("ADMIN_EMAIL environment variable not set. Skipping admin notification.");
            }

        } catch (error) {
            functions.logger.error("Error invoking sendOrderUpdateEmail flow for order #" + order.id, {
                errorMessage: error.message,
                errorStack: error.stack,
            });
        }
    });

/**
 * This function is now OBSOLETE as email sending is handled by the Genkit flow, 
 * which is triggered by the onUpdate of the order document in the client.
 * Keeping the structure for potential future use or for different triggers.
 */
exports.onOrderUpdate = functions.firestore
    .document("orders/{orderId}")
    .onUpdate(async (change, context) => {
        // The logic has been moved to the client-side to call the Genkit flow directly
        // This function body can be left empty or used for other server-side triggers on order update.
        functions.logger.log(`Order #${change.after.id} was updated, but email logic is now handled client-side.`);
        return null;
    });


/**
 * Sends a push notification when a new product is added.
 */
const { onOrderStatusChange } = require('./dist/functions/src/index');
exports.onOrderStatusChange = onOrderStatusChange;

exports.onProductCreate = functions.firestore
  .document('products/{productId}')
  .onCreate(async (snap, context) => {
    const product = snap.data();

    const topic = 'new_products'; 

    const payload = {
      notification: {
        title: '✨ New Product Added!',
        body: `Check out the new ${product.name}!`,
        icon: product.images[0] || '/favicon.ico', 
        click_action: `/product/${product.id}`
      }
    };
    
    console.log(`Sending notification for new product: ${product.name}`);

    try {
      await admin.messaging().sendToTopic(topic, payload);
      console.log('Successfully sent new product notification.');
      return null;
    } catch (error) {
      console.error('Error sending new product notification:', error);
      return null;
    }
  });


/**
 * DEPRECATED: This function is no longer needed.
 * The logic has been moved directly into the sendOrderUpdateEmail Genkit flow
 * to simplify the process and fix internal errors.
 */
exports.generatePasswordResetLink = functions.https.onCall(async (data, context) => {
    functions.logger.warn('The generatePasswordResetLink function is deprecated and should not be used.');
    throw new functions.https.HttpsError('failed-precondition', 'This function is deprecated.');
});
