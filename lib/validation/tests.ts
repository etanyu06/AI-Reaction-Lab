import { z } from "zod";

export const testTaskSchema = z.object({
  prompt: z.string().min(3, "Task text is required").max(1000),
  type: z.enum(["instruction", "question", "rating", "written_reaction"]).default("question")
});

export const createTestSchema = z.object({
  projectId: z.string().uuid(),
  workspaceId: z.string().uuid().optional(),
  name: z.string().min(2, "Test name is required").max(140),
  landingPageUrl: z.string().url("Enter a valid landing page URL").max(2048),
  participantIntro: z.string().min(10, "Add a short intro").max(2000),
  tasks: z.array(testTaskSchema).min(3, "Add at least 3 tasks").max(5, "Use at most 5 tasks"),
  requireScreen: z.boolean().default(true),
  requireCamera: z.boolean().default(true),
  requireMicrophone: z.boolean().default(true),
  captureClicks: z.boolean().default(true),
  captureScrolls: z.boolean().default(true),
  maxDurationSeconds: z.number().int().min(60).max(1200).default(900)
});

export type CreateTestInput = z.infer<typeof createTestSchema>;
