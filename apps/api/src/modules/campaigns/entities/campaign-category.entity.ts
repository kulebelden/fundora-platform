import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'campaign_categories' })
export class CampaignCategory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name!: string;

  @Column({ type: 'varchar', length: 120, unique: true })
  slug!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;
}
