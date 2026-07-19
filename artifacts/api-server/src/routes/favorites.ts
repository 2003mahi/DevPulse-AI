import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, favoriteDevelopersTable } from "@workspace/db";
import {
  AddFavoriteBody,
  RemoveFavoriteParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/favorites", async (_req, res): Promise<void> => {
  const favs = await db
    .select()
    .from(favoriteDevelopersTable)
    .orderBy(favoriteDevelopersTable.savedAt);

  res.json(
    favs.map((f) => ({
      ...f,
      savedAt: f.savedAt.toISOString(),
    })),
  );
});

router.post("/favorites", async (req, res): Promise<void> => {
  const parsed = AddFavoriteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Upsert: if login already exists, return existing record
  const existing = await db
    .select()
    .from(favoriteDevelopersTable)
    .where(eq(favoriteDevelopersTable.githubLogin, parsed.data.githubLogin));

  if (existing.length > 0) {
    res.status(201).json({
      ...existing[0],
      savedAt: existing[0].savedAt.toISOString(),
    });
    return;
  }

  const [fav] = await db
    .insert(favoriteDevelopersTable)
    .values({
      githubLogin: parsed.data.githubLogin,
      avatarUrl: parsed.data.avatarUrl,
      name: parsed.data.name,
      bio: parsed.data.bio,
      followers: parsed.data.followers,
      publicRepos: parsed.data.publicRepos,
    })
    .returning();

  res.status(201).json({
    ...fav,
    savedAt: fav.savedAt.toISOString(),
  });
});

router.delete("/favorites/:githubLogin", async (req, res): Promise<void> => {
  const params = RemoveFavoriteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db
    .delete(favoriteDevelopersTable)
    .where(eq(favoriteDevelopersTable.githubLogin, params.data.githubLogin));

  res.sendStatus(204);
});

export default router;
