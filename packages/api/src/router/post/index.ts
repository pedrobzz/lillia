import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "../../trpc";
import { createPostSchema, getPostByIdSchema } from "./schema";
import { createPost } from "./service";

export const postRouter = createTRPCRouter({
  all: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.post.findMany({ orderBy: { id: "desc" } });
  }),
  byId: publicProcedure
    .input(getPostByIdSchema)
    .query(({ ctx, input }) => {
      return ctx.prisma.post.findFirst({ where: { id: input.id } });
    }),
  create: publicProcedure
    .input(createPostSchema)
    .mutation(({ input }) => {
      return createPost(input)
    }),
  delete: publicProcedure.input(z.string()).mutation(({ ctx, input }) => {
    return ctx.prisma.post.delete({ where: { id: input } });
  }),
});
