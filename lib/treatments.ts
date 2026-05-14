export type BusinessType =
  | "barbershop"
  | "hair_salon"
  | "nail_salon"
  | "spa"
  | "beauty_salon"
  | "other";

export const BUSINESS_TYPES: { value: BusinessType; label: string }[] = [
  { value: "barbershop", label: "Barbershop" },
  { value: "hair_salon", label: "Hair salon" },
  { value: "nail_salon", label: "Nail salon" },
  { value: "spa", label: "Spa / wellness" },
  { value: "beauty_salon", label: "Beauty salon" },
  { value: "other", label: "Other" },
];

export type TreatmentSuggestion = {
  name: string;
  durationMinutes: number;
  priceCents: number;
  category: string;
};

export const TREATMENT_SUGGESTIONS: Record<BusinessType, TreatmentSuggestion[]> = {
  barbershop: [
    { name: "Men's Haircut", durationMinutes: 30, priceCents: 2500, category: "Hair" },
    { name: "Beard Trim", durationMinutes: 20, priceCents: 1500, category: "Grooming" },
    { name: "Hot Towel Shave", durationMinutes: 45, priceCents: 3500, category: "Grooming" },
    { name: "Hair & Beard Combo", durationMinutes: 60, priceCents: 4000, category: "Hair" },
    { name: "Skin Fade", durationMinutes: 45, priceCents: 3500, category: "Hair" },
    { name: "Buzz Cut", durationMinutes: 20, priceCents: 1500, category: "Hair" },
    { name: "Kids Haircut", durationMinutes: 25, priceCents: 2000, category: "Hair" },
    { name: "Eyebrow Trim", durationMinutes: 10, priceCents: 800, category: "Grooming" },
  ],
  hair_salon: [
    { name: "Cut & Style", durationMinutes: 60, priceCents: 6500, category: "Hair" },
    { name: "Blow Dry", durationMinutes: 30, priceCents: 3500, category: "Styling" },
    { name: "Hair Colour", durationMinutes: 120, priceCents: 9500, category: "Colour" },
    { name: "Highlights", durationMinutes: 150, priceCents: 12000, category: "Colour" },
    { name: "Balayage", durationMinutes: 180, priceCents: 16000, category: "Colour" },
    { name: "Toner", durationMinutes: 30, priceCents: 3000, category: "Colour" },
    { name: "Deep Conditioning Treatment", durationMinutes: 45, priceCents: 5500, category: "Treatment" },
    { name: "Keratin Smoothing", durationMinutes: 180, priceCents: 18000, category: "Treatment" },
    { name: "Men's Cut", durationMinutes: 30, priceCents: 3500, category: "Hair" },
    { name: "Updo / Special Occasion", durationMinutes: 75, priceCents: 7500, category: "Styling" },
  ],
  nail_salon: [
    { name: "Manicure", durationMinutes: 45, priceCents: 3000, category: "Hands" },
    { name: "Pedicure", durationMinutes: 60, priceCents: 4000, category: "Feet" },
    { name: "Gel Manicure", durationMinutes: 60, priceCents: 4500, category: "Hands" },
    { name: "Gel Pedicure", durationMinutes: 75, priceCents: 5500, category: "Feet" },
    { name: "Acrylic Full Set", durationMinutes: 90, priceCents: 6500, category: "Hands" },
    { name: "Acrylic Infill", durationMinutes: 60, priceCents: 4500, category: "Hands" },
    { name: "BIAB / Builder Gel", durationMinutes: 75, priceCents: 5500, category: "Hands" },
    { name: "Polish Change", durationMinutes: 20, priceCents: 1500, category: "Hands" },
    { name: "Soak Off & Reshape", durationMinutes: 30, priceCents: 2500, category: "Hands" },
    { name: "Nail Art", durationMinutes: 30, priceCents: 2500, category: "Add-on" },
  ],
  spa: [
    { name: "Swedish Massage 60min", durationMinutes: 60, priceCents: 7500, category: "Massage" },
    { name: "Deep Tissue Massage 60min", durationMinutes: 60, priceCents: 8500, category: "Massage" },
    { name: "Hot Stone Massage", durationMinutes: 75, priceCents: 9500, category: "Massage" },
    { name: "Aromatherapy Massage", durationMinutes: 60, priceCents: 7500, category: "Massage" },
    { name: "Couples Massage", durationMinutes: 60, priceCents: 14000, category: "Massage" },
    { name: "Classic Facial", durationMinutes: 60, priceCents: 7000, category: "Face" },
    { name: "Express Facial", durationMinutes: 30, priceCents: 4500, category: "Face" },
    { name: "Body Scrub", durationMinutes: 45, priceCents: 6500, category: "Body" },
    { name: "Body Wrap", durationMinutes: 60, priceCents: 8500, category: "Body" },
    { name: "Reflexology", durationMinutes: 45, priceCents: 5500, category: "Wellness" },
  ],
  beauty_salon: [
    { name: "Classic Facial", durationMinutes: 60, priceCents: 6500, category: "Face" },
    { name: "Eyebrow Wax", durationMinutes: 15, priceCents: 1500, category: "Waxing" },
    { name: "Lip & Chin Wax", durationMinutes: 15, priceCents: 1500, category: "Waxing" },
    { name: "Full Leg Wax", durationMinutes: 45, priceCents: 4500, category: "Waxing" },
    { name: "Full Body Wax", durationMinutes: 90, priceCents: 8500, category: "Waxing" },
    { name: "Lash Tint", durationMinutes: 20, priceCents: 2000, category: "Lashes" },
    { name: "Lash Lift", durationMinutes: 45, priceCents: 4500, category: "Lashes" },
    { name: "Lash Extensions — Classic", durationMinutes: 90, priceCents: 7500, category: "Lashes" },
    { name: "Lash Extensions — Infill", durationMinutes: 60, priceCents: 4500, category: "Lashes" },
    { name: "Brow Lamination", durationMinutes: 45, priceCents: 4500, category: "Brows" },
    { name: "Threading", durationMinutes: 15, priceCents: 1500, category: "Brows" },
    { name: "Spray Tan", durationMinutes: 30, priceCents: 3500, category: "Tanning" },
  ],
  other: [],
};

export function isBusinessType(v: unknown): v is BusinessType {
  return typeof v === "string" && BUSINESS_TYPES.some((b) => b.value === v);
}
