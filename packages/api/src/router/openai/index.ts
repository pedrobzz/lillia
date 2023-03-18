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
import { createWhisper } from "@acme/whisper";

import { createTRPCRouter, publicProcedure } from "../../trpc";
import {
  createTodoSchema,
  deleteTodoSchema,
  todoPossibleStatus,
  updateTodoSchema,
  type CreateTodoSchema,
  type DeleteTodoSchema,
  type UpdateTodoSchema,
} from "../todo/schema";
import { createTodo } from "../todo/service";

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
  input?: unknown;
  schema?: z.ZodSchema<unknown>;
}

const actionsToChatGPT = {
  "todo.create": {
    input: {
      content: "",
      title: "",
      status: `Enum(${todoPossibleStatus.join(",")})`,
    },
  },
  "todo.delete": {},

  "todo.update": {},
} as const;

const actions = {
  "todo.create": {
    schema: createTodoSchema,
    input: {
      content: "content",
      title: "title",
    } as CreateTodoSchema,
    handle: (args) => {
      const parsed = createTodoSchema.safeParse(args.input);
      if (!parsed.success) throw new Error("Invalid input");

      return createTodo(parsed.data);
    },
  },
  "todo.delete": {
    schema: deleteTodoSchema,
    input: {
      id: "",
    } as DeleteTodoSchema,
    handle: async (args) => {
      const { context } = args;
      const allTodos = await prisma.todo.findMany({
        select: {
          id: true,
          content: true,
          title: true,
        },
      });

      const rawMessages = [
        "As 'LillIA', You need to select a todo to delete.",
        "The posts are:",
        JSON.stringify(allTodos),
        `Given the user prompt: "${context.prompt}", return only the ID of the todo that matches the context from the user:`,
        "-------",
        "Return just the ID output, without extra context or explanation. Only the ID, without anything else.",
        'If you can\'t find a todo to delete, return only "{}"',
      ].join("\n");

      const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [{ role: "system", content: rawMessages }],
      });

      console.log("===============");
      console.log(completion.data.usage);
      console.log("===============");

      const id = completion.data.choices[0]?.message?.content?.trim();

      if (!id || id === "{}") return {};

      const parsed = deleteTodoSchema.safeParse({ id });
      if (!parsed.success) throw new Error(`Invalid Input: ${id}`);

      return await prisma.todo.delete({
        where: { id: parsed.data.id },
      });
    },
  },
  "todo.update": {
    schema: updateTodoSchema,
    input: {
      id: "",
    } as UpdateTodoSchema,
    handle: async (args) => {
      const { context } = args;
      const allTodos = await prisma.todo.findMany({
        select: {
          id: true,
          content: true,
          title: true,
        },
      });

      const rawMessages = [
        "As 'LillIA', You need to select a todo to update",
        "The posts are:",
        JSON.stringify(allTodos),
        `Given the user prompt: "${context.prompt}", return only the updated as a JSON according to the schema:`,
        `{ "id", "title", "content", "status" }`,
        `Possible Status: ${todoPossibleStatus.join(", ")}`,
        `only the field "id" is required, so you don't need to provide the other fields if you don't want to update them.`,
        "-------",
        "Return Just the JSON, without extra context or explanation.",
        'If you can\'t find a todo to delete, return only "{}"',
      ].join("\n");

      const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [{ role: "system", content: rawMessages }],
      });

      console.log("===============");
      console.log(completion.data.usage);
      console.log("===============");

      const input = JSON.parse(
        completion.data.choices[0]?.message?.content?.trim() ?? "{}",
      );

      if (!input || input === "{}") {
        console.log("No input");
        console.log(input);
        console.log(
          completion.data.choices[0]?.message?.content?.trim() ?? "{}",
        );
        return {};
      }

      const parsed = updateTodoSchema.safeParse(input);
      if (!parsed.success) throw new Error(`Invalid Input: ${input}`);
      return await prisma.todo.update({
        where: { id: parsed.data.id },
        data: {
          title: parsed.data.title,
          content: parsed.data.content,
          status: parsed.data.status,
        },
      });
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
    `{ "action": /* e.g. todo.createTodo */, "input": /* schemaInput for the action. This shouldn't be present if there's no schemaInput. */ }`,
    "If the user doesn't provide all input values, generate appropriate values based on context and action.",
    "For example, if the action is todo.createTodo and only the title is provided, create suitable content based on the title and context. You can be really creative here!",
    "Return just the JSON output, without extra context or explanation. If you can't do this, return only '{}'",
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

  try {
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
  } catch (err) {
    console.log(completion.data.choices[0]?.message?.content);
    console.error(err);
    throw err;
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

  handleAudioPrompt: publicProcedure
    .input(
      z.object({
        /**
         * const binaryData = await e.data.arrayBuffer();
         * const base64Data = Buffer.from(binaryData).toString("base64");
         */
        prompt: z.string().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      const { prompt } = input;
      const whisper = await createWhisper({
        model: "small",
      });

      const transcription = await whisper.transcriptFromB64(prompt);
      const response = await handlePrompt({ prompt: transcription });
      return response;
    }),
});
