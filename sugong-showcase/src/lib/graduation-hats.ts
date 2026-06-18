import { graduationHats } from "../data/local/graduation-hats";
import { LocalGraduationHatRepository } from "../data/local/local-graduation-hat.repository";
import { GraduationHatService } from "../services/graduation-hat.service";

export function createGraduationHatService() {
  return new GraduationHatService(new LocalGraduationHatRepository(graduationHats));
}
