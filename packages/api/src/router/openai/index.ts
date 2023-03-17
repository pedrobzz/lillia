/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import axios from "axios";
import {
  Configuration,
  OpenAIApi,
  type ChatCompletionRequestMessage,
  type CreateChatCompletionResponse,
} from "openai";
import { z } from "zod";

import { prisma } from "@acme/db";

import { createTRPCRouter, publicProcedure } from "../../trpc";
import {
  createPostSchema,
  deletePostSchema,
  type CreatePostSchema,
  type DeletePostSchema,
} from "../post/schema";
import { createPost } from "../post/service";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY || "",
});

const openai = new OpenAIApi(configuration);

interface Action {
  handle: (args: {
    context: CreateChatCompletionResponse & { prompt: string };
    // prompt: string;
    input: unknown;
  }) => Promise<Record<string, unknown>>;
  input: unknown;
  schema?: z.ZodSchema<unknown>;
}

const actionsToChatGPT = {
  "post.create": {
    input: {
      content: "",
      title: "",
    },
  },
  "post.delete": {
    input: {
      id: "",
    },
  },
} as const;

const actions = {
  "post.create": {
    schema: createPostSchema,
    input: {
      content: "content",
      title: "title",
    } as CreatePostSchema,
    handle: (args) => {
      const parsed = createPostSchema.safeParse(args.input);
      if (!parsed.success) throw new Error("Invalid input");

      return createPost(parsed.data);
    },
  },
  "post.delete": {
    schema: deletePostSchema,
    input: {
      id: "",
    } as DeletePostSchema,
    handle: async (args) => {
      const { context } = args;
      const allPosts = await prisma.post.findMany({
        select: {
          id: true,
          content: true,
          title: true,
        },
      });

      const rawMessages = [
        "As 'LillIA', You need to select a post to delete.",
        "The posts are:",
        JSON.stringify(allPosts),
        `Given the user prompt: "${context.prompt}", return only the ID of the post that matches the context from the user:`,
        "-------",
        "Return just the ID output, without extra context or explanation. Only the ID, without anything else.",
        "If you can't find a post to delete, return an empty string",
      ].join("\n ");

      const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [{ role: "system", content: rawMessages }],
      });

      console.log("===============");
      console.log(completion.data.usage);
      console.log("===============");

      const id = completion.data.choices[0]?.message?.content?.trim();

      if (!id) return {};

      const parsed = deletePostSchema.safeParse({ id });
      if (!parsed.success) throw new Error("Invalid input");

      await prisma.post.delete({
        where: { id: parsed.data.id },
      });
      return {};
    },
  },
} satisfies Record<keyof typeof actionsToChatGPT, Action>;

const convertInputIntoAction = (input: string): Action | null => {
  const inputAsJson = JSON.parse(input);

  const aiSchema = z.object({
    action: z
      .string()
      .refine((x) => x in actions)
      .transform((x) => x as keyof typeof actions),
    input: z.any(),
  });

  const parsed = aiSchema.safeParse(inputAsJson);

  if (parsed.success) {
    const { action } = parsed.data;
    const actionObj = actions[action];

    if (actionObj && "handle" in actionObj) {
      return {
        handle: actionObj.handle,
        input: parsed.data.input,
      };
    }
  }

  return null;
};

const handlePrompt = async ({ prompt }: { prompt: string }) => {
  const actionsString = JSON.stringify(actionsToChatGPT);
  const rawMessages = [
    "As 'LillIA', I receive a prompt and select the correct action from a JSON containing many actions. I only return the JSON.",
    "The actions and schemaInput in JSON format are:",
    actionsString,
    "-------",
    `Given the user prompt: "${prompt}", return only the JSON output according to the schema:`,
    `{ "action": /* e.g. post.createPost */, "input": /* schemaInput for the action */ }`,
    "If the user doesn't provide all input values, generate appropriate values based on context and action.",
    "For example, if the action is post.createPost and only the title is provided, create suitable content based on the title and context. You can be really creative here!",
    "Return just the JSON output, without extra context or explanation.",
  ].join("\n ");
  const messages: ChatCompletionRequestMessage[] = [
    { role: "system", content: rawMessages },
  ];
  const completion = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages,
  });

  console.log("===============");
  console.log(completion.data.usage);
  console.log("===============");

  let jsonResult: Record<string, unknown> | null = null;

  const response = convertInputIntoAction(
    completion.data.choices[0]?.message?.content ?? "{}",
  );

  if (response) {
    const { handle, input } = response;
    const result = await handle({
      context: { ...completion.data, prompt: prompt },
      input,
    });
    jsonResult = result;
  }
  return {
    result: completion.data.choices.map((c) => c.message?.content),
    messages: messages.map((m) => m.content),
    jsonResult,
  };
};

export const openAiRouter = createTRPCRouter({
  tellJoke: publicProcedure
    .input(
      z.object({
        prompt: z.string().min(1).max(255),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const completion = await openai.createChatCompletion({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content:
                "You are an assistant that says jokes, and only jokes. The user will give you a context, and you need to create a joke based on that context",
            },
            { role: "user", content: input.prompt },
          ],
        });

        return {
          result: completion.data.choices,
        };
      } catch (err) {
        // check if is axios error
        if (axios.isAxiosError(err)) {
          console.log(err.message);
          console.log(err.response?.data);
        }
        return {
          error: 500,
        };
      }
    }),

  handlePrompt: publicProcedure
    .input(
      z.object({
        prompt: z.string().min(1).max(255),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        return await handlePrompt(input);
      } catch (err) {
        // check if is axios error
        if (axios.isAxiosError(err)) {
          console.log(err.message);
          console.log(err.response?.data);
        } else {
          console.log(err);
        }
        return {
          error: 500,
        };
      }
    }),
});
