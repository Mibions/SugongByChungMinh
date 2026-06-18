import type { GraduationHat, GraduationHatToneFilter } from "./graduation-hat.types";

export type GraduationHatQuery = {
  tone?: GraduationHatToneFilter;
  featured?: boolean;
};

export interface GraduationHatRepository {
  getAll(query?: GraduationHatQuery): Promise<GraduationHat[]>;
  getBySlug(slug: string): Promise<GraduationHat | null>;
}
