import { z } from 'zod';

const envSchema = z.object({
  TURSO_DATABASE_URL: z.string().url(),
  TURSO_AUTH_TOKEN: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  // 💳 Razorpay
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().min(1),
  RAZORPAY_KEY_SECRET: z.string().min(1),
  // 📧 Email & Notifications
  RESEND_API_KEY: z.string().min(1),
  ADMIN_EMAIL: z.string().email().optional(),
});

// "Bhai, agar env variables nahi mile toh yahi fat jayega"
// This ensures type safety and runtime validation for our environment variables
export const env = envSchema.parse(process.env);
