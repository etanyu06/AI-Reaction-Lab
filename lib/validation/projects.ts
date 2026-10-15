import { z } from "zod";

export const createProjectSchema = z.object({
  workspaceId: z.string().uuid().optional(),
  name: z.string().min(2, "Project name is required").max(120),
  description: z.string().max(1000).optional().or(z.literal(""))
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
