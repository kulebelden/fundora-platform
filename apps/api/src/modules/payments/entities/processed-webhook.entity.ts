import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

/**
 * Idempotency ledger for provider webhooks. Insert the row (ON CONFLICT DO NOTHING)
 * in the same DB transaction as the resulting ledger posting; a conflict means
 * the event was already handled and must be acknowledged without re-processing.
 */
@Entity({ name: 'processed_webhooks' })
export class ProcessedWebhook {
  @PrimaryColumn({ type: 'varchar', length: 191 })
  providerEventId!: string;

  @Column({ type: 'varchar', length: 64 })
  providerName!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  processedAt!: Date;

  @Column({ type: 'jsonb' })
  payload!: Record<string, unknown>;
}
