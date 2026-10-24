import type { Metadata } from 'next';
import Link from 'next/link';
import { LEGAL, LegalList, LegalPage, type LegalSection } from '@/components/legal-page';
import { WITHDRAWAL_FEE_LABEL } from '@/lib/fees';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The rules for using HopeNest to give, raise and withdraw funds.',
  alternates: { canonical: '/terms' },
};

const SECTIONS: LegalSection[] = [
  {
    id: 'agreement',
    heading: 'Agreeing to these terms',
    body: (
      <>
        <p>
          These terms are an agreement between you and {LEGAL.entity} (&quot;HopeNest&quot;, &quot;we&quot;). By
          creating an account, starting a campaign or making a donation, you accept them. If you do not agree, do not
          use HopeNest.
        </p>
        <p>
          You must be at least 18 years old, and able to enter a binding contract where you live, to create an account
          or run a campaign.
        </p>
      </>
    ),
  },
  {
    id: 'what-we-do',
    heading: 'What HopeNest does',
    body: (
      <p>
        HopeNest is a platform that lets organisers raise money for causes and lets donors give to them. We are not a
        bank, a charity or a party to the arrangement between a donor and an organiser. We record every donation and
        payout in a double-entry ledger and pay funds out only to identity-verified organisers.
      </p>
    ),
  },
  {
    id: 'accounts',
    heading: 'Your account and its security',
    body: (
      <LegalList
        items={[
          'Give accurate information and keep it up to date.',
          'Keep your password secret and use one you do not use anywhere else. You are responsible for activity on your account.',
          'Tell us straight away at ' + LEGAL.supportEmail + ' if you think someone else has accessed your account.',
          'One person, one account. Do not create accounts for others or on someone else’s behalf without permission.',
          'To protect accounts we limit sign-in attempts and may temporarily lock an account after repeated failed attempts.',
        ]}
      />
    ),
  },
  {
    id: 'organisers',
    heading: 'Running a campaign',
    body: (
      <>
        <p>If you start a campaign, you promise that:</p>
        <LegalList
          items={[
            'Everything you say about the campaign, its purpose and its beneficiary is true and not misleading.',
            'You will use the money only for the purpose you described, and tell donors through campaign updates if that changes.',
            'You have the beneficiary’s permission where the campaign is for someone else.',
            'You will keep records of how funds are spent and provide them if we, or the law, ask.',
            'You will comply with the laws that apply to you, including tax rules on the money you receive.',
          ]}
        />
        <p>
          Campaigns are reviewed before they go live. We may ask for more information, decline a campaign, or pause or
          remove one at any time if we believe it breaks these terms or the law.
        </p>
      </>
    ),
  },
  {
    id: 'prohibited',
    heading: 'What is not allowed',
    body: (
      <LegalList
        items={[
          'Fraud, impersonation, or raising money for a cause that does not exist.',
          'Anything illegal, including money laundering, terrorist financing or sanctions evasion.',
          'Hate, harassment, violence, or content that exploits anyone.',
          'Weapons, drugs, gambling or adult services.',
          'Attempts to break, probe or overload the platform, or to access accounts or data that are not yours.',
        ]}
      />
    ),
  },
  {
    id: 'donations',
    heading: 'Donations',
    body: (
      <>
        <p>
          A donation is a voluntary gift to a campaign. Before you confirm, we show the amount the campaign will
          receive after HopeNest&apos;s platform fee and any card processing fee. Donations are generally not
          refundable, except as described in our{' '}
          <Link href="/guarantee" className="font-semibold text-accent hover:underline">
            Giving Guarantee
          </Link>{' '}
          or where the law requires.
        </p>
        <p>
          Card payments are handled by our payment processors; HopeNest never sees or stores your full card number.
          Bank transfers are credited once the funds have arrived and been matched to your donation reference.
        </p>
      </>
    ),
  },
  {
    id: 'fees-payouts',
    heading: 'Fees and payouts',
    body: (
      <>
        <LegalList
          items={[
            'A platform fee is deducted from each donation at the rate shown when the donation is made.',
            `A ${WITHDRAWAL_FEE_LABEL} service fee is deducted when an organiser withdraws funds; the payout screen shows the exact amount first.`,
            'Payouts are released only to organisers who have passed identity verification, and each withdrawal is reviewed by our finance team before it is paid.',
            'You must give bank details for an account in your own name. Check them carefully: transfers sent to wrong details may not be recoverable.',
          ]}
        />
        <p>
          We may delay or withhold a payout while we investigate suspected fraud, a complaint, or a breach of these
          terms, and may return funds to donors where a campaign was fraudulent.
        </p>
      </>
    ),
  },
  {
    id: 'content',
    heading: 'Your content',
    body: (
      <p>
        You keep ownership of the text and photos you post. You give HopeNest a worldwide, royalty-free licence to show
        and share that content to operate and promote the campaign and the platform. Only post content you have the
        right to share.
      </p>
    ),
  },
  {
    id: 'suspension',
    heading: 'Suspension and closing your account',
    body: (
      <p>
        You can close your account at any time by contacting us. We may suspend or close an account that breaks these
        terms, puts others at risk, or where the law requires. Financial records are kept even after an account closes,
        as described in our{' '}
        <Link href="/privacy" className="font-semibold text-accent hover:underline">
          Privacy Policy
        </Link>
        .
      </p>
    ),
  },
  {
    id: 'liability',
    heading: 'Our responsibility to you',
    body: (
      <>
        <p>
          We work hard to keep HopeNest secure and available, but we provide it &quot;as is&quot; and cannot promise it
          will always be uninterrupted or error-free. We do not guarantee that a campaign will reach its goal, or that
          organisers will use funds as they said.
        </p>
        <p>
          To the extent the law allows, HopeNest is not liable for indirect or consequential losses, and our total
          liability to you is limited to the fees we received from you in the 12 months before the claim. Nothing in
          these terms limits liability that cannot be limited by law.
        </p>
      </>
    ),
  },
  {
    id: 'changes',
    heading: 'Changes to these terms',
    body: (
      <p>
        We may update these terms. If a change is significant, we will tell you by email or on the site before it takes
        effect. Continuing to use HopeNest after that means you accept the updated terms.
      </p>
    ),
  },
  {
    id: 'law',
    heading: 'Governing law and disputes',
    body: (
      <p>
        These terms are governed by {LEGAL.governingLaw}. Please contact us first so we can try to resolve any problem
        informally. If we cannot, disputes will be handled by the courts of that jurisdiction, unless the law where you
        live gives you the right to bring a claim there.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      intro={
        <p>
          These terms explain how HopeNest works, what we expect of donors and organisers, and what you can expect from
          us. Please read them before using the platform.
        </p>
      }
      sections={SECTIONS}
    />
  );
}
