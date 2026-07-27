/**
 * NurtureLink pilot seed — East Mamprusi + Tamale Metro districts.
 * Run with: pnpm --filter api db:seed
 *
 * Demo credentials (for hackathon):
 *   CHO:        +233244000001 / PIN: 1234
 *   Supervisor: +233244000002 / PIN: 1234
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding pilot data...\n');

  // ── Agro Zone: Northern Savannah ───────────────────────────────────────────
  const agroZone = await prisma.agroZone.upsert({
    where: { id: 'a1b2c3d4-0000-0000-0000-000000000001' },
    update: { districts: ['East Mamprusi', 'West Mamprusi', 'Mamprugu Moaduri', 'Tamale Metro', 'Sagnarigu'] },
    create: {
      id: 'a1b2c3d4-0000-0000-0000-000000000001',
      name: 'Northern Savannah',
      districts: ['East Mamprusi', 'West Mamprusi', 'Mamprugu Moaduri', 'Tamale Metro', 'Sagnarigu'],
    },
  });
  console.log(`✓ Agro zone: ${agroZone.name}`);

  // ── Facilities ─────────────────────────────────────────────────────────────
  const kukuoFacility = await prisma.facility.upsert({
    where: { id: 'f1000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: 'f1000000-0000-0000-0000-000000000001',
      name: 'Kukuo CHPS Compound',
      district: 'Tamale Metro',
      region: 'Northern Region',
      agroZoneId: agroZone.id,
    },
  });

  const nalerigu = await prisma.facility.upsert({
    where: { id: 'f1000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: 'f1000000-0000-0000-0000-000000000002',
      name: 'Nalerigu CHPS Compound',
      district: 'East Mamprusi',
      region: 'North East Region',
      agroZoneId: agroZone.id,
    },
  });
  console.log(`✓ Facilities: ${kukuoFacility.name}, ${nalerigu.name}`);

  // ── Users ──────────────────────────────────────────────────────────────────
  const pinHash = await bcrypt.hash('1234', 10);
  const adminHash = await bcrypt.hash('Admin1234!', 10);

  await prisma.user.upsert({
    where: { phone: '+233244000001' },
    update: {},
    create: {
      id: 'u1000000-0000-0000-0000-000000000001',
      name: 'Yakubu Lute',
      role: 'CHO',
      phone: '+233244000001',
      passwordHash: pinHash,
      facilityId: kukuoFacility.id,
    },
  });

  await prisma.user.upsert({
    where: { phone: '+233244000002' },
    update: {},
    create: {
      id: 'u1000000-0000-0000-0000-000000000002',
      name: 'Yakubu Lute (Supervisor)',
      role: 'supervisor',
      phone: '+233244000002',
      passwordHash: pinHash,
      facilityId: kukuoFacility.id,
    },
  });

  await prisma.user.upsert({
    where: { phone: '+233000000001' },
    update: {},
    create: {
      id: 'u0000000-0000-0000-0000-000000000001',
      name: 'System Admin',
      role: 'system_admin',
      phone: '+233000000001',
      passwordHash: adminHash,
    },
  });
  console.log('✓ Users: CHO (+233244000001), Supervisor (+233244000002), Admin');

  // ── Nutrient Targets (WHO/IYCF) ────────────────────────────────────────────
  const targets: Array<{
    profile: 'pregnant' | 'child_6_23m' | 'child_24_59m';
    nutrient: string;
    dailyTarget: number;
    source: string;
  }> = [
    { profile: 'pregnant',     nutrient: 'ironMg',     dailyTarget: 27,   source: 'WHO 2012 IYCF' },
    { profile: 'pregnant',     nutrient: 'folateUg',   dailyTarget: 600,  source: 'WHO 2012 IYCF' },
    { profile: 'pregnant',     nutrient: 'energyKcal', dailyTarget: 2340, source: 'WHO 2012 IYCF' },
    { profile: 'pregnant',     nutrient: 'proteinG',   dailyTarget: 71,   source: 'WHO 2012 IYCF' },
    { profile: 'pregnant',     nutrient: 'vitAUgRae',  dailyTarget: 770,  source: 'WHO 2012 IYCF' },
    { profile: 'pregnant',     nutrient: 'zincMg',     dailyTarget: 11,   source: 'WHO 2012 IYCF' },
    { profile: 'child_6_23m',  nutrient: 'ironMg',     dailyTarget: 11,   source: 'WHO 2012 IYCF' },
    { profile: 'child_6_23m',  nutrient: 'vitAUgRae',  dailyTarget: 400,  source: 'WHO 2012 IYCF' },
    { profile: 'child_6_23m',  nutrient: 'zincMg',     dailyTarget: 3,    source: 'WHO 2012 IYCF' },
    { profile: 'child_6_23m',  nutrient: 'proteinG',   dailyTarget: 13,   source: 'WHO 2012 IYCF' },
    { profile: 'child_6_23m',  nutrient: 'energyKcal', dailyTarget: 810,  source: 'WHO 2012 IYCF' },
    { profile: 'child_24_59m', nutrient: 'ironMg',     dailyTarget: 7,    source: 'WHO 2012 IYCF' },
    { profile: 'child_24_59m', nutrient: 'proteinG',   dailyTarget: 19,   source: 'WHO 2012 IYCF' },
    { profile: 'child_24_59m', nutrient: 'energyKcal', dailyTarget: 1350, source: 'WHO 2012 IYCF' },
    { profile: 'child_24_59m', nutrient: 'vitAUgRae',  dailyTarget: 400,  source: 'WHO 2012 IYCF' },
    { profile: 'child_24_59m', nutrient: 'zincMg',     dailyTarget: 5,    source: 'WHO 2012 IYCF' },
  ];

  for (const t of targets) {
    await prisma.nutrientTarget.upsert({
      where: { profile_nutrient: { profile: t.profile, nutrient: t.nutrient } },
      update: {},
      create: t,
    });
  }
  console.log(`✓ Nutrient targets: ${targets.length} records`);

  // ── Clinical Thresholds (WHO/GHS) ──────────────────────────────────────────
  await prisma.clinicalThreshold.deleteMany();
  const thresholds = [
    // Child MUAC
    { metric: 'muac_mm', condition: 'child', severity: 'refer' as const, thresholdValue: 115, thresholdDirection: 'lt', source: 'WHO 2009 Growth Standards' },
    { metric: 'muac_mm', condition: 'child', severity: 'watch' as const, thresholdValue: 125, thresholdDirection: 'lt', source: 'WHO 2009 Growth Standards' },
    // Haemoglobin — pregnant
    { metric: 'hb_g_dl', condition: 'pregnant', severity: 'refer' as const, thresholdValue: 7.0,  thresholdDirection: 'lt', source: 'WHO 2011 Haemoglobin Guidelines' },
    { metric: 'hb_g_dl', condition: 'pregnant', severity: 'watch' as const, thresholdValue: 11.0, thresholdDirection: 'lt', source: 'WHO 2011 Haemoglobin Guidelines' },
    // Haemoglobin — child
    { metric: 'hb_g_dl', condition: 'child', severity: 'refer' as const, thresholdValue: 7.0,  thresholdDirection: 'lt', source: 'WHO 2011 Haemoglobin Guidelines' },
    { metric: 'hb_g_dl', condition: 'child', severity: 'watch' as const, thresholdValue: 10.0, thresholdDirection: 'lt', source: 'WHO 2011 Haemoglobin Guidelines' },
  ];

  await prisma.clinicalThreshold.createMany({ data: thresholds });
  console.log(`✓ Clinical thresholds: ${thresholds.length} records`);

  // ── Foods (Northern Savannah, validated against West African FCT) ──────────
  const foods = [
    {
      id: 'fd000001-0000-0000-0000-000000000001',
      name: 'Moringa leaves (fresh)',
      localNames: { dagbani: 'zogale', twi: 'moringa' },
      foodGroup: 'vit_a_fruits_veg',
      nutrients: { ironMg: 4.0, folateUg: 40, proteinG: 6.7, energyKcal: 64, vitAUgRae: 378, zincMg: 0.6 },
      affordabilityTier: 'staple_cheap' as const,
      storable: false,
      gardenWild: true,
    },
    {
      id: 'fd000002-0000-0000-0000-000000000001',
      name: 'Dried small fish (tilapia)',
      localNames: { dagbani: 'amani', twi: 'koobi' },
      foodGroup: 'flesh_foods',
      nutrients: { ironMg: 5.4, folateUg: 12, proteinG: 47, energyKcal: 218, vitAUgRae: 15, zincMg: 1.8 },
      affordabilityTier: 'staple_cheap' as const,
      storable: true,
      gardenWild: false,
    },
    {
      id: 'fd000003-0000-0000-0000-000000000001',
      name: 'Cowpea (beans)',
      localNames: { dagbani: 'tuya', twi: 'abrow' },
      foodGroup: 'legumes_nuts',
      nutrients: { ironMg: 4.3, folateUg: 208, proteinG: 23.5, energyKcal: 336, vitAUgRae: 0, zincMg: 3.4 },
      affordabilityTier: 'staple_cheap' as const,
      storable: true,
      gardenWild: false,
    },
    {
      id: 'fd000004-0000-0000-0000-000000000001',
      name: 'Groundnut (peanut)',
      localNames: { dagbani: 'sisim', twi: 'nkate' },
      foodGroup: 'legumes_nuts',
      nutrients: { ironMg: 2.0, folateUg: 68, proteinG: 25.8, energyKcal: 567, vitAUgRae: 0, zincMg: 3.3 },
      affordabilityTier: 'staple_cheap' as const,
      storable: true,
      gardenWild: false,
    },
    {
      id: 'fd000005-0000-0000-0000-000000000001',
      name: 'Sorghum (TZ / tuo zaafi)',
      localNames: { dagbani: 'saa', twi: 'asana' },
      foodGroup: 'grains_roots_tubers',
      nutrients: { ironMg: 3.4, folateUg: 6, proteinG: 10.6, energyKcal: 329, vitAUgRae: 0, zincMg: 1.7 },
      affordabilityTier: 'staple_cheap' as const,
      storable: true,
      gardenWild: false,
    },
    {
      id: 'fd000006-0000-0000-0000-000000000001',
      name: 'Egg',
      localNames: { dagbani: 'poli', twi: 'ɛkyew' },
      foodGroup: 'eggs',
      nutrients: { ironMg: 1.8, folateUg: 47, proteinG: 12.6, energyKcal: 155, vitAUgRae: 140, zincMg: 1.3 },
      affordabilityTier: 'market' as const,
      storable: false,
      gardenWild: false,
    },
    {
      id: 'fd000007-0000-0000-0000-000000000001',
      name: 'Orange sweet potato',
      localNames: { dagbani: 'wulijɛɣu', twi: 'ntamobuo' },
      foodGroup: 'vit_a_fruits_veg',
      nutrients: { ironMg: 0.6, folateUg: 11, proteinG: 1.6, energyKcal: 86, vitAUgRae: 961, zincMg: 0.3 },
      affordabilityTier: 'market' as const,
      storable: true,
      gardenWild: false,
    },
    {
      id: 'fd000008-0000-0000-0000-000000000001',
      name: 'Dawadawa (fermented locust bean)',
      localNames: { dagbani: 'dawadawa', twi: 'dawadawa' },
      foodGroup: 'legumes_nuts',
      nutrients: { ironMg: 9.0, folateUg: 20, proteinG: 35, energyKcal: 395, vitAUgRae: 0, zincMg: 2.5 },
      affordabilityTier: 'staple_cheap' as const,
      storable: true,
      gardenWild: false,
    },
    {
      id: 'fd000009-0000-0000-0000-000000000001',
      name: 'Millet',
      localNames: { dagbani: 'nyɔri', twi: 'millet' },
      foodGroup: 'grains_roots_tubers',
      nutrients: { ironMg: 3.0, folateUg: 85, proteinG: 11.0, energyKcal: 378, vitAUgRae: 0, zincMg: 1.7 },
      affordabilityTier: 'staple_cheap' as const,
      storable: true,
      gardenWild: false,
    },
    {
      id: 'fd000010-0000-0000-0000-000000000001',
      name: 'Baobab fruit pulp',
      localNames: { dagbani: 'tuisim', twi: 'odum' },
      foodGroup: 'other_fruits_veg',
      nutrients: { ironMg: 0.6, folateUg: 0, proteinG: 2.3, energyKcal: 250, vitAUgRae: 4, zincMg: 0.1 },
      affordabilityTier: 'staple_cheap' as const,
      storable: true,
      gardenWild: true,
    },
    {
      id: 'fd000011-0000-0000-0000-000000000001',
      name: 'Bambara beans',
      localNames: { dagbani: 'suya', twi: 'aboboe' },
      foodGroup: 'legumes_nuts',
      nutrients: { ironMg: 2.5, folateUg: 120, proteinG: 18.0, energyKcal: 360, vitAUgRae: 0, zincMg: 2.1 },
      affordabilityTier: 'staple_cheap' as const,
      storable: true,
      gardenWild: false,
    },
    {
      id: 'fd000012-0000-0000-0000-000000000001',
      name: 'Pawpaw (papaya)',
      localNames: { dagbani: 'boɣu', twi: 'bɔfre' },
      foodGroup: 'vit_a_fruits_veg',
      nutrients: { ironMg: 0.3, folateUg: 38, proteinG: 0.5, energyKcal: 39, vitAUgRae: 47, zincMg: 0.1 },
      affordabilityTier: 'market' as const,
      storable: false,
      gardenWild: true,
    },
  ];

  for (const food of foods) {
    await prisma.food.upsert({
      where: { id: food.id },
      update: {},
      create: food,
    });
  }
  console.log(`✓ Foods: ${foods.length} records`);

  // ── Seasonal Availability ──────────────────────────────────────────────────
  type Avail = 'abundant' | 'available' | 'scarce';
  const seasonal: Array<{ agroZoneId: string; month: number; foodId: string; availability: Avail }> = [
    // Moringa — grows throughout year, abundant in wet season (Apr–Oct)
    ...(Array.from({ length: 12 }, (_, i) => ({
      agroZoneId: agroZone.id, month: i + 1,
      foodId: 'fd000001-0000-0000-0000-000000000001',
      availability: (i >= 3 && i <= 9 ? 'abundant' : 'available') as Avail,
    }))),
    // Dried fish — storable; available year-round
    ...(Array.from({ length: 12 }, (_, i) => ({
      agroZoneId: agroZone.id, month: i + 1,
      foodId: 'fd000002-0000-0000-0000-000000000001',
      availability: 'available' as Avail,
    }))),
    // Cowpea — harvested Oct–Nov; scarce Jan–Mar before new harvest
    ...(Array.from({ length: 12 }, (_, i) => ({
      agroZoneId: agroZone.id, month: i + 1,
      foodId: 'fd000003-0000-0000-0000-000000000001',
      availability: (i === 9 || i === 10 ? 'abundant' : i <= 1 ? 'scarce' : 'available') as Avail,
    }))),
    // Groundnut — harvested Sep–Oct; storable
    ...(Array.from({ length: 12 }, (_, i) => ({
      agroZoneId: agroZone.id, month: i + 1,
      foodId: 'fd000004-0000-0000-0000-000000000001',
      availability: (i === 8 || i === 9 ? 'abundant' : 'available') as Avail,
    }))),
    // Sorghum — harvested Nov–Dec; storable
    ...(Array.from({ length: 12 }, (_, i) => ({
      agroZoneId: agroZone.id, month: i + 1,
      foodId: 'fd000005-0000-0000-0000-000000000001',
      availability: (i === 10 || i === 11 ? 'abundant' : 'available') as Avail,
    }))),
    // Egg — market; available year-round
    ...(Array.from({ length: 12 }, (_, i) => ({
      agroZoneId: agroZone.id, month: i + 1,
      foodId: 'fd000006-0000-0000-0000-000000000001',
      availability: 'available' as Avail,
    }))),
    // Sweet potato — harvested Sep–Dec
    ...(Array.from({ length: 12 }, (_, i) => ({
      agroZoneId: agroZone.id, month: i + 1,
      foodId: 'fd000007-0000-0000-0000-000000000001',
      availability: (i >= 8 && i <= 11 ? 'abundant' : i <= 1 ? 'scarce' : 'available') as Avail,
    }))),
    // Dawadawa — storable condiment; available year-round
    ...(Array.from({ length: 12 }, (_, i) => ({
      agroZoneId: agroZone.id, month: i + 1,
      foodId: 'fd000008-0000-0000-0000-000000000001',
      availability: 'available' as Avail,
    }))),
    // Millet — harvested Sep–Oct
    ...(Array.from({ length: 12 }, (_, i) => ({
      agroZoneId: agroZone.id, month: i + 1,
      foodId: 'fd000009-0000-0000-0000-000000000001',
      availability: (i === 8 || i === 9 ? 'abundant' : i <= 1 ? 'scarce' : 'available') as Avail,
    }))),
    // Baobab — dry season fruit (Dec–Apr)
    ...(Array.from({ length: 12 }, (_, i) => ({
      agroZoneId: agroZone.id, month: i + 1,
      foodId: 'fd000010-0000-0000-0000-000000000001',
      availability: (i >= 11 || i <= 3 ? 'abundant' : i >= 4 && i <= 7 ? 'scarce' : 'available') as Avail,
    }))),
    // Bambara beans — harvested Oct–Nov
    ...(Array.from({ length: 12 }, (_, i) => ({
      agroZoneId: agroZone.id, month: i + 1,
      foodId: 'fd000011-0000-0000-0000-000000000001',
      availability: (i === 9 || i === 10 ? 'abundant' : 'available') as Avail,
    }))),
    // Pawpaw — grows year-round in garden; abundant in rainy season
    ...(Array.from({ length: 12 }, (_, i) => ({
      agroZoneId: agroZone.id, month: i + 1,
      foodId: 'fd000012-0000-0000-0000-000000000001',
      availability: (i >= 5 && i <= 9 ? 'abundant' : 'available') as Avail,
    }))),
  ];

  for (const row of seasonal) {
    await prisma.seasonalAvailability.upsert({
      where: { agroZoneId_month_foodId: { agroZoneId: row.agroZoneId, month: row.month, foodId: row.foodId } },
      update: {},
      create: row,
    });
  }
  console.log(`✓ Seasonal availability: ${seasonal.length} records`);

  // ── Reference Bundle record ────────────────────────────────────────────────
  // Checksum is a hash of the seed version tag — updated by CI when data changes.
  const versionTag = 'v1.0-seed';
  const checksum = crypto.createHash('sha256').update(versionTag + foods.length).digest('hex');

  await prisma.referenceBundle.upsert({
    where: { versionTag },
    update: {},
    create: {
      id: 'rb000001-0000-0000-0000-000000000001',
      versionTag,
      description: 'Pilot seed — Northern Savannah (12 foods, 6 thresholds)',
      tablesIncluded: ['foods', 'seasonal_availability', 'nutrient_targets', 'clinical_thresholds', 'agro_zones'],
      checksum,
      active: true,
      publishedBy: 'u0000000-0000-0000-0000-000000000001',
    },
  });
  console.log(`✓ Reference bundle: ${versionTag}`);

  console.log('\nSeed complete ✓');
  console.log('  Demo CHO login:        +233244000001 / PIN 1234');
  console.log('  Demo Supervisor login: +233244000002 / PIN 1234');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
