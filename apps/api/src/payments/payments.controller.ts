import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { Request } from 'express';
import { CreateDonationDto } from './dto/create-donation.dto';
import { PaymentsService } from './payments.service';

@Controller('api/v1/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

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
