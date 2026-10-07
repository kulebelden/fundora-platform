import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PLATFORM_FEE_RATE } from './fees';
import { PlatformFeeChange } from './platform-fee-change.entity';

/** Highest fee a super admin can set; the database enforces the same cap. */
export const MAX_PLATFORM_FEE_RATE = 0.25;

export interface PlatformFeeChangeView {
  id: string;
  ratePercent: number;
  previousRatePercent: number | null;
  reason: string;
  changedBy: string | null;
  createdAt: string;
}

/** Fraction → percent with no float noise: 0.0525 → 5.25. */
export function rateToPercent(rate: number): number {
  return Math.round(rate * 10_000) / 100;
}

/**
 * The editable platform fee: the newest row of `platform_fee_changes`.
 * Callers quoting a donation should snapshot the rate onto the payment intent
 * rather than re-reading it at settlement.
 */
@Injectable()
export class PlatformFeeService {
  constructor(
    @InjectRepository(PlatformFeeChange)
    private readonly changes: Repository<PlatformFeeChange>,
  ) {}

  /**
   * Read fresh every time: one indexed single-row query. A per-process cache
   * would let other API instances quote the old fee after a change.
   */
  async currentRate(): Promise<number> {
    const latest = await this.changes.findOne({ where: {}, order: { createdAt: 'DESC' } });
    // No row only before the migration has run: keep the historical 5%.
    return latest ? Number(latest.rate) : PLATFORM_FEE_RATE;
  }

  async setRate(ratePercent: number, reason: string, changedById: string): Promise<PlatformFeeChangeView> {
    const rate = Math.round(ratePercent * 100) / 10_000;
    if (!Number.isFinite(rate) || rate < 0 || rate > MAX_PLATFORM_FEE_RATE) {
      throw new BadRequestException(
        `The platform fee must be between 0% and ${rateToPercent(MAX_PLATFORM_FEE_RATE)}%`,
      );
    }

    const previous = await this.currentRate();
    if (previous === rate) {
      throw new BadRequestException(`The platform fee is already ${rateToPercent(rate)}%`);
    }

    const saved = await this.changes.save(
      this.changes.create({
        rate: rate.toFixed(4),
        previousRate: previous.toFixed(4),
        reason: reason.trim(),
        changedById,
      }),
    );
    const [view] = await this.history(1);
    return view ?? this.toView(saved, null);
  }

  async history(limit = 20): Promise<PlatformFeeChangeView[]> {
    const rows = await this.changes.find({
      relations: { changedBy: { profile: true } },
      order: { createdAt: 'DESC' },
      take: limit,
    });
    return rows.map((row) => {
      const profile = row.changedBy?.profile;
      const name = profile ? `${profile.firstName} ${profile.lastName}`.trim() : row.changedBy?.email ?? null;
      return this.toView(row, name || null);
    });
  }

  private toView(row: PlatformFeeChange, changedBy: string | null): PlatformFeeChangeView {
    return {
      id: row.id,
      ratePercent: rateToPercent(Number(row.rate)),
      previousRatePercent: row.previousRate === null ? null : rateToPercent(Number(row.previousRate)),
      reason: row.reason,
      changedBy,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
