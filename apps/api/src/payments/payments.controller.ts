import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { Request } from 'express';
import { CARD_PROCESSING_FEE_RATE } from '../ledger/fees';
import { PlatformFeeService, rateToPercent } from '../ledger/platform-fee.service';
import { CreateDonationDto } from './dto/create-donation.dto';
import { PaymentsService } from './payments.service';

@Controller('api/v1/payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly platformFees: PlatformFeeService,
  ) {}

  /** Public: the fees a donation carries right now, for the donate form and pricing page. */
  @Get('fees')
  async fees(): Promise<{ platformFeePercent: number; cardProcessingFeePercent: number }> {
    return {
      platformFeePercent: rateToPercent(await this.platformFees.currentRate()),
      cardProcessingFeePercent: rateToPercent(CARD_PROCESSING_FEE_RATE),
    };
  }

  /** Guests may donate; a signed-in donor is linked to their account. */
  @Post('donate')
  @UseGuards(OptionalJwtAuthGuard)
  async donate(@Body() dto: CreateDonationDto, @Req() req: Request) {
    const donorId =
      (req.user as { id?: string } | undefined)?.id ?? null;

    return this.paymentsService.initiateDonation(donorId, dto);
  }

  @Get('history/:campaignId')
  async history(@Param('campaignId') campaignId: string) {
    return this.paymentsService.findDonationHistory(campaignId);
  }
}
