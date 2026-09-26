/**
 * Photography for the inner-page heroes. Every route gets its own picture so no
 * two heroes read as the same banner; files live in `public/images/heroes` and
 * are served through next/image, which resizes them per device.
 *
 * `position` is the CSS object-position that keeps the subject in frame when the
 * hero crops the photo to a wide desktop band or a tall phone screen.
 */
export interface HeroImage {
  src: string;
  alt: string;
  position?: string;
}

const hero = (file: string, alt: string, position = 'center'): HeroImage => ({
  src: `/images/heroes/${file}.jpg`,
  alt,
  position,
});

export const HERO_IMAGES = {
  about: hero('about', 'A group of children smiling and waving at the camera', 'center 35%'),
  careers: hero('careers', 'Colleagues working together around laptops at a shared table'),
  contact: hero('contact', 'A person checking their phone beside an open laptop'),
  countries: hero('countries', 'City lights across the globe seen from space at night'),
  blog: hero('blog', 'A fountain pen writing a handwritten note', 'center 40%'),
  charity: hero('charity', 'Many open hands holding a painted red heart together'),
  ideas: hero('ideas', 'A team brainstorming with sticky notes on a whiteboard'),
  fundraise: hero('fundraise', 'Friends with their arms around each other watching a sunset', 'center 45%'),
  team: hero('team', 'A row of friends sitting shoulder to shoulder outdoors', 'center 60%'),
  tips: hero('tips', 'Someone writing planning notes at a desk'),
  guarantee: hero('guarantee', 'Two hands reaching out towards each other'),
  help: hero('help', 'Hands typing on a laptop at a bright desk'),
  howItWorks: hero('how-it-works', 'A customer paying by phone at a shop counter'),
  impactFund: hero('impact-fund', 'Cupped hands holding coins and a note that reads make a change'),
  partnerships: hero('partnerships', 'Two business partners shaking hands', 'center 40%'),
  press: hero('press', 'A reader holding open a printed newspaper', 'center 30%'),
  pricing: hero('pricing', 'A calculator and financial paperwork on a desk'),
  discover: hero('discover', 'Many hands stacked together in a circle'),
  impact: hero('impact', 'Smiling children crowding together for a photo', 'center 30%'),
  emergency: hero('emergency', 'Cars submerged in floodwater on a city street'),
  personal: hero('personal', 'Friends laughing together around a table', 'center 35%'),
  medical: hero('medical', 'A nurse checking a patient’s blood pressure', 'center 35%'),
} satisfies Record<string, HeroImage>;

/** One photo per discover category, keyed by category slug. */
export const CATEGORY_HERO_IMAGES: Record<string, HeroImage> = {
  medical: hero('cat-medical', 'A doctor in a white coat holding a phone'),
  emergency: hero('cat-emergency', 'Volunteers unloading relief supplies'),
  memorial: hero('cat-memorial', 'A field of bright yellow flowers under a blue sky', 'center 60%'),
  education: hero('cat-education', 'Pupils raising their hands in a busy classroom'),
  community: hero('cat-community', 'A volunteer in a bright shirt at a community event', 'center 30%'),
  creative: hero('cat-creative', 'A paintbrush loaded with bright paint'),
  animals: hero('cat-animals', 'Two small dogs trotting happily along a path', 'center 55%'),
  housing: hero('cat-housing', 'A model house with a set of keys'),
  environment: hero('cat-environment', 'Cupped hands holding a young green plant'),
  personal: hero('cat-personal', 'Hands joined together in a show of support'),
};

/** One photo per medical sub-hub, keyed by the medical category slug. */
export const MEDICAL_HERO_IMAGES: Record<string, HeroImage> = {
  cancer: hero('medical-cancer', 'A doctor with arms folded holding a stethoscope'),
  surgeries: hero('medical-surgeries', 'A surgeon operating in theatre', 'center 30%'),
  dental: hero('medical-dental', 'A dentist examining a patient’s teeth'),
  'mental-health': hero('medical-mental-health', 'A man sitting alone in thought in a dim room', 'center 40%'),
  fertility: hero('medical-fertility', 'A newborn baby’s feet wrapped in a soft blanket'),
  'chronic-care': hero('medical-chronic-care', 'A doctor caring for an older patient', 'center 35%'),
  'clinical-trials': hero('medical-clinical-trials', 'A pipette dispensing samples into lab trays'),
};
