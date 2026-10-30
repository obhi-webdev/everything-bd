import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  sku: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  image: {
    type: String,
    default: ""
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  requestId: {
    type: String,
    required: true,
    unique: true,
    immutable: true
  },

  orderNumber: {
    type: String,
    required: true,
    unique: true
  },

  customer: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    alternatePhone: {
      type: String,
      default: ""
    },
    email: {
      type: String,
      default: ""
    }
  },

  shippingAddress: {
    district: {
      type: String,
      required: true
    },
    area: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    deliveryZone: {
      type: String,
      enum: ["inside_dhaka", "outside_dhaka"],
      required: true
    }
  },

  items: {
    type: [orderItemSchema],
    required: true,
    validate: {
      validator: items => items.length > 0,
      message: "Order must contain at least one item"
    }
  },

  subtotal: {
    type: Number,
    required: true,
    min: 0
  },

  deliveryCharge: {
    type: Number,
    required: true,
    min: 0
  },

  discount: {
    type: Number,
    default: 0,
    min: 0
  },

  total: {
    type: Number,
    required: true,
    min: 0
  },

  paymentMethod: {
    type: String,
    enum: ["cod"],
    default: "cod"
  },

  paymentStatus: {
    type: String,
    enum: ["unpaid", "paid", "refunded"],
    default: "unpaid"
  },

  orderStatus: {
    type: String,
    enum: [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "returned"
    ],
    default: "pending"
  },

  customerNote: {
    type: String,
    default: ""
  },

  trackingNumber: {
    type: String,
    default: ""
  },

  confirmedAt: Date,
  shippedAt: Date,
  deliveredAt: Date

}, {
  timestamps: true
});

orderSchema.index({
  createdAt: -1
});

orderSchema.index({
  "customer.phone": 1,
  createdAt: -1
});

export const Order = mongoose.model(
  "Order",
  orderSchema
);
