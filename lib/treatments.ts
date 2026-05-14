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
    { name: "Men's Haircut", description: "A precision men's cut tailored to your style. Includes a thorough consultation, wash, scissor or clipper work to your preferred length, and a finishing style with product. Suits any hair type or length.", durationMinutes: 30, priceCents: 2500, category: "Hair" },
    { name: "Beard Trim", description: "Expert beard shaping using clippers and a straight razor to define your jawline and neckline. Finished with a hot towel and beard oil to leave the skin soothed and the beard soft.", durationMinutes: 20, priceCents: 1500, category: "Grooming" },
    { name: "Hot Towel Shave", description: "A traditional wet shave for the closest finish possible. Includes pre-shave oil, a hot towel to open the pores, fresh lather, two passes with a straight razor, and a calming aftershave balm.", durationMinutes: 45, priceCents: 3500, category: "Grooming" },
    { name: "Hair & Beard Combo", description: "Cut and beard groom in a single appointment. Save versus booking them separately and walk out fully polished — perfect for a regular maintenance visit or before a big event.", durationMinutes: 60, priceCents: 4000, category: "Hair" },
    { name: "Skin Fade", description: "Razor-sharp fade tapering from skin level up to your chosen length on top. Includes detailed neckline and outline work. Specify low, mid, or high fade when booking.", durationMinutes: 45, priceCents: 3500, category: "Hair" },
    { name: "Buzz Cut", description: "An even all-over buzz to one or two clipper guard lengths of your choice. Quick, clean, and low-maintenance — ideal for short hair or when you want a fresh start.", durationMinutes: 20, priceCents: 1500, category: "Hair" },
    { name: "Kids Haircut", description: "Friendly, patient cut for under-12s. Includes a wash and style with kid-safe products in a relaxed setting designed to make children comfortable, even on their first visit.", durationMinutes: 25, priceCents: 2000, category: "Hair" },
    { name: "Eyebrow Trim", description: "A quick clean-up to keep stray hairs in check and maintain a tidy brow line. Ideal as an add-on to any haircut or beard groom.", durationMinutes: 10, priceCents: 800, category: "Grooming" },
  ],
  hair_salon: [
    { name: "Cut & Style", description: "Personalised consultation followed by a precision cut and full blow-dry styling. Includes a relaxing wash and conditioning treatment. You'll leave with hair that's easy to recreate at home.", durationMinutes: 60, priceCents: 6500, category: "Hair" },
    { name: "Blow Dry", description: "Wash, condition, and a professional blow-dry styled to your preference — sleek, voluminous, or beachy waves. Perfect for special occasions or a midweek refresh.", durationMinutes: 30, priceCents: 3500, category: "Styling" },
    { name: "Hair Colour", description: "Single all-over colour application by an experienced colourist. Includes a consultation, application, processing, wash, and conditioning treatment. Price may increase for hair longer than shoulder length.", durationMinutes: 120, priceCents: 9500, category: "Colour" },
    { name: "Highlights", description: "Hand-placed foil highlights to add lightness, dimension, and movement to your hair. Includes a toner, wash, and conditioning treatment. Final price depends on hair length and density.", durationMinutes: 150, priceCents: 12000, category: "Colour" },
    { name: "Balayage", description: "Hand-painted highlights for a soft, natural, sun-kissed finish that grows out beautifully without harsh regrowth lines. Includes a toner and blow-dry. Best refreshed every 3-4 months.", durationMinutes: 180, priceCents: 16000, category: "Colour" },
    { name: "Toner", description: "Refresh your existing colour or neutralise unwanted yellow or brassy tones. A quick add-on between full colour appointments to keep your shade looking salon-fresh.", durationMinutes: 30, priceCents: 3000, category: "Colour" },
    { name: "Deep Conditioning Treatment", description: "Intensive mask treatment to repair, hydrate, and strengthen dry or damaged hair. Recommended monthly to maintain healthy, shiny hair, especially after colour services or heat styling.", durationMinutes: 45, priceCents: 5500, category: "Treatment" },
    { name: "Keratin Smoothing", description: "Professional smoothing treatment that tames frizz, reduces drying time, and adds shine for up to 4 months. Includes consultation, application, sealing with heat, and aftercare advice.", durationMinutes: 180, priceCents: 18000, category: "Treatment" },
    { name: "Men's Cut", description: "Wash, cut, and style for short or medium-length hair. Includes a consultation to find the right shape for your face and lifestyle, plus styling product to finish.", durationMinutes: 30, priceCents: 3500, category: "Hair" },
    { name: "Updo / Special Occasion", description: "Polished updo or styling for weddings, parties, or photoshoots. Trial run available — book separately. Best to come with clean, day-old hair for the strongest hold.", durationMinutes: 75, priceCents: 7500, category: "Styling" },
  ],
  nail_salon: [
    { name: "Manicure", description: "Classic manicure including nail shaping, cuticle care, a brief hand massage, and your choice of regular polish. Lasts approximately 5-7 days with proper care.", durationMinutes: 45, priceCents: 3000, category: "Hands" },
    { name: "Pedicure", description: "Full pedicure with a warm foot soak, exfoliating scrub, cuticle work, nail shaping, a relaxing leg and foot massage, and your choice of polish to finish.", durationMinutes: 60, priceCents: 4000, category: "Feet" },
    { name: "Gel Manicure", description: "Manicure finished with long-lasting gel polish that stays glossy and chip-free for up to 3 weeks. Includes cuticle care, shaping, and your choice from a wide colour range.", durationMinutes: 60, priceCents: 4500, category: "Hands" },
    { name: "Gel Pedicure", description: "Full pedicure finished with long-wearing gel polish. Stays beautiful for 4-6 weeks — perfect for holidays, weddings, or sandal season.", durationMinutes: 75, priceCents: 5500, category: "Feet" },
    { name: "Acrylic Full Set", description: "Sculpted acrylic extensions in your choice of length, shape, and colour. Includes prep, application, shaping, and polish or gel finish. Lasts 3-4 weeks before infill.", durationMinutes: 90, priceCents: 6500, category: "Hands" },
    { name: "Acrylic Infill", description: "Top-up service for existing acrylic nails. Fills in new growth, reshapes the tips, and refreshes the polish or gel. Recommended every 2-3 weeks to keep nails looking new.", durationMinutes: 60, priceCents: 4500, category: "Hands" },
    { name: "BIAB / Builder Gel", description: "Builder-in-a-bottle gel overlay that strengthens and protects natural nails while adding subtle length and a high-gloss finish. Gentler than acrylics and longer-lasting than gel polish.", durationMinutes: 75, priceCents: 5500, category: "Hands" },
    { name: "Polish Change", description: "Quick repaint with regular polish — no shaping or cuticle work. Great for refreshing a colour between full manicures or matching to a specific outfit.", durationMinutes: 20, priceCents: 1500, category: "Hands" },
    { name: "Soak Off & Reshape", description: "Safely remove existing gel or acrylic enhancements without damaging the natural nail. Includes a tidy-up of the natural nail and a moisturising treatment to restore hydration.", durationMinutes: 30, priceCents: 2500, category: "Hands" },
    { name: "Nail Art", description: "Hand-painted designs, glitter, gems, chrome, or french tips added to any manicure. Price varies per nail — discuss your inspiration at booking. Add-on to any manicure service.", durationMinutes: 30, priceCents: 2500, category: "Add-on" },
  ],
  spa: [
    { name: "Swedish Massage 60min", description: "Classic full-body massage using long, gliding strokes to relax muscles, improve circulation, and reduce stress. Ideal for first-time massage clients or those wanting to unwind without deep pressure.", durationMinutes: 60, priceCents: 7500, category: "Massage" },
    { name: "Deep Tissue Massage 60min", description: "Firm-pressure massage targeting deep muscle layers to release chronic tension, knots, and tight areas. Best for active clients, desk workers, or those with specific problem spots.", durationMinutes: 60, priceCents: 8500, category: "Massage" },
    { name: "Hot Stone Massage", description: "Heated basalt stones placed and glided across the body to deeply relax muscles and melt away tension. Combines warmth, gentle pressure, and aromatherapy oils for a deeply restorative experience.", durationMinutes: 75, priceCents: 9500, category: "Massage" },
    { name: "Aromatherapy Massage", description: "Full-body massage with a personalised essential oil blend selected to balance, energise, or calm you depending on your needs that day. Includes a brief consultation to choose your oils.", durationMinutes: 60, priceCents: 7500, category: "Massage" },
    { name: "Couples Massage", description: "Two therapists, two clients — side-by-side relaxation in a shared treatment room. Perfect for anniversaries, birthdays, or just a peaceful afternoon together. Includes refreshments.", durationMinutes: 60, priceCents: 14000, category: "Massage" },
    { name: "Classic Facial", description: "Tailored facial including double cleanse, exfoliation, steam, gentle extractions, a treatment mask, facial massage, and moisturiser. Skin analysis and personalised product recommendations included.", durationMinutes: 60, priceCents: 7000, category: "Face" },
    { name: "Express Facial", description: "30-minute pick-me-up facial focused on cleansing, exfoliation, mask, and moisturiser. Ideal as a lunch-break treat, before a special occasion, or for maintaining a regular skincare routine.", durationMinutes: 30, priceCents: 4500, category: "Face" },
    { name: "Body Scrub", description: "Full-body exfoliation with a salt or sugar scrub to remove dead skin cells and improve circulation. Leaves the skin soft, smooth, and glowing. Often paired with a hydrating moisturiser finish.", durationMinutes: 45, priceCents: 6500, category: "Body" },
    { name: "Body Wrap", description: "Detoxifying or hydrating body wrap that purifies the skin or replenishes moisture. Includes light massage and a warm cocoon period to let the active ingredients absorb deeply.", durationMinutes: 60, priceCents: 8500, category: "Body" },
    { name: "Reflexology", description: "Pressure-point foot massage based on the principle that points on the feet correspond to organs and systems throughout the body. Deeply relaxing, balancing, and surprisingly energising.", durationMinutes: 45, priceCents: 5500, category: "Wellness" },
  ],
  beauty_salon: [
    { name: "Classic Facial", description: "Tailored facial with cleanse, exfoliation, steam, mask, facial massage, and moisturiser. Personalised to your skin type with product recommendations for at-home care between visits.", durationMinutes: 60, priceCents: 6500, category: "Face" },
    { name: "Eyebrow Wax", description: "Precise hot wax shaping of the brow line to remove stray hairs and define your natural arch. Includes brow mapping to find the most flattering shape for your face.", durationMinutes: 15, priceCents: 1500, category: "Waxing" },
    { name: "Lip & Chin Wax", description: "Quick hair removal for the upper lip and chin areas using hot or strip wax. Soothing post-wax balm applied to calm the skin. Results last 3-6 weeks.", durationMinutes: 15, priceCents: 1500, category: "Waxing" },
    { name: "Full Leg Wax", description: "Hair removal from thigh to ankle on both legs using warm wax. Includes pre and post-care products to soothe the skin and slow regrowth. Results last 3-4 weeks.", durationMinutes: 45, priceCents: 4500, category: "Waxing" },
    { name: "Full Body Wax", description: "Comprehensive waxing session covering arms, full legs, underarms, and a standard bikini line. The most cost-effective option for full hair removal — recommended every 4-6 weeks.", durationMinutes: 90, priceCents: 8500, category: "Waxing" },
    { name: "Lash Tint", description: "Semi-permanent dye applied to natural lashes to darken them — no mascara needed for 4-6 weeks. Quick treatment with a dramatic eye-opening effect, especially for fair-haired clients.", durationMinutes: 20, priceCents: 2000, category: "Lashes" },
    { name: "Lash Lift", description: "Curl natural lashes upward and outward for a wide-eyed lifted look that lasts 6-8 weeks. Add a lash tint at the same appointment for the fullest impact and dramatic finish.", durationMinutes: 45, priceCents: 4500, category: "Lashes" },
    { name: "Lash Extensions — Classic", description: "Individual synthetic lashes applied one-by-one to each natural lash for a natural-looking length and density boost. Lasts 3-4 weeks with infills. Includes aftercare advice.", durationMinutes: 90, priceCents: 7500, category: "Lashes" },
    { name: "Lash Extensions — Infill", description: "Top-up your existing lash extensions, replacing any that have shed and adding to new natural lash growth. Recommended every 2-3 weeks to keep the look full.", durationMinutes: 60, priceCents: 4500, category: "Lashes" },
    { name: "Brow Lamination", description: "Brow hairs are chemically set in your ideal direction for a fluffy, lifted look that lasts 6-8 weeks. Often paired with a tint and shape for the full transformation.", durationMinutes: 45, priceCents: 4500, category: "Brows" },
    { name: "Threading", description: "Ancient hair removal technique using a twisted cotton thread for precise, clean lines. Excellent for sensitive skin, detailed brow shaping, and lip and chin work.", durationMinutes: 15, priceCents: 1500, category: "Brows" },
    { name: "Spray Tan", description: "Even, natural-looking tan applied with an airbrush in a private booth. Develops over 6-8 hours and lasts 5-7 days. Comes with prep and aftercare guidance for the best results.", durationMinutes: 30, priceCents: 3500, category: "Tanning" },
  ],
  other: [],
};

export function isBusinessType(v: unknown): v is BusinessType {
  return typeof v === "string" && BUSINESS_TYPES.some((b) => b.value === v);
}
