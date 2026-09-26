import 'reflect-metadata';
import * as argon2 from 'argon2';
import { DataSource } from 'typeorm';
import {
  CampaignStatus,
  KycStatus,
  UserRole,
} from '../common/enums';
import { Campaign } from '../modules/campaigns/entities/campaign.entity';
import { CampaignCategory } from '../modules/campaigns/entities/campaign-category.entity';
import { CampaignUpdate } from '../modules/campaigns/entities/campaign-update.entity';
import { CampaignWallet } from '../modules/campaigns/entities/campaign-wallet.entity';
import { KycProfile } from '../modules/kyc/entities/kyc-profile.entity';
import { UserProfile } from '../modules/identity/entities/user-profile.entity';
import { User } from '../modules/identity/entities/user.entity';
import dataSource from './data-source';

/**
 * Development seed: two sign-in-ready accounts and one live campaign to look at.
 *
 * Idempotent — re-running updates the same rows rather than duplicating them, so it
 * is safe to run after a `schema:sync`. It is a DEV tool: the passwords below are
 * published in the repository, so never point it at an environment that matters.
 *
 *   pnpm --filter @fundora/api seed
 */

interface SeedAccount {
  email: string;
  phoneNumber: string;
  password: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  countryCode: string;
}

/**
 * Passwords satisfy RegisterDto's policy (8+ chars, upper, lower, digit, symbol) so
 * these accounts behave exactly like ones created through the sign-up form.
 */
const SUPER_ADMIN: SeedAccount = {
  email: 'admin@hopenest.test',
  phoneNumber: '+256700000001',
  password: 'Admin#2026Hope',
  role: UserRole.SUPER_ADMIN,
  firstName: 'Amara',
  lastName: 'Okello',
  countryCode: 'UG',
};

const FUNDRAISER: SeedAccount = {
  email: 'grace@hopenest.test',
  phoneNumber: '+256700000002',
  password: 'Grace#2026Hope',
  role: UserRole.FUNDRAISER,
  firstName: 'Grace',
  lastName: 'Nakato',
  countryCode: 'UG',
};

/** Slugs match the Discover hubs in apps/web/src/lib/category-data.ts. */
const CATEGORIES = [
  { name: 'Medical & Healthcare', slug: 'medical', description: 'Surgeries, treatment and hospital bills' },
  { name: 'Cancer Care', slug: 'cancer', description: 'Chemotherapy, surgery and follow-up care' },
  { name: 'Surgeries', slug: 'surgeries', description: 'Emergency and planned surgical procedures' },
  { name: 'Emergency & Disaster Relief', slug: 'emergency', description: 'Disasters, fires and sudden crisis relief' },
  { name: 'Memorial & Funeral', slug: 'memorial', description: 'Funeral costs and family relief' },
  { name: 'Education & Tuition', slug: 'education', description: 'Tuition, school fees and classroom projects' },
  { name: 'Community & Nonprofit', slug: 'community', description: 'Local nonprofits and community projects' },
  { name: 'Creative & Cultural', slug: 'creative', description: 'Music, film, art and publishing' },
  { name: 'Animals & Wildlife', slug: 'animals', description: 'Veterinary care, shelters and wildlife rescue' },
  { name: 'Housing & Basic Needs', slug: 'housing', description: 'Rent, relocation and repairs' },
  { name: 'Environment & Climate', slug: 'environment', description: 'Reforestation, water and clean energy' },
  { name: 'Personal & Family', slug: 'personal', description: 'Family needs and life events' },
];

const CAMPAIGN = {
  slug: 'help-grace-fund-her-mothers-cancer-treatment',
  title: "Help Grace Fund Her Mother's Cancer Treatment",
  categorySlug: 'cancer',
  targetAmount: '12000.0000',
  currency: 'USD',
  story: [
    'My mother, Sarah, was diagnosed with stage two breast cancer in March. The oncology',
    'team at Mulago National Referral Hospital has given her a strong chance if she can',
    'complete six cycles of chemotherapy, followed by surgery in the autumn.',
    '',
    'We have covered the first two cycles by selling what we could. The remaining four,',
    'the surgery and the follow-up scans come to roughly $12,000 — more than our family',
    'can raise alone. Every contribution goes directly towards her treatment schedule,',
    'and I will post the receipt after each cycle so you can see exactly where it went.',
  ].join('\n'),
};

const CAMPAIGN_UPDATE = {
  title: 'Second chemotherapy cycle completed',
  content:
    'Mum finished her second cycle on Tuesday and the oncologist is happy with her response so far. The hospital invoice for this cycle came to $1,840, which your donations covered in full. The third cycle is booked for the end of the month.',
};

async function upsertAccount(
  manager: DataSource['manager'],
  account: SeedAccount,
): Promise<User> {
  const users = manager.getRepository(User);
  const profiles = manager.getRepository(UserProfile);

  const passwordHash = await argon2.hash(account.password, { type: argon2.argon2id });
  const existing = await users.findOne({ where: { email: account.email } });

  // Re-hash on every run so a changed password in this file always takes effect.
  const user = await users.save(
    users.create({
      ...(existing ? { id: existing.id } : {}),
      email: account.email,
      phoneNumber: account.phoneNumber,
      passwordHash,
      role: account.role,
      isEmailVerified: true,
      isPhoneVerified: true,
    }),
  );

  await profiles.save(
    profiles.create({
      userId: user.id,
      firstName: account.firstName,
      lastName: account.lastName,
      avatarUrl: null,
      // Leave national ID to the KYC record; the column is unique and easy to collide on.
      nationalIdNumber: null,
      countryCode: account.countryCode,
    }),
  );

  return user;
}

