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
  description: string;
  durationMinutes: number;
  priceCents: number;
  category: string;
};

export const TREATMENT_SUGGESTIONS: Record<BusinessType, TreatmentSuggestion[]> = {
  barbershop: [
    { name: "Men's Haircut", description: "A classic men's cut tailored to your style — scissor work, clippers, or a mix.", durationMinutes: 30, priceCents: 2500, category: "Hair" },
    { name: "Beard Trim", description: "Sharp shaping and lining for a clean, defined beard.", durationMinutes: 20, priceCents: 1500, category: "Grooming" },
    { name: "Hot Towel Shave", description: "Traditional wet shave finished with a steaming hot towel.", durationMinutes: 45, priceCents: 3500, category: "Grooming" },
    { name: "Hair & Beard Combo", description: "Cut and beard groom in one appointment — save versus booking separately.", durationMinutes: 60, priceCents: 4000, category: "Hair" },
    { name: "Skin Fade", description: "Tight precision fade from skin to your chosen length.", durationMinutes: 45, priceCents: 3500, category: "Hair" },
    { name: "Buzz Cut", description: "Clean, even buzz to one or two clipper guard lengths.", durationMinutes: 20, priceCents: 1500, category: "Hair" },
    { name: "Kids Haircut", description: "Quick, friendly cut for under-12s.", durationMinutes: 25, priceCents: 2000, category: "Hair" },
    { name: "Eyebrow Trim", description: "Quick tidy-up to keep your brows in shape.", durationMinutes: 10, priceCents: 800, category: "Grooming" },
  ],
  hair_salon: [
    { name: "Cut & Style", description: "Personal consultation, cut, and blow-dry styling.", durationMinutes: 60, priceCents: 6500, category: "Hair" },
    { name: "Blow Dry", description: "Wash and blow-dry — leave with salon-finish hair.", durationMinutes: 30, priceCents: 3500, category: "Styling" },
    { name: "Hair Colour", description: "Single all-over colour application by an experienced colourist.", durationMinutes: 120, priceCents: 9500, category: "Colour" },
    { name: "Highlights", description: "Foil highlights to add lightness and dimension.", durationMinutes: 150, priceCents: 12000, category: "Colour" },
    { name: "Balayage", description: "Hand-painted lights for a natural, sun-kissed finish.", durationMinutes: 180, priceCents: 16000, category: "Colour" },
    { name: "Toner", description: "Refresh your colour or neutralise unwanted tones.", durationMinutes: 30, priceCents: 3000, category: "Colour" },
    { name: "Deep Conditioning Treatment", description: "Intensive mask to repair and nourish dry, damaged hair.", durationMinutes: 45, priceCents: 5500, category: "Treatment" },
    { name: "Keratin Smoothing", description: "Long-lasting smoothing treatment that tames frizz for months.", durationMinutes: 180, priceCents: 18000, category: "Treatment" },
    { name: "Men's Cut", description: "Wash, cut, and style for short or medium hair.", durationMinutes: 30, priceCents: 3500, category: "Hair" },
    { name: "Updo / Special Occasion", description: "Polished styling for weddings, parties, or events.", durationMinutes: 75, priceCents: 7500, category: "Styling" },
  ],
  nail_salon: [
    { name: "Manicure", description: "Shape, cuticle care, and regular polish for healthy hands.", durationMinutes: 45, priceCents: 3000, category: "Hands" },
    { name: "Pedicure", description: "Foot soak, exfoliation, nail care, and polish.", durationMinutes: 60, priceCents: 4000, category: "Feet" },
    { name: "Gel Manicure", description: "Long-lasting gel polish that stays glossy for up to 3 weeks.", durationMinutes: 60, priceCents: 4500, category: "Hands" },
    { name: "Gel Pedicure", description: "Pedicure finished with long-wearing gel polish.", durationMinutes: 75, priceCents: 5500, category: "Feet" },
    { name: "Acrylic Full Set", description: "Sculpted acrylic extensions in your chosen length and shape.", durationMinutes: 90, priceCents: 6500, category: "Hands" },
    { name: "Acrylic Infill", description: "Top-up your acrylics with new growth filled and reshaped.", durationMinutes: 60, priceCents: 4500, category: "Hands" },
    { name: "BIAB / Builder Gel", description: "Strengthening overlay that protects natural nails.", durationMinutes: 75, priceCents: 5500, category: "Hands" },
    { name: "Polish Change", description: "Quick repaint with regular polish — no shape or cuticle work.", durationMinutes: 20, priceCents: 1500, category: "Hands" },
    { name: "Soak Off & Reshape", description: "Safely remove gel or acrylic and tidy the natural nail.", durationMinutes: 30, priceCents: 2500, category: "Hands" },
    { name: "Nail Art", description: "Hand-painted details, glitter, or gems added to any manicure.", durationMinutes: 30, priceCents: 2500, category: "Add-on" },
  ],
  spa: [
    { name: "Swedish Massage 60min", description: "Classic full-body massage to relax muscles and reduce stress.", durationMinutes: 60, priceCents: 7500, category: "Massage" },
    { name: "Deep Tissue Massage 60min", description: "Firm pressure massage targeting deep tension and knots.", durationMinutes: 60, priceCents: 8500, category: "Massage" },
    { name: "Hot Stone Massage", description: "Warm basalt stones used to deeply relax muscles.", durationMinutes: 75, priceCents: 9500, category: "Massage" },
    { name: "Aromatherapy Massage", description: "Tailored essential oil blend for a calming, balancing experience.", durationMinutes: 60, priceCents: 7500, category: "Massage" },
    { name: "Couples Massage", description: "Two therapists, two clients — side-by-side relaxation.", durationMinutes: 60, priceCents: 14000, category: "Massage" },
    { name: "Classic Facial", description: "Cleanse, exfoliate, mask, and moisturise tailored to your skin.", durationMinutes: 60, priceCents: 7000, category: "Face" },
    { name: "Express Facial", description: "30-minute pick-me-up facial for instant glow.", durationMinutes: 30, priceCents: 4500, category: "Face" },
    { name: "Body Scrub", description: "Full-body exfoliation to leave skin soft and refreshed.", durationMinutes: 45, priceCents: 6500, category: "Body" },
    { name: "Body Wrap", description: "Detoxifying or hydrating wrap finished with a light massage.", durationMinutes: 60, priceCents: 8500, category: "Body" },
    { name: "Reflexology", description: "Pressure-point foot work to balance body energy.", durationMinutes: 45, priceCents: 5500, category: "Wellness" },
  ],
  beauty_salon: [
    { name: "Classic Facial", description: "Tailored cleanse, exfoliate, mask, and moisturise.", durationMinutes: 60, priceCents: 6500, category: "Face" },
    { name: "Eyebrow Wax", description: "Quick shaping and tidy of the brow line.", durationMinutes: 15, priceCents: 1500, category: "Waxing" },
    { name: "Lip & Chin Wax", description: "Hair removal for upper lip and chin areas.", durationMinutes: 15, priceCents: 1500, category: "Waxing" },
    { name: "Full Leg Wax", description: "Hair removal from thigh to ankle.", durationMinutes: 45, priceCents: 4500, category: "Waxing" },
    { name: "Full Body Wax", description: "Comprehensive waxing for arms, legs, underarms, and bikini.", durationMinutes: 90, priceCents: 8500, category: "Waxing" },
    { name: "Lash Tint", description: "Darken your natural lashes — no mascara needed for weeks.", durationMinutes: 20, priceCents: 2000, category: "Lashes" },
    { name: "Lash Lift", description: "Curl natural lashes upward for a wide-eyed lift.", durationMinutes: 45, priceCents: 4500, category: "Lashes" },
    { name: "Lash Extensions — Classic", description: "Individual extensions for a natural, lengthened look.", durationMinutes: 90, priceCents: 7500, category: "Lashes" },
    { name: "Lash Extensions — Infill", description: "Top-up your existing lash extensions.", durationMinutes: 60, priceCents: 4500, category: "Lashes" },
    { name: "Brow Lamination", description: "Set brows in your ideal shape for a fuller, fluffier look.", durationMinutes: 45, priceCents: 4500, category: "Brows" },
    { name: "Threading", description: "Precise hair removal using a twisted cotton thread.", durationMinutes: 15, priceCents: 1500, category: "Brows" },
    { name: "Spray Tan", description: "Natural-looking tan that develops in a few hours.", durationMinutes: 30, priceCents: 3500, category: "Tanning" },
  ],
  other: [],
};

export function isBusinessType(v: unknown): v is BusinessType {
  return typeof v === "string" && BUSINESS_TYPES.some((b) => b.value === v);
}
