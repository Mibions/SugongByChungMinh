import type { Product } from "../../domain/product/product.types";
import { graduationHats } from "./graduation-hats";
import { localProducts } from "./products";
import { toteBags } from "./tote-bag";

export const catalogProducts: Product[] = [
  ...localProducts,
  ...toteBags,
  ...graduationHats,
];
