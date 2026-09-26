import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../common/enums';
import { WithdrawalRequest } from '../modules/withdrawals/entities/withdrawal-request.entity';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { ReviewWithdrawalDto } from './dto/review-withdrawal.dto';
import { WithdrawalsService } from './withdrawals.service';

@Controller('api/v1/withdrawals')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WithdrawalsController {
  constructor(private readonly withdrawalsService: WithdrawalsService) {}

  @Post('request')
  @Roles(UserRole.FUNDRAISER)
  async request(
    @Body() dto: CreateWithdrawalDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<WithdrawalRequest> {
    return this.withdrawalsService.requestWithdrawal(req.user!.id, dto);
  }

  @Get('me')
  @Roles(UserRole.FUNDRAISER)
  async mine(@Req() req: AuthenticatedRequest): Promise<WithdrawalRequest[]> {
    return this.withdrawalsService.findMine(req.user!.id);
  }

  @Get('pending')
  @Roles(UserRole.FINANCE_OFFICER, UserRole.ADMIN)
  async pending(): Promise<WithdrawalRequest[]> {
    return this.withdrawalsService.findPending();
  }

  @Patch(':id/review')
  @Roles(UserRole.FINANCE_OFFICER, UserRole.ADMIN)
  @HttpCode(200)
  async review(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewWithdrawalDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<WithdrawalRequest> {
    return this.withdrawalsService.reviewWithdrawal(id, req.user!.id, dto);
  }
}
