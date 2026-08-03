"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.onOrderStatusChange = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
if (!admin.apps.length) {
    admin.initializeApp();
}
const STATUS_BODIES = {
    Pending: 'has been placed!',
    Shipped: 'has been shipped!',
    Delivered: 'has been delivered!',
    Cancelled: 'has been cancelled.',
    Refunded: 'has been refunded.',
};
const getNotificationBody = (status, orderId) => {
    const suffix = STATUS_BODIES[status];
    if (suffix) {
        return `Your order #${orderId} ${suffix}`;
    }
    return `Your order #${orderId} status has been updated to ${status}.`;
};
exports.onOrderStatusChange = functions.firestore
    .document('orders/{orderId}')
    .onUpdate(async (change, context) => {
    var _a;
    const { orderId } = context.params;
    const beforeData = change.before.data();
    const afterData = change.after.data();
    if (!beforeData || !afterData) {
        functions.logger.warn(`Order ${orderId} data missing before or after update.`);
        return null;
    }
    const oldStatus = beforeData.status;
    const newStatus = afterData.status;
    if (oldStatus === newStatus) {
        return null;
    }
    functions.logger.info(`Order ${orderId} status changed from "${oldStatus}" to "${newStatus}"`);
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
            functions.logger.warn(`No FCM token found for user ${userId} on order ${orderId}`);
            return null;
        }
        const token = (_a = tokenDoc.data()) === null || _a === void 0 ? void 0 : _a.token;
        if (!token) {
            functions.logger.warn(`FCM token document for user ${userId} has no token field`);
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
            functions.logger.log(`Push notification sent for order ${orderId} to user ${userId}`);
        }
        if (response.failureCount > 0) {
            response.responses.forEach((resp, idx) => {
                var _a;
                if (!resp.success) {
                    functions.logger.error(`Failed to send push notification to token ${idx} for order ${orderId}: ${(_a = resp.error) === null || _a === void 0 ? void 0 : _a.message}`);
                }
            });
        }
    }
    catch (error) {
        functions.logger.error(`Error sending push notification for order ${orderId}:`, error);
    }
    return null;
});
//# sourceMappingURL=index.js.map