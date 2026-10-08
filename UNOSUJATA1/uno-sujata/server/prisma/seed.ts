/**
 * Seeds the database from the frontend's data files so both sides stay in sync.
 * Run with: npm run db:seed (uses tsx, which resolves these relative imports).
 */
import { PrismaClient } from "@prisma/client";
import { categories, products } from "../../src/data/products";
import { industries, capabilities } from "../../src/data/content";

const prisma = new PrismaClient();

async function main() {
  // Categories first, so products can reference them.
  const categoryIds = new Map<string, string>();
  for (const [i, c] of categories.entries()) {
    const row = await prisma.productCategory.upsert({
      where: { slug: c.slug },
      update: { name: c.name, summary: c.summary, sortOrder: i },
      create: { slug: c.slug, name: c.name, summary: c.summary, sortOrder: i },
    });
    categoryIds.set(c.slug, row.id);
  }

  for (const p of products) {
    const categoryId = categoryIds.get(p.categorySlug);
    if (!categoryId) throw new Error(`Unknown category for product ${p.slug}: ${p.categorySlug}`);
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: { name: p.name, categoryId },
      create: { slug: p.slug, name: p.name, categoryId, published: true },
    });
  }

  for (const [i, ind] of industries.entries()) {
    await prisma.industry.upsert({
      where: { slug: ind.slug },
      update: { name: ind.name, summary: ind.summary, sortOrder: i },
      create: { slug: ind.slug, name: ind.name, summary: ind.summary, sortOrder: i },
    });
  }

  for (const [i, cap] of capabilities.entries()) {
    await prisma.capability.upsert({
      where: { slug: cap.slug },
      update: { title: cap.title, description: cap.description, sortOrder: i },
      create: { slug: cap.slug, title: cap.title, description: cap.description, sortOrder: i },
    });
  }

  console.log(
    `[seed] ${categories.length} categories, ${products.length} products, ${industries.length} industries, ${capabilities.length} capabilities`
  );
}

main()
  .catch((err) => {
    console.error("[seed] failed:", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
