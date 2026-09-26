import type { Metadata } from 'next';
import { ArrowRight, BookOpen, Calendar, HeartHandshake, Megaphone, Newspaper, Sparkles, Users, Wallet } from 'lucide-react';
import { MarketingPage } from '@/components/marketing-page';
import { Card } from '@/components/ui/card';
import { HERO_IMAGES } from '@/lib/hero-images';

export const metadata: Metadata = {
  title: 'Fundraising Blog',
  description:
    'Resources, tips and case studies for organisers on HopeNest: how to write your story, keep donors posted and turn one gift into a lasting relationship.',
  alternates: { canonical: '/fundraise/blog' },
};

const POSTS = [
  {
    Icon: Megaphone,
    title: 'How to write a campaign story that converts',
    excerpt: 'The first 200 words decide whether a donor scrolls or closes the tab. Here is what those words need to do.',
    tag: 'Storytelling',
  },
  {
    Icon: Calendar,
    title: 'The six-week update cadence that keeps campaigns alive',
    excerpt: 'Campaigns that post at least once a week raise substantially more. Here is a cadence you can start today.',
    tag: 'Updates',
  },
  {
    Icon: Users,
    title: 'How to turn one donor into ten',
    excerpt: 'The share is the most powerful tool on the page. Here is how to ask for it without sounding like you are asking.',
    tag: 'Growth',
  },
  {
    Icon: Sparkles,
    title: 'What separates a £500 goal from a £5,000 one',
    excerpt: 'Goal size is not a reach metric — it is a trust metric. Match the goal to the audience that already knows you.',
    tag: 'Goals',
  },
  {
    Icon: BookOpen,
    title: 'The anatomy of a campaign that got funded',
    excerpt: 'We broke down three campaigns that landed: the story, the goal, the photo and the update cadence that carried them.',
    tag: 'Case studies',
  },
  {
    Icon: Newspaper,
    title: 'What happens after the goal is hit',
    excerpt: 'The payout is the easy part. The hard part is the donor coming back for the next one — here is how to make that happen.',
    tag: 'Payouts',
  },
];

export default function FundraisingBlogPage() {
  return (
    <MarketingPage
      image={HERO_IMAGES.blog}
      eyebrow="Resources"
      eyebrowIcon={Newspaper}
      variant="centered"
      tone="amber"
      title="The fundraising"
      accent="blog."
      lead="Practical writing, case studies and checklists for organisers. Nothing here is aspirational — everything here is something you can do this afternoon."
      crumbs={[{ label: 'Fundraise', href: '/fundraise' }, { label: 'Blog' }]}
      primaryCta={{ label: 'Start a Campaign', href: '/create' }}
      secondaryCta={{ label: 'Fundraising tips', href: '/fundraise/tips', icon: Megaphone }}
      spotlight={{
        title: 'What this blog covers',
        note: 'Written for the campaign you are running now, not a hypothetical one.',
        items: [
          { icon: BookOpen, title: 'Storytelling donors can verify' },
          { icon: Calendar, title: 'Goals, deadlines and update cadence' },
          { icon: Wallet, title: 'The mechanics of payout' },
        ],
      }}
      sections={[
        {
          heading: 'What this blog covers',
          body: 'Storytelling, update cadence, goal setting, donor retention and the mechanics of payout. If you are running your first campaign, start with the first post and work down the list. If you have run several, you will find something in the case studies.',
        },
      ]}
    >
      <section className="container py-16 sm:py-20">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Latest</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {POSTS.map(({ Icon, title, excerpt, tag }) => (
            <Card key={title} className="flex flex-col p-7">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Icon className="h-5 w-5" />
              </span>
              <span className="mt-4 inline-flex w-fit rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                {tag}
              </span>
              <h3 className="mt-3 text-lg font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{excerpt}</p>
              <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-bold text-accent">
                Read
                <ArrowRight className="h-4 w-4" />
              </span>
            </Card>
          ))}
        </div>
      </section>
    </MarketingPage>
  );
}