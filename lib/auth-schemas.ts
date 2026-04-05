import { z } from "zod";

const usernamePattern = /^[a-zA-Z0-9_.]+$/;

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters.")
  .max(24, "Username must be 24 characters or fewer.")
  .regex(
    usernamePattern,
    "Use only letters, numbers, underscores, and periods.",
  );

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Enter your email or username."),
  password: z.string().min(1, "Enter your password."),
  rememberMe: z.boolean().optional(),
});

export const registerSchema = z.object({
  username: usernameSchema,
  displayName: z
    .string()
    .trim()
    .max(40, "Display name must be 40 characters or fewer.")
    .optional()
    .or(z.literal("")),
  email: z.string().trim().email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(100, "Password must be 100 characters or fewer.")
    .regex(/[a-zA-Z]/, "Include at least one letter.")
    .regex(/[0-9]/, "Include at least one number.")
    .regex(/[^a-zA-Z0-9]/, "Include at least one special character."),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
