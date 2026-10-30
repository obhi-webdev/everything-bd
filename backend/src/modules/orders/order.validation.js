import { z } from "zod";

const phoneSchema = z.string()
  .trim()
  .regex(
    /^(?:\+?88)?01[3-9]\d{8}$/,
    "Enter a valid Bangladesh mobile number"
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
      quantity: z.number().int().min(1).max(20)
    }).strict()
  ).min(1).max(30),

  customerNote: z.string()
    .max(500)
    .optional()
    .default(""),

  paymentMethod: z.literal("cod"),
  marketingConsent: z.boolean().optional().default(false)
}).strict();
