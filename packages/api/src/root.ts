import { openAiRouter } from "./router/openai";
import { todoRouter } from "./router/todo";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  todo: todoRouter,
  openAi: openAiRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
