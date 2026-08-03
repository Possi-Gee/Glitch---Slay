import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

const STATUS_BODIES: Record<string, string> = {
  Pending: 'has been placed!',
  Shipped: 'has been shipped!',
  Delivered: 'has been delivered!',
  Cancelled: 'has been cancelled.',
  Refunded: 'has been refunded.',
};

const getNotificationBody = (status: string, orderId: string): string => {
  const suffix = STATUS_BODIES[status];
  if (suffix) {
    return `Your order #${orderId} ${suffix}`;
  }
  return `Your order #${orderId} status has been updated to ${status}.`;
};

export const onOrderStatusChange = functions.firestore
  .document('orders/{orderId}')
  .onUpdate(async (change, context) => {
    const { orderId } = context.params;
    const beforeData = change.before.data();
    const afterData = change.after.data();

    if (!beforeData || !afterData) {
      functions.logger.warn(`Order ${orderId} data missing before or after update.`);
      return null;
    }

    const oldStatus: string = beforeData.status;
    const newStatus: string = afterData.status;

    if (oldStatus === newStatus) {
      return null;
    }

    functions.logger.info(
      `Order ${orderId} status changed from "${oldStatus}" to "${newStatus}"`
    );

    const userId = afterData.userId;
    if (!userId) {
      functions.logger.warn(`Order ${orderId} has no userId; skipping push notification.`);
      return null;
    }

    try {
      const tokenDoc = await admin
        .firestore()
        .collection('fcm_tokens')
        .doc(userId)
        .get();

      if (!tokenDoc.exists) {
        functions.logger.warn(
          `No FCM token found for user ${userId} on order ${orderId}`
        );
        return null;
      }

      const token = tokenDoc.data()?.token;
      if (!token) {
        functions.logger.warn(
          `FCM token document for user ${userId} has no token field`
        );
        return null;
      }

      const body = getNotificationBody(newStatus, orderId);

      const response = await admin.messaging().sendEachForMulticast({
        tokens: [token],
        notification: {
          title: 'Order Update',
          body,
        },
      });

      if (response.successCount > 0) {
        functions.logger.log(
          `Push notification sent for order ${orderId} to user ${userId}`
        );
      }

      if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            functions.logger.error(
              `Failed to send push notification to token ${idx} for order ${orderId}: ${resp.error?.message}`
            );
          }
        });
      }
    } catch (error) {
      functions.logger.error(
        `Error sending push notification for order ${orderId}:`,
        error
      );
    }

    return null;
  });