async function seed(): Promise<void> {
  const ds = await dataSource.initialize();

  try {
    await ds.transaction(async (manager) => {
      /* ------------------------------------------------------ accounts */
      const admin = await upsertAccount(manager, SUPER_ADMIN);
      const fundraiser = await upsertAccount(manager, FUNDRAISER);

      /* ---------------------------------------------------- categories */
      const categories = manager.getRepository(CampaignCategory);
      for (const category of CATEGORIES) {
        const existing = await categories.findOne({ where: { slug: category.slug } });
        await categories.save(
          categories.create({ ...(existing ? { id: existing.id } : {}), ...category }),
        );
      }

      const campaignCategory = await categories.findOneOrFail({
        where: { slug: CAMPAIGN.categorySlug },
      });

      /* ------------------------------------------- verified KYC record */
      // Without a VERIFIED profile the withdrawal endpoints refuse the payout, so the
      // fundraiser would have nothing to demonstrate on the campaign dashboard.
      const kycRepo = manager.getRepository(KycProfile);
      const existingKyc = await kycRepo.findOne({ where: { userId: fundraiser.id } });
      await kycRepo.save(
        kycRepo.create({
          ...(existingKyc ? { id: existingKyc.id } : {}),
          userId: fundraiser.id,
          nationalIdOrPassport: 'CM91023456NAKATO',
          documentUrl: 'https://example.invalid/seed/national-id.jpg',
          status: KycStatus.VERIFIED,
          rejectionReason: null,
          reviewedBy: admin.id,
          verifiedAt: new Date(),
        }),
      );

      /* ------------------------------------------------------ campaign */
      const campaigns = manager.getRepository(Campaign);
      const existingCampaign = await campaigns.findOne({ where: { slug: CAMPAIGN.slug } });

      const start = new Date();
      const end = new Date(start.getTime() + 60 * 24 * 60 * 60 * 1000);

      const campaign = await campaigns.save(
        campaigns.create({
          ...(existingCampaign ? { id: existingCampaign.id } : {}),
          creatorId: fundraiser.id,
          categoryId: campaignCategory.id,
          title: CAMPAIGN.title,
          slug: CAMPAIGN.slug,
          story: CAMPAIGN.story,
          coverImageUrl: null,
          targetAmount: CAMPAIGN.targetAmount,
          currency: CAMPAIGN.currency,
          status: CampaignStatus.LIVE,
          startDate: existingCampaign?.startDate ?? start,
          endDate: existingCampaign?.endDate ?? end,
        }),
      );

      /* -------------------------------------------------------- wallet */
      // CampaignsService.createCampaign does not open a wallet row — the ledger only
      // ever UPDATEs one — so a campaign without this is missing its balances.
      const wallets = manager.getRepository(CampaignWallet);
      const existingWallet = await wallets.findOne({ where: { campaignId: campaign.id } });
      if (!existingWallet) {
        await wallets.save(
          wallets.create({
            campaignId: campaign.id,
            clearedBalance: '0',
            pendingBalance: '0',
          }),
        );
      }

      /* -------------------------------------------------------- update */
      const updates = manager.getRepository(CampaignUpdate);
      const existingUpdate = await updates.findOne({
        where: { campaignId: campaign.id, title: CAMPAIGN_UPDATE.title },
      });
      if (!existingUpdate) {
        await updates.save(
          updates.create({
            campaignId: campaign.id,
            title: CAMPAIGN_UPDATE.title,
            content: CAMPAIGN_UPDATE.content,
          }),
        );
      }

      report(admin, fundraiser, campaign);
    });
  } finally {
    await ds.destroy();
  }
}

function report(admin: User, fundraiser: User, campaign: Campaign): void {
  const lines = [
    '',
    '  Seed complete.',
    '',
    `  SUPER ADMIN   ${SUPER_ADMIN.email}`,
    `                ${SUPER_ADMIN.password}`,
    `                role ${admin.role} · id ${admin.id}`,
    '',
    `  FUNDRAISER    ${FUNDRAISER.email}`,
    `                ${FUNDRAISER.password}`,
    `                role ${fundraiser.role} · id ${fundraiser.id} · KYC VERIFIED`,
    '',
    `  CAMPAIGN      ${campaign.title}`,
    `                /campaigns/${campaign.slug}`,
    `                ${campaign.status} · target ${campaign.targetAmount} ${campaign.currency}`,
    '',
    '  These credentials are public in the repository. Development only.',
    '',
  ];
  // eslint-disable-next-line no-console -- a CLI seed reports to the terminal.
  console.log(lines.join('\n'));
}

seed().catch((error: unknown) => {
  // eslint-disable-next-line no-console -- ditto.
  console.error(error instanceof Error ? error.stack : String(error));
  process.exit(1);
});
