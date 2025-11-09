// src/models/car-model.ts

export interface CarModel {
  slug: string; // Unique identifier, e.g., "challenger"
  name: string; // Display name, e.g., "Dodge Challenger"
  category: string; // Type: "muscle-car", "suv", "coupe", "electric", etc.
  icon: string; // Icon identifier, e.g., "icon-coupe"
  href: string; // Link to detail page
  years: string; // Year range, e.g., "2008–2023"

  overview: {
    manufacturer: string; // e.g., "Dodge"
    bodyStyle: string; // e.g., "Coupe"
    history: string; // e.g., "Modern generation (2008–2023)"
  };

  trims: Array<{
    name: string; // e.g., "SXT"
    engine: string; // e.g., "3.6L V6"
    horsepower: number; // e.g., 303
    torque: number; // e.g., 268
    zeroToSixty: string; // e.g., "~6.3 s"
    topSpeed: string; // e.g., "~130 mph"
    years: string; // e.g., "2011–2023"
  }>;

  modifications: Array<{
    name: string; // e.g., "Cold Air Intake"
    type: string; // e.g., "Performance (Intake)"
    hpGain: string; // e.g., "+~5 hp"
    costRange: string; // e.g., "$150–$400"
    install: string; // e.g., "Bolt-on; DIY-friendly"
  }>;

  history: string[]; // Array of historical milestones
}
