import { z } from "zod";

export const getPostByIdSchema = z.object({ id: z.string().cuid() });

export const createPostSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
});

export const deletePostSchema = z.object({ id: z.string().cuid() });

export const updatePostSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
});

export type CreatePostSchema = z.infer<typeof createPostSchema>;
export type DeletePostSchema = z.infer<typeof deletePostSchema>;
export type UpdatePostSchema = z.infer<typeof updatePostSchema>;
