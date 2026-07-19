import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const favoriteDevelopersTable = pgTable("favorite_developers", {
  id: serial("id").primaryKey(),
  githubLogin: text("github_login").notNull().unique(),
  avatarUrl: text("avatar_url").notNull(),
  name: text("name"),
  bio: text("bio"),
  followers: integer("followers"),
  publicRepos: integer("public_repos"),
  savedAt: timestamp("saved_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFavoriteDeveloperSchema = createInsertSchema(favoriteDevelopersTable).omit({ id: true, savedAt: true });
export type InsertFavoriteDeveloper = z.infer<typeof insertFavoriteDeveloperSchema>;
export type FavoriteDeveloper = typeof favoriteDevelopersTable.$inferSelect;
