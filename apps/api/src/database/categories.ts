/**
 * Campaign categories: reference data every environment needs. The dev seed
 * writes them, and the container start-up (apps/api/scripts/bootstrap-db.js)
 * inserts any that are missing.
 *
 * Slugs match the Discover hubs in apps/web/src/lib/category-data.ts.
 */
export const CATEGORIES = [
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
