import type { GraduationHatQuery, GraduationHatRepository } from "../domain/graduation-hat/graduation-hat.repository";

export class GraduationHatService {
  constructor(private readonly repository: GraduationHatRepository) {}

  getGraduationHats(query?: GraduationHatQuery) {
    return this.repository.getAll(query);
  }

  getGraduationHatDetail(slug: string) {
    return this.repository.getBySlug(slug);
  }
}
