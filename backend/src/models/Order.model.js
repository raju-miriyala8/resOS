import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },

    tableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Table",
      required: true,
    },

    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TableSession",
      required: true,
    },

    orderNumber: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "NEW",
        "ACCEPTED",
        "PREPARING",
        "READY",
        "SERVED",
        "CANCELLED",
      ],
      default: "NEW",
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;