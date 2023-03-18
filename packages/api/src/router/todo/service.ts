import { prisma } from "@acme/db";

import { type CreateTodoSchema } from "./schema";

export const createTodo = (input: CreateTodoSchema) => {
  return prisma.todo.create({ data: input });
};
