import { z } from "zod";

export const getTodoByIdSchema = z.object({ id: z.string().cuid() });

export const createTodoSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
});

export const deleteTodoSchema = z.object({ id: z.string().cuid() });

export const updateTodoSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
});

export type CreateTodoSchema = z.infer<typeof createTodoSchema>;
export type DeleteTodoSchema = z.infer<typeof deleteTodoSchema>;
export type UpdateTodoSchema = z.infer<typeof updateTodoSchema>;
