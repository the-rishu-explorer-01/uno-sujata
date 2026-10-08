import type { Product, ProductCategory } from "@/types/catalog";

/**
 * Categories group product lines listed on sujatabrass.com.
 * Product names are taken from that site's product list.
 */
export const categories: ProductCategory[] = [
  { slug: "precision-turned", name: "Precision Turned Components", summary: "Non-ferrous turned parts, forged and machined components." },
  { slug: "electrical", name: "Electrical Components", summary: "Brass electrical parts and MCB components." },
  { slug: "automotive", name: "Automotive Components", summary: "Automobile parts, carburettor screw adjusts, fuel jets, nozzles and cable adjusters." },
  { slug: "gas", name: "Gas Components", summary: "Brass gas parts." },
  { slug: "fasteners", name: "Fasteners", summary: "Brass grub screws, nuts and fasteners." },
  { slug: "pins-terminals", name: "Pins & Terminals", summary: "Electrical pins, plug pins, socket pins, switch plug pins and terminals." },
  { slug: "bushes-spacers-washers", name: "Bushes, Spacers & Washers", summary: "Brass bushes, spacers and washers." },
  { slug: "molding-inserts", name: "Molding Inserts", summary: "Brass molding inserts." },
  { slug: "connectors", name: "Connectors", summary: "Brass connectors." },
  { slug: "custom", name: "Custom Components", summary: "Tailor-made brass components built to your drawing." },
];

export const products: Product[] = [
  { slug: "non-ferrous-turned-components", name: "Non Ferrous Turned Components", categorySlug: "precision-turned" },
  { slug: "forged-and-machine-components", name: "Forged and Machine Components", categorySlug: "precision-turned" },
  { slug: "ball-pen-parts", name: "Ball Pen Parts", categorySlug: "precision-turned" },
  { slug: "brass-electrical-parts", name: "Brass Electrical Parts", categorySlug: "electrical" },
  { slug: "mcb-components", name: "MCB Components", categorySlug: "electrical" },
  { slug: "automobile-parts", name: "Brass Automobile Parts", categorySlug: "automotive" },
  { slug: "carburettor-screw-adjusts", name: "Carburettor Screw Adjusts", categorySlug: "automotive" },
  { slug: "fuel-jets", name: "Fuel Jets", categorySlug: "automotive" },
  { slug: "nozzles", name: "Nozzles", categorySlug: "automotive" },
  { slug: "cable-adjuster", name: "Cable Adjuster", categorySlug: "automotive" },
  { slug: "brass-gas-parts", name: "Brass Gas Parts", categorySlug: "gas" },
  { slug: "brass-grub-screws", name: "Brass Grub Screws", categorySlug: "fasteners" },
  { slug: "nuts", name: "Nuts", categorySlug: "fasteners" },
  { slug: "fasteners", name: "Fasteners", categorySlug: "fasteners" },
  { slug: "electrical-pins", name: "Electrical Pins", categorySlug: "pins-terminals" },
  { slug: "electrical-plug-pins", name: "Electrical Plug Pins", categorySlug: "pins-terminals" },
  { slug: "electrical-socket-pins", name: "Electrical Socket Pins", categorySlug: "pins-terminals" },
  { slug: "switch-plug-pins", name: "Switch Plug Pins", categorySlug: "pins-terminals" },
  { slug: "terminals", name: "Terminals", categorySlug: "pins-terminals" },
  { slug: "bushes", name: "Bushes", categorySlug: "bushes-spacers-washers" },
  { slug: "spacers", name: "Spacers", categorySlug: "bushes-spacers-washers" },
  { slug: "washers", name: "Washers", categorySlug: "bushes-spacers-washers" },
  { slug: "molding-inserts", name: "Brass Molding Inserts", categorySlug: "molding-inserts" },
  { slug: "connectors", name: "Connectors", categorySlug: "connectors" },
  { slug: "tailor-made-brass-components", name: "Tailor Made Brass Components", categorySlug: "custom" },
];
