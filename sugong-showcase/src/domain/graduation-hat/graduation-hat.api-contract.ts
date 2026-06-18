import type { GraduationHat, GraduationHatToneFilter } from "./graduation-hat.types";

export type GraduationHatListResponse = {
  items: GraduationHat[];
  total: number;
  filters: {
    tone: GraduationHatToneFilter;
  };
};

export type GraduationHatDetailResponse = {
  item: GraduationHat;
};
