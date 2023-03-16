import { z } from "zod";

export const getPostByIdSchema = z.object({ id: z.string() })

export const createPostSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
});

export type CreatePostSchema = z.infer<typeof createPostSchema>