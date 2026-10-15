import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z.string().min(2, "Workspace name is required").max(80),
  slug: z
    .string()
    .min(3)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens")
    .optional()
    .or(z.literal(""))
});

export const inviteMemberSchema = z.object({
  email: z.string().email("Enter a valid email"),
  role: z.enum(["admin", "researcher", "viewer"])
});
