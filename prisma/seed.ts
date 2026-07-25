import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding pilot data for East Mamprusi district (Agro Zone: Northern Savannah)...');

  // ── Agro Zone ──────────────────────────────────────────────────────────────
  const agroZone = await prisma.agroZone.upsert({
    where: { id: 'a1b2c3d4-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: 'a1b2c3d4-0000-0000-0000-000000000001',
      name: 'Northern Savannah',
      districts: ['East Mamprusi', 'West Mamprusi', 'Mamprugu Moaduri'],
    },
  });
  console.log(`  ✓ Agro zone: ${agroZone.name}`);

  // ── Pilot Facility ─────────────────────────────────────────────────────────
  const facility = await prisma.facility.upsert({
    where: { id: 'f1000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: 'f1000000-0000-0000-0000-000000000001',
      name: 'Nalerigu CHPS Compound',
      district: 'East Mamprusi',
      region: 'North East Region',
      agroZoneId: agroZone.id,
    },
  });
  console.log(`  ✓ Facility: ${facility.name}`);

  // ── Admin User ─────────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin1234!', 10);
  await prisma.user.upsert({
    where: { phone: '+233000000001' },
    update: {},
    create: {
      id: 'u1000000-0000-0000-0000-000000000001',
      name: 'System Admin',
      role: 'system_admin',
      phone: '+233000000001',
      passwordHash: adminPassword,
      facilityId: facility.id,
    },
  });
  console.log('  ✓ Admin user: +233000000001 / Admin1234!');

  // ── Nutrient Targets (WHO/IYCF) ────────────────────────────────────────────
  const targets = [
    { profile: 'pregnant' as const, nutrient: 'ironMg', dailyTarget: 27, source: 'WHO 2012 IYCF' },
    { profile: 'pregnant' as const, nutrient: 'folateUg', dailyTarget: 600, source: 'WHO 2012 IYCF' },
    { profile: 'pregnant' as const, nutrient: 'energyKcal', dailyTarget: 2340, source: 'WHO 2012 IYCF' },
    { profile: 'child_6_23m' as const, nutrient: 'ironMg', dailyTarget: 11, source: 'WHO 2012 IYCF' },
    { profile: 'child_6_23m' as const, nutrient: 'vitAUgRae', dailyTarget: 400, source: 'WHO 2012 IYCF' },
    { profile: 'child_6_23m' as const, nutrient: 'zincMg', dailyTarget: 3, source: 'WHO 2012 IYCF' },
    { profile: 'child_6_23m' as const, nutrient: 'proteinG', dailyTarget: 13, source: 'WHO 2012 IYCF' },
    { profile: 'child_24_59m' as const, nutrient: 'ironMg', dailyTarget: 7, source: 'WHO 2012 IYCF' },
    { profile: 'child_24_59m' as const, nutrient: 'proteinG', dailyTarget: 19, source: 'WHO 2012 IYCF' },
    { profile: 'child_24_59m' as const, nutrient: 'energyKcal', dailyTarget: 1350, source: 'WHO 2012 IYCF' },
  ];

  for (const t of targets) {
    await prisma.nutrientTarget.upsert({
      where: { profile_nutrient: { profile: t.profile, nutrient: t.nutrient } },
      update: {},
      create: t,
    });
  }
  console.log(`  ✓ Nutrient targets: ${targets.length} records`);

  // ── Clinical Thresholds (WHO/GHS) ──────────────────────────────────────────
  const thresholds = [
    { metric: 'muac_mm', condition: 'child', severity: 'refer' as const, thresholdValue: 115, thresholdDirection: 'lt', source: 'WHO 2009 Growth Standards' },
    { metric: 'muac_mm', condition: 'child', severity: 'watch' as const, thresholdValue: 125, thresholdDirection: 'lt', source: 'WHO 2009 Growth Standards' },
    { metric: 'hb_g_dl', condition: 'pregnant', severity: 'refer' as const, thresholdValue: 7.0, thresholdDirection: 'lt', source: 'WHO 2011 Haemoglobin Guidelines' },
    { metric: 'hb_g_dl', condition: 'pregnant', severity: 'watch' as const, thresholdValue: 11.0, thresholdDirection: 'lt', source: 'WHO 2011 Haemoglobin Guidelines' },
  ];

  for (const t of thresholds) {
    await prisma.clinicalThreshold.create({ data: t }).catch(() => null);
  }
  console.log(`  ✓ Clinical thresholds: ${thresholds.length} records`);

  // ── Pilot Foods (East Mamprusi — Northern Savannah) ────────────────────────
  // TODO: Replace with full validated food composition data from West African FCT
  const foods = [
    {
      id: 'fd000001-0000-0000-0000-000000000001',
      name: 'Moringa leaves (fresh)',
      localNames: { dagbani: 'zogale' },
      foodGroup: 'vit_a_fruits_veg',
      nutrients: { ironMg: 4.0, folateUg: 40, proteinG: 6.7, energyKcal: 64, vitAUgRae: 378, zincMg: 0.6 },
      affordabilityTier: 'staple_cheap' as const,
      storable: false,
      gardenWild: true,
    },
    {
      id: 'fd000002-0000-0000-0000-000000000001',
      name: 'Dried small fish (tilapia)',
      localNames: { dagbani: 'amani' },
      foodGroup: 'flesh_foods',
      nutrients: { ironMg: 5.4, folateUg: 12, proteinG: 47, energyKcal: 218, vitAUgRae: 15, zincMg: 1.8 },
      affordabilityTier: 'staple_cheap' as const,
      storable: true,
      gardenWild: false,
    },
    {
      id: 'fd000003-0000-0000-0000-000000000001',
      name: 'Cowpea (beans)',
      localNames: { dagbani: 'tuya' },
      foodGroup: 'legumes_nuts',
      nutrients: { ironMg: 4.3, folateUg: 208, proteinG: 23.5, energyKcal: 336, vitAUgRae: 0, zincMg: 3.4 },
      affordabilityTier: 'staple_cheap' as const,
      storable: true,
      gardenWild: false,
    },
    {
      id: 'fd000004-0000-0000-0000-000000000001',
      name: 'Groundnut (peanut)',
      localNames: { dagbani: 'sisim' },
      foodGroup: 'legumes_nuts',
      nutrients: { ironMg: 2.0, folateUg: 68, proteinG: 25.8, energyKcal: 567, vitAUgRae: 0, zincMg: 3.3 },
      affordabilityTier: 'staple_cheap' as const,
      storable: true,
      gardenWild: false,
    },
    {
      id: 'fd000005-0000-0000-0000-000000000001',
      name: 'Sorghum (TZ / tuo zaafi)',
      localNames: { dagbani: 'saa' },
      foodGroup: 'grains_roots_tubers',
      nutrients: { ironMg: 3.4, folateUg: 6, proteinG: 10.6, energyKcal: 329, vitAUgRae: 0, zincMg: 1.7 },
      affordabilityTier: 'staple_cheap' as const,
      storable: true,
      gardenWild: false,
    },
    {
      id: 'fd000006-0000-0000-0000-000000000001',
      name: 'Egg',
      localNames: { dagbani: 'poli' },
      foodGroup: 'eggs',
      nutrients: { ironMg: 1.8, folateUg: 47, proteinG: 12.6, energyKcal: 155, vitAUgRae: 140, zincMg: 1.3 },
      affordabilityTier: 'market' as const,
      storable: false,
      gardenWild: false,
    },
  ];

  for (const food of foods) {
    await prisma.food.upsert({
      where: { id: food.id },
      update: {},
      create: food,
    });
  }
  console.log(`  ✓ Foods: ${foods.length} records`);

  // ── Seasonal Availability (East Mamprusi, all months) ─────────────────────
  // TODO: Validate with district nutrition officer. Placeholder schedule below.
  const seasonalData = [
    // Moringa — garden/wild; available most of year except dry peak
    ...Array.from({ length: 12 }, (_, i) => ({
      agroZoneId: agroZone.id,
      month: i + 1,
      foodId: 'fd000001-0000-0000-0000-000000000001',
      availability: (i >= 4 && i <= 9 ? 'abundant' : 'available') as 'abundant' | 'available' | 'scarce',
    })),
    // Dried fish — storable; available year-round
    ...Array.from({ length: 12 }, (_, i) => ({
      agroZoneId: agroZone.id,
      month: i + 1,
      foodId: 'fd000002-0000-0000-0000-000000000001',
      availability: 'available' as const,
    })),
    // Cowpea — harvested Oct–Nov; storable
    ...Array.from({ length: 12 }, (_, i) => ({
      agroZoneId: agroZone.id,
      month: i + 1,
      foodId: 'fd000003-0000-0000-0000-000000000001',
      availability: (i === 9 || i === 10 ? 'abundant' : 'available') as 'abundant' | 'available' | 'scarce',
    })),
  ];

  for (const row of seasonalData) {
    await prisma.seasonalAvailability.upsert({
      where: {
        agroZoneId_month_foodId: {
          agroZoneId: row.agroZoneId,
          month: row.month,
          foodId: row.foodId,
        },
      },
      update: {},
      create: row,
    });
  }
  console.log(`  ✓ Seasonal availability: ${seasonalData.length} records`);

  console.log('\nSeed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
