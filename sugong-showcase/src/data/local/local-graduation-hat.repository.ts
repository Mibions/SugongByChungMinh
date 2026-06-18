import type { GraduationHatRepository, GraduationHatQuery } from "../../domain/graduation-hat/graduation-hat.repository";
import type { GraduationHat } from "../../domain/graduation-hat/graduation-hat.types";

export class LocalGraduationHatRepository implements GraduationHatRepository {
  constructor(private readonly hats: GraduationHat[]) {}

  async getAll(query: GraduationHatQuery = {}): Promise<GraduationHat[]> {
    return this.hats
      .filter((hat) => hat.status === "published")
      .filter((hat) => !query.featured || hat.isFeatured)
      .filter((hat) => !query.tone || query.tone === "all" || hat.tone === query.tone)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async getBySlug(slug: string): Promise<GraduationHat | null> {
    return this.hats.find((hat) => hat.slug === slug && hat.status === "published") ?? null;
  }
}
