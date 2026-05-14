import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("changeme", 10);

  // Demo studio — multi-discipline beauty studio
  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo" },
    update: { name: "Maison Bloom" },
    create: {
      slug: "demo",
      name: "Maison Bloom",
      email: "owner@demo.local",
      timezone: "Europe/London",
      currency: "GBP",
      subscriptionStatus: "trialing",
      seatCount: 4,
      users: {
        create: { email: "owner@demo.local", passwordHash, name: "Studio Owner", role: "owner" },
      },
    },
  });

  // Business hours
  const hours = [
    { dayOfWeek: 0, open: false, openTime: "10:00", closeTime: "16:00" },
    { dayOfWeek: 1, open: true,  openTime: "09:00", closeTime: "18:00" },
    { dayOfWeek: 2, open: true,  openTime: "09:00", closeTime: "18:00" },
    { dayOfWeek: 3, open: true,  openTime: "09:00", closeTime: "20:00" },
    { dayOfWeek: 4, open: true,  openTime: "09:00", closeTime: "20:00" },
    { dayOfWeek: 5, open: true,  openTime: "09:00", closeTime: "20:00" },
    { dayOfWeek: 6, open: true,  openTime: "10:00", closeTime: "18:00" },
  ];
  for (const h of hours) {
    await prisma.businessHours.upsert({
      where: { tenantId_dayOfWeek: { tenantId: tenant.id, dayOfWeek: h.dayOfWeek } },
      update: h,
      create: { ...h, tenantId: tenant.id },
    });
  }

  // Staff (multi-discipline)
  const staffData = [
    { name: "Élise",   email: "elise@demo.local",   color: "#c9a36b", sortOrder: 1, bio: "Senior stylist & colourist." },
    { name: "Marco",   email: "marco@demo.local",   color: "#8b6f4e", sortOrder: 2, bio: "Master barber & shaves." },
    { name: "Priya",   email: "priya@demo.local",   color: "#a98b5d", sortOrder: 3, bio: "Skin therapist & facialist." },
    { name: "Jordan",  email: "jordan@demo.local",  color: "#bf996e", sortOrder: 4, bio: "Lash & brow specialist, nail tech." },
  ];
  for (const s of staffData) {
    const existing = await prisma.staff.findFirst({ where: { tenantId: tenant.id, name: s.name } });
    const staff = existing
      ? await prisma.staff.update({ where: { id: existing.id }, data: s })
      : await prisma.staff.create({ data: { ...s, tenantId: tenant.id } });
    for (const h of hours) {
      await prisma.staffHours.upsert({
        where: { staffId_dayOfWeek: { staffId: staff.id, dayOfWeek: h.dayOfWeek } },
        update: h,
        create: { ...h, staffId: staff.id },
      });
    }
  }

  // Services — full beauty menu (GBP, in pence)
  const services = [
    // Hair
    { name: "Women's Cut & Style",     description: "Cut, wash, blow-dry.",                       durationMinutes: 75,  priceCents: 6500,  category: "Hair",       sortOrder: 1 },
    { name: "Men's Haircut",           description: "Classic cut, wash, and style.",              durationMinutes: 45,  priceCents: 3500,  category: "Hair",       sortOrder: 2 },
    { name: "Children's Cut",          description: "For under 12s.",                             durationMinutes: 30,  priceCents: 2200,  category: "Hair",       sortOrder: 3 },
    { name: "Blow-Dry & Style",        description: "Wash and blow-dry styling.",                 durationMinutes: 45,  priceCents: 3800,  category: "Hair",       sortOrder: 4 },
    // Colour
    { name: "Full Colour",             description: "Full-head permanent colour.",                durationMinutes: 120, priceCents: 11000, category: "Colour",     sortOrder: 10 },
    { name: "Highlights — Half Head",  description: "Half-head highlights.",                      durationMinutes: 90,  priceCents: 9000,  category: "Colour",     sortOrder: 11 },
    { name: "Balayage",                description: "Hand-painted, lived-in colour.",             durationMinutes: 150, priceCents: 14500, category: "Colour",     sortOrder: 12 },
    { name: "Toner & Gloss",           description: "Refresh tone & shine.",                      durationMinutes: 45,  priceCents: 4500,  category: "Colour",     sortOrder: 13 },
    // Barbering
    { name: "Beard Trim & Shape",      description: "Beard sculpt and line-up.",                  durationMinutes: 30,  priceCents: 2200,  category: "Barbering",  sortOrder: 20 },
    { name: "Hot Towel Shave",         description: "Traditional straight razor shave.",          durationMinutes: 45,  priceCents: 3800,  category: "Barbering",  sortOrder: 21 },
    { name: "Skin Fade",               description: "Precision skin fade.",                       durationMinutes: 45,  priceCents: 3500,  category: "Barbering",  sortOrder: 22 },
    // Skin
    { name: "Signature Facial",        description: "60-minute deep cleanse & glow facial.",      durationMinutes: 60,  priceCents: 7500,  category: "Skin",       sortOrder: 30 },
    { name: "Express Facial",          description: "30-minute refresh.",                         durationMinutes: 30,  priceCents: 4500,  category: "Skin",       sortOrder: 31 },
    { name: "Chemical Peel",           description: "Light chemical peel resurfacing.",           durationMinutes: 45,  priceCents: 9500,  category: "Skin",       sortOrder: 32 },
    { name: "Dermaplaning",            description: "Exfoliation and peach-fuzz removal.",        durationMinutes: 45,  priceCents: 6500,  category: "Skin",       sortOrder: 33 },
    // Brows & Lashes
    { name: "Brow Shape & Tint",       description: "Brow shaping with tint.",                    durationMinutes: 30,  priceCents: 3200,  category: "Brows & Lashes", sortOrder: 40 },
    { name: "Brow Lamination",         description: "Brow lamination & tint.",                    durationMinutes: 45,  priceCents: 5500,  category: "Brows & Lashes", sortOrder: 41 },
    { name: "Lash Lift & Tint",        description: "Lash lift and tint, ~6 weeks.",              durationMinutes: 60,  priceCents: 6500,  category: "Brows & Lashes", sortOrder: 42 },
    { name: "Classic Lash Extensions", description: "Full set, classic lashes.",                  durationMinutes: 120, priceCents: 11500, category: "Brows & Lashes", sortOrder: 43 },
    // Nails
    { name: "Classic Manicure",        description: "File, shape, cuticle, polish.",              durationMinutes: 45,  priceCents: 3000,  category: "Nails",      sortOrder: 50 },
    { name: "Gel Manicure",            description: "Long-lasting gel finish.",                   durationMinutes: 60,  priceCents: 4000,  category: "Nails",      sortOrder: 51 },
    { name: "Classic Pedicure",        description: "Soak, scrub, polish.",                       durationMinutes: 60,  priceCents: 4000,  category: "Nails",      sortOrder: 52 },
    { name: "Gel Pedicure",            description: "Pedicure with gel finish.",                  durationMinutes: 75,  priceCents: 5000,  category: "Nails",      sortOrder: 53 },
    // Waxing
    { name: "Brow Wax",                description: "Brow shaping with wax.",                     durationMinutes: 15,  priceCents: 1500,  category: "Waxing",     sortOrder: 60 },
    { name: "Lip & Chin Wax",          description: "Upper lip and chin.",                        durationMinutes: 15,  priceCents: 1800,  category: "Waxing",     sortOrder: 61 },
    { name: "Half Leg Wax",            description: "Below the knee.",                            durationMinutes: 30,  priceCents: 2800,  category: "Waxing",     sortOrder: 62 },
    { name: "Full Leg Wax",            description: "Full legs.",                                 durationMinutes: 45,  priceCents: 4500,  category: "Waxing",     sortOrder: 63 },
    { name: "Bikini Wax",              description: "Standard bikini.",                           durationMinutes: 20,  priceCents: 2800,  category: "Waxing",     sortOrder: 64 },
    { name: "Hollywood Wax",           description: "Full intimate wax.",                         durationMinutes: 45,  priceCents: 5500,  category: "Waxing",     sortOrder: 65 },
    // Massage
    { name: "Swedish Massage — 60",    description: "Classic relaxation massage.",                durationMinutes: 60,  priceCents: 7500,  category: "Massage",    sortOrder: 70 },
    { name: "Deep Tissue Massage — 60", description: "Targeted deep-tissue work.",                durationMinutes: 60,  priceCents: 8500,  category: "Massage",    sortOrder: 71 },
    { name: "Hot Stone Massage — 75",  description: "Volcanic-stone full-body massage.",          durationMinutes: 75,  priceCents: 9500,  category: "Massage",    sortOrder: 72 },
    // Makeup
    { name: "Event Makeup",            description: "Polished evening look.",                     durationMinutes: 60,  priceCents: 6500,  category: "Makeup",     sortOrder: 80 },
    { name: "Bridal Makeup Trial",     description: "Pre-wedding trial session.",                 durationMinutes: 90,  priceCents: 9500,  category: "Makeup",     sortOrder: 81 },
  ];
  for (const s of services) {
    const existing = await prisma.service.findFirst({ where: { tenantId: tenant.id, name: s.name } });
    if (existing) await prisma.service.update({ where: { id: existing.id }, data: s });
    else          await prisma.service.create({ data: { ...s, tenantId: tenant.id } });
  }

  // Retail products
  const products = [
    { name: "Argan Hair Oil",            description: "Lightweight finishing oil.",      priceCents: 2800, stock: 30, category: "Hair Care", sortOrder: 1 },
    { name: "Daily Hydrating Serum",     description: "Hyaluronic-acid face serum.",     priceCents: 4500, stock: 20, category: "Skincare",  sortOrder: 2 },
    { name: "Lash & Brow Conditioner",   description: "Castor + peptide growth serum.",  priceCents: 3200, stock: 25, category: "Brows & Lashes", sortOrder: 3 },
    { name: "Cuticle Oil",               description: "Nourishing cuticle treatment.",   priceCents: 1600, stock: 40, category: "Nails",     sortOrder: 4 },
    { name: "Beard Balm",                description: "Conditioning beard balm.",        priceCents: 1900, stock: 30, category: "Barbering", sortOrder: 5 },
    { name: "Bath Salts (500g)",         description: "Magnesium + lavender soak.",      priceCents: 2200, stock: 25, category: "Body",      sortOrder: 6 },
  ];
  for (const p of products) {
    const existing = await prisma.product.findFirst({ where: { tenantId: tenant.id, name: p.name } });
    if (existing) await prisma.product.update({ where: { id: existing.id }, data: p });
    else          await prisma.product.create({ data: { ...p, tenantId: tenant.id } });
  }

  console.log(`Seed complete. Demo studio: slug="demo" (Maison Bloom). Owner login: owner@demo.local / changeme`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
