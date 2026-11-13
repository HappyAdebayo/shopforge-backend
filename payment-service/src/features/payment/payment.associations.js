import Payment from "./payment.model.js";
import Refund from "./refund.model.js";

Payment.hasMany(Refund, {
    foreignKey: "paymentId",
    as: "refunds",
    onDelete: "CASCADE"
});

Refund.belongsTo(Payment, {
    foreignKey: "paymentId",
    as: "payment"
});

export default {
    Payment,
    Refund
};
