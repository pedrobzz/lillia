import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "../../trpc";
import { createTodoSchema, getTodoByIdSchema } from "./schema";
import { createTodo } from "./service";

export const todoRouter = createTRPCRouter({
  all: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.todo.findMany({ orderBy: { id: "desc" } });
  }),
  byId: publicProcedure.input(getTodoByIdSchema).query(({ ctx, input }) => {
    return ctx.prisma.todo.findFirst({ where: { id: input.id } });
  }),
  create: publicProcedure.input(createTodoSchema).mutation(({ input }) => {
    return createTodo(input);
  }),
  delete: publicProcedure.input(z.string()).mutation(({ ctx, input }) => {
    return ctx.prisma.todo.delete({ where: { id: input } });
  }),
});
