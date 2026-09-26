import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KycStatus } from '../common/enums';
import { KycProfile } from '../modules/kyc/entities/kyc-profile.entity';
import { ReviewKycDto } from './dto/review-kyc.dto';
import { SubmitKycDto } from './dto/submit-kyc.dto';

/** A submitted profile as a reviewer sees it, with the applicant attached. */
export interface PendingKycReview extends KycStatusResponse {
  userId: string;
  documentUrl: string;
  submittedAt: Date;
  applicantName: string | null;
  applicantEmail: string | null;
}

export interface KycStatusResponse {
  id: string | null;
  status: KycStatus;
  /** Masked: only the last 4 characters are ever returned. */
  nationalIdOrPassport: string | null;
  rejectionReason: string | null;
  verifiedAt: Date | null;
}

function mask(value: string): string {
  return `${'*'.repeat(Math.max(value.length - 4, 0))}${value.slice(-4)}`;
}

@Injectable()
export class KycService {
  constructor(
    @InjectRepository(KycProfile)
    private readonly profiles: Repository<KycProfile>,
  ) {}

  async submit(userId: string, dto: SubmitKycDto): Promise<KycStatusResponse> {
    const existing = await this.profiles.findOne({ where: { userId } });

    if (existing?.status === KycStatus.VERIFIED) {
      throw new ConflictException('KYC is already verified');
    }

    const profile = existing ?? this.profiles.create({ userId });
    profile.nationalIdOrPassport = dto.nationalIdOrPassport;
    profile.documentUrl = dto.documentUrl;
    profile.status = KycStatus.SUBMITTED;
    profile.rejectionReason = null;
    profile.reviewedBy = null;
    profile.verifiedAt = null;

    return this.toResponse(await this.profiles.save(profile));
  }

  async getStatus(userId: string): Promise<KycStatusResponse> {
    const profile = await this.profiles.findOne({ where: { userId } });
    return profile
      ? this.toResponse(profile)
      : {
          id: null,
          status: KycStatus.NOT_STARTED,
          nationalIdOrPassport: null,
          rejectionReason: null,
          verifiedAt: null,
        };
  }

  async review(id: string, reviewerId: string, dto: ReviewKycDto): Promise<KycStatusResponse> {
    const profile = await this.profiles.findOne({ where: { id } });
    if (!profile) {
      throw new NotFoundException('KYC profile not found');
    }
    if (profile.userId === reviewerId) {
      throw new ForbiddenException('You cannot review your own KYC submission');
    }
    if (profile.status !== KycStatus.SUBMITTED) {
      throw new BadRequestException(`KYC profile is ${profile.status}, not ${KycStatus.SUBMITTED}`);
    }

    profile.status = dto.status;
    profile.reviewedBy = reviewerId;
    profile.verifiedAt = dto.status === KycStatus.VERIFIED ? new Date() : null;
    profile.rejectionReason = dto.status === KycStatus.REJECTED ? dto.reason ?? null : null;

    return this.toResponse(await this.profiles.save(profile));
  }

  /**
   * Review queue. Carries the applicant's name and the document link, which the
   * self-service `getStatus` response deliberately does not — a reviewer cannot
   * decide without them, so this stays behind the ADMIN role guard.
   *
   * The ID number remains masked: a reviewer compares the document against the
   * submission, and the full number has no part in that decision.
   */
  async findPending(): Promise<PendingKycReview[]> {
    const profiles = await this.profiles.find({
      where: { status: KycStatus.SUBMITTED },
      relations: { user: { profile: true } },
      order: { createdAt: 'ASC' },
    });

    return profiles.map((profile) => ({
      ...this.toResponse(profile),
      userId: profile.userId,
      documentUrl: profile.documentUrl,
      submittedAt: profile.createdAt,
      applicantName: profile.user?.profile
        ? `${profile.user.profile.firstName} ${profile.user.profile.lastName}`.trim()
        : null,
      applicantEmail: profile.user?.email ?? null,
    }));
  }

  private toResponse(profile: KycProfile): KycStatusResponse {
    return {
      id: profile.id,
      status: profile.status,
      nationalIdOrPassport: mask(profile.nationalIdOrPassport),
      rejectionReason: profile.rejectionReason,
      verifiedAt: profile.verifiedAt,
    };
  }
}
