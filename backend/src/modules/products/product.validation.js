import { z } from "zod";

const imageSchema = z.object({
  url: z.url().refine(
    (url) => new URL(url).protocol === "https:",
    "Image URL must use HTTPS"
  ),
  alt: z.string().max(200).default(""),
  publicId: z.string().max(250).default("")
}).strict();

const baseProductSchema = z.object({
  name: z.string().trim().min(3).max(200),

  slug: z.string().trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),

  sku: z.string().trim().min(2).max(80),

  brand: z.string().trim().max(120).default(""),

  category: z.string().trim().min(2).max(120),

  description: z.string().max(10000).default(""),

  ingredients: z.array(z.string().max(200))
    .max(100).default([]),

  benefits: z.array(z.string().max(300))
    .max(50).default([]),

  images: z.array(imageSchema).max(12).default([]),

  price: z.number().finite().nonnegative(),

  compareAtPrice: z.number().finite()
    .nonnegative().nullable().default(null),

  stock: z.number().int().nonnegative(),

  isFeatured: z.boolean().default(false),

  status: z.enum([
    "draft",
    "active",
    "archived"
  ]).default("draft"),

  seo: z.object({
    title: z.string().max(200).default(""),
    description: z.string().max(320).default("")
  }).strict().default({
    title: "",
    description: ""
  })
}).strict();

const validPrice = (data) =>
  data.compareAtPrice == null ||
  data.price == null ||
  data.compareAtPrice >= data.price;

export const productSchema = baseProductSchema.refine(
  validPrice,
  {
    message: "Compare price cannot be lower than selling price",
    path: ["compareAtPrice"]
  }
);

export const updateProductSchema = z.preprocess(
  (input) => {
    if (
      input &&
      typeof input === "object" &&
      !Array.isArray(input) &&
      Object.keys(input).length === 0
    ) {
      return null;
    }
    return input;
  },
  baseProductSchema
  .partial()
  .superRefine((data, ctx) => {
    if (!Object.keys(data).length) {
      ctx.addIssue({
        code: "custom",
        message: "At least one field is required"
      });
    }
  })
  .refine(validPrice, {
    message: "Invalid compare price",
    path: ["compareAtPrice"]
  })
);
