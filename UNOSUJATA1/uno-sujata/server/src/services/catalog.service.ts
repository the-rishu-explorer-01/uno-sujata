import { prisma } from "../utils/prisma.js";
import { HttpError } from "../utils/http.js";

export const catalogService = {
  async categories() {
    return prisma.productCategory.findMany({
      orderBy: { sortOrder: "asc" },
      select: { slug: true, name: true, summary: true },
    });
  },

  async products(categorySlug?: string) {
    const rows = await prisma.product.findMany({
      where: {
        published: true,
        ...(categorySlug ? { category: { slug: categorySlug } } : {}),
      },
      orderBy: { name: "asc" },
      select: { slug: true, name: true, category: { select: { slug: true } } },
    });
    return rows.map((p) => ({ slug: p.slug, name: p.name, categorySlug: p.category.slug }));
  },

  async productBySlug(slug: string) {
    const p = await prisma.product.findFirst({
      where: { slug, published: true },
      select: {
        slug: true,
        name: true,
        description: true,
        category: { select: { slug: true, name: true } },
      },
    });
    if (!p) throw new HttpError(404, "Product not found");
    return {
      slug: p.slug,
      name: p.name,
      description: p.description,
      categorySlug: p.category.slug,
      categoryName: p.category.name,
    };
  },

  async industries() {
    return prisma.industry.findMany({
      orderBy: { sortOrder: "asc" },
      select: { slug: true, name: true, summary: true },
    });
  },

  async capabilities() {
    return prisma.capability.findMany({
      orderBy: { sortOrder: "asc" },
      select: { slug: true, title: true, description: true },
    });
  },
};
