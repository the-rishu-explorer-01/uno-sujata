import { z } from "zod";

export const quoteRequestSchema = z.object({
  name: z.string().min(2, "Enter your name"),
  company: z.string().min(2, "Enter your company name"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(7, "Enter a phone number"),
  country: z.string().min(2, "Enter your country"),
  requirement: z.string().min(20, "Describe your requirement in at least 20 characters"),
  quantity: z.string().optional(),
  hasDrawing: z.boolean(),
});

export type QuoteRequest = z.infer<typeof quoteRequestSchema>;
