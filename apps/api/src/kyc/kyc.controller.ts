import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../common/enums';
import { ReviewKycDto } from './dto/review-kyc.dto';
import { SubmitKycDto } from './dto/submit-kyc.dto';
import { KycService, KycStatusResponse, PendingKycReview } from './kyc.service';

@Controller('api/v1/kyc')
@UseGuards(JwtAuthGuard, RolesGuard)
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Post('submit')
  @HttpCode(200)
  async submit(@Body() dto: SubmitKycDto, @Req() req: AuthenticatedRequest): Promise<KycStatusResponse> {
    return this.kycService.submit(req.user!.id, dto);
  }

  @Get('status')
  async status(@Req() req: AuthenticatedRequest): Promise<KycStatusResponse> {
    return this.kycService.getStatus(req.user!.id);
  }

  @Get('pending')
  @Roles(UserRole.ADMIN)
  @HttpCode(200)
  async pending(): Promise<PendingKycReview[]> {
    return this.kycService.findPending();
  }

  @Patch(':id/review')
  @Roles(UserRole.ADMIN)
  @HttpCode(200)
  async review(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewKycDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<KycStatusResponse> {
    return this.kycService.review(id, req.user!.id, dto);
  }
}
