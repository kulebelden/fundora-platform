import type { Metadata } from 'next';
import { LEGAL, LegalList, LegalPage, type LegalSection } from '@/components/legal-page';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'What personal data HopeNest collects, why, who it is shared with, and your rights.',
  alternates: { canonical: '/privacy' },
};

const SECTIONS: LegalSection[] = [
  {
    id: 'who-we-are',
    heading: 'Who is responsible for your data',
    body: (
      <p>
        {LEGAL.entity} operates HopeNest and is responsible for the personal data described here. For any privacy
        question or request, email{' '}
        <a href={`mailto:${LEGAL.privacyEmail}`} className="font-semibold text-accent hover:underline">
          {LEGAL.privacyEmail}
        </a>
        .
      </p>
    ),
  },
  {
    id: 'what-we-collect',
    heading: 'What we collect',
    body: (
      <LegalList
        items={[
          <><strong>Account details:</strong> name, email address, phone number and a securely hashed password (we never store your password itself).</>,
          <><strong>Sign-in with Google or Apple:</strong> the name, email address and account identifier those services share with us.</>,
          <><strong>Donations:</strong> amount, currency, campaign, the name and email you give for your receipt, an optional phone number and message, and whether you chose to give anonymously.</>,
          <><strong>Identity verification (organisers):</strong> the identity document you upload and the details on it, used to confirm who you are before any payout.</>,
          <><strong>Payout details (organisers):</strong> the bank account details you enter for withdrawals.</>,
          <><strong>Campaigns and messages:</strong> what you write and upload, and messages you send through the contact form.</>,
          <><strong>Technical data:</strong> IP address and basic request details, used for security, fraud prevention and rate limiting.</>,
        ]}
      />
    ),
  },
  {
    id: 'what-we-do-not',
    heading: 'What we do not collect',
    body: (
      <p>
        We do not see or store full card numbers: card payments are entered on our payment processor&apos;s secure
        pages. We do not sell your personal data, and we do not use advertising trackers.
      </p>
    ),
  },
  {
    id: 'why',
    heading: 'Why we use it',
    body: (
      <LegalList
        items={[
          'To run your account and the services you ask for: donating, fundraising and withdrawing (performing our contract with you).',
          'To verify organisers’ identities, keep an accurate ledger, and meet anti-fraud, anti-money-laundering and tax obligations (legal obligation).',
          'To protect HopeNest and its users from fraud and attacks (legitimate interests).',
          'To send you receipts, security alerts and essential account emails. We only send marketing if you agree to it.',
        ]}
      />
    ),
  },
  {
    id: 'public',
    heading: 'What is shown publicly',
    body: (
      <p>
        Campaign pages, including the organiser&apos;s name and the campaign story, are public. On the donor list we
        show only a donor&apos;s first name, or &quot;Anonymous&quot; if you chose to give anonymously. Your email
        address and phone number are never shown publicly; only HopeNest staff who need them can see them.
      </p>
    ),
  },
  {
    id: 'sharing',
    heading: 'Who we share it with',
    body: (
      <>
        <p>We share personal data only with service providers we need to run HopeNest, under contracts that protect it:</p>
        <LegalList
          items={[
            'Payment processors (such as Stripe and PayPal) to take donations and pay out funds.',
            'Our hosting provider (Amazon Web Services) where the platform and its database run.',
            'Our email provider, to deliver receipts and account emails.',
            'Google or Apple, only if you choose to sign in with them.',
          ]}
        />
        <p>
          We may also disclose data where the law requires it, for example to tax authorities, regulators or law
          enforcement with a valid legal request.
        </p>
      </>
    ),
  },
  {
    id: 'cookies',
    heading: 'Cookies and storage on your device',
    body: (
      <p>
        We use only essential cookies: secure, HTTP-only cookies that keep you signed in. They cannot be read by scripts
        on the page. We also store a few preferences in your browser (for example, whether you have dismissed the
        install prompt). We do not use analytics or advertising cookies.
      </p>
    ),
  },
  {
    id: 'retention',
    heading: 'How long we keep it',
    body: (
      <LegalList
        items={[
          'Account data is kept while your account is open.',
          'Financial records (donations, payouts and the ledger) are kept for as long as financial and anti-money-laundering laws require, usually at least 5 to 7 years, even after an account is closed. The ledger cannot be edited or deleted.',
          'Identity documents are kept for as long as the law requires for verification records, then deleted.',
          'Sign-in links and password reset links expire within 24 hours and 30 minutes respectively.',
        ]}
      />
    ),
  },
  {
    id: 'security',
    heading: 'How we protect it',
    body: (
      <LegalList
        items={[
          'All traffic is encrypted with HTTPS.',
          'Passwords are hashed with Argon2id; sign-in links and reset links are stored only as one-way hashes.',
          'Sign-in attempts are rate limited and accounts lock after repeated failures.',
          'Staff access is limited by role, and actions that move money require the staff member to re-enter their password and are permanently recorded.',
        ]}
      />
    ),
  },
  {
    id: 'rights',
    heading: 'Your rights',
    body: (
      <>
        <p>Depending on where you live, you may have the right to:</p>
        <LegalList
          items={[
            'Get a copy of the personal data we hold about you.',
            'Correct data that is wrong.',
            'Ask us to delete your data, except records we must keep by law, such as the financial ledger.',
            'Object to, or ask us to restrict, how we use your data.',
            'Complain to your local data protection authority.',
          ]}
        />
        <p>
          To use any of these rights, email{' '}
          <a href={`mailto:${LEGAL.privacyEmail}`} className="font-semibold text-accent hover:underline">
            {LEGAL.privacyEmail}
          </a>
          . We will reply within 30 days and may ask you to confirm your identity first.
        </p>
      </>
    ),
  },
  {
    id: 'transfers',
    heading: 'International transfers',
    body: (
      <p>
        Our servers and service providers may be in a different country from you. Where data leaves your country, we
        rely on safeguards the law recognises, such as standard contractual clauses.
      </p>
    ),
  },
  {
    id: 'children',
    heading: 'Children',
    body: (
      <p>
        HopeNest is not for people under 18, and we do not knowingly collect their data. Campaigns for a child must be
        run by a parent, guardian or other responsible adult.
      </p>
    ),
  },
  {
    id: 'changes',
    heading: 'Changes to this policy',
    body: (
      <p>
        We will update this policy when our practices change, and tell you by email or on the site before significant
        changes take effect.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro={
        <p>
          This policy explains what personal data HopeNest collects when you give, raise or withdraw funds, why we
          collect it, who we share it with, and the choices you have.
        </p>
      }
      sections={SECTIONS}
    />
  );
}
