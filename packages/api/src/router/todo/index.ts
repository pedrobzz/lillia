import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "../../trpc";
import { createTodoSchema, getTodoByIdSchema, todoSchema } from "./schema";
import { createTodo } from "./service";

export const todoRouter = createTRPCRouter({
  all: publicProcedure.query(async ({ ctx }) => {
    const prismaTodos = await ctx.prisma.todo.findMany({
      orderBy: { updatedAt: "desc" },
    });
    return prismaTodos.map((todo) => todoSchema.parse(todo));
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
