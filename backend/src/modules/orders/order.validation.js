import { z } from "zod";

const phoneSchema = z.string()
  .trim()
  .regex(
    /^(?:\+?88)?01[3-9]\d{8}$/,
    "Enter a valid Bangladesh mobile number"
  )
  .transform(value =>
    value.replace(/^(?:\+?88)(?=01)/, "")
  );

export const createOrderSchema = z.object({
  requestId: z.uuid(),
  customer: z.object({
    name: z.string().trim().min(2).max(100),
    phone: phoneSchema,
    alternatePhone: z.union([
      phoneSchema,
      z.literal("")
    ]).optional(),
    email: z.union([
      z.email(),
      z.literal("")
    ]).optional()
  }).strict(),

  shippingAddress: z.object({
    district: z.string().trim().min(2).max(100),
    area: z.string().trim().min(2).max(150),
    address: z.string().trim().min(10).max(500),
    deliveryZone: z.enum([
      "inside_dhaka",
      "outside_dhaka"
    ])
  }).strict(),

  items: z.array(
    z.object({
      productId: z.string()
        .regex(/^[a-fA-F0-9]{24}$/),
      quantity: z.number().int().min(1).max(20),
      size: z.string()
        .trim()
        .min(1)
        .max(30)
        .regex(/^[a-zA-Z0-9 -]+$/)
        .transform(value => value.toUpperCase())
        .optional()
    }).strict()
  ).min(1).max(30),

  customerNote: z.string()
    .max(500)
    .optional()
    .default(""),

  couponCode: z.string()
    .trim().max(30)
    .regex(/^[a-zA-Z0-9_-]*$/)
    .optional()
    .default(""),
  paymentMethod: z.literal("cod"),
  marketingConsent: z.boolean().optional().default(false)
}).strict();
