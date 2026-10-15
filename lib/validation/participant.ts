import { z } from "zod";

export const consentSchema = z.object({
  token: z.string().min(16),
  accepted: z.literal(true, {
    errorMap: () => ({ message: "Consent is required to continue" })
  })
});

export const feedbackSchema = z.object({
  sessionId: z.string().uuid(),
  responses: z.array(
    z.object({
      taskId: z.string().uuid().optional(),
      value: z.string().max(5000)
    })
  )
});
