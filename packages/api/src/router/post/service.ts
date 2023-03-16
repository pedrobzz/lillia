import { prisma } from "@acme/db";
import { type CreatePostSchema } from "./schema"

export const createPost = (input: CreatePostSchema) => {
  return prisma.post.create({ data: input });
}