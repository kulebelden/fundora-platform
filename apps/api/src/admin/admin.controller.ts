import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request';
import { CampaignsService } from '../campaigns/campaigns.service';
import { UserRole } from '../common/enums';
import { PlatformFeeChangeView, PlatformFeeService } from '../ledger/platform-fee.service';
import { AdminAuditService } from './admin-audit.service';
import { AdminService } from './admin.service';
import {
  AdminOverview,
  ContactMessageView,
  PaginatedAdminUsers,
  PaginatedContactMessages,
  PaginatedDonationAudit,
} from './admin.types';
import {
  AdminDonationsQueryDto,
  AdminMessagesQueryDto,
  AdminWithdrawalsQueryDto,
  MarkMessageDto,
} from './dto/admin-audit-query.dto';
import { AdminUsersQueryDto } from './dto/admin-users-query.dto';
import { DeleteCampaignDto, UpdatePlatformFeeDto } from './dto/super-admin.dto';

/** Staff console reads. SUPER_ADMIN passes every @Roles check. */
@Controller('api/v1/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly audit: AdminAuditService,
    private readonly platformFees: PlatformFeeService,
    private readonly campaigns: CampaignsService,
  ) {}

  @Get('overview')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR, UserRole.FINANCE_OFFICER)
  overview(): Promise<AdminOverview> {
    return this.admin.overview();
  }

  /** Personal data (emails, phone numbers), so ADMIN only. */
  @Get('users')
  @Roles(UserRole.ADMIN)
  users(@Query() query: AdminUsersQueryDto): Promise<PaginatedAdminUsers> {
    return this.admin.users(query);
  }

  /* ---------------------------------------------------------------- inbox */

  @Get('messages')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  messages(@Query() query: AdminMessagesQueryDto): Promise<PaginatedContactMessages> {
    return this.audit.messages(query);
  }

  @Patch('messages/:id')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  markMessage(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: MarkMessageDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ContactMessageView> {
    return this.audit.markMessage(id, dto.read, req.user!.id);
  }

  @Post('messages/read-all')
  @HttpCode(200)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  markAllRead(@Req() req: AuthenticatedRequest): Promise<{ updated: number }> {
    return this.audit.markAllRead(req.user!.id);
  }

  /* --------------------------------------------------------------- audits */

  /** Donor personal details, so finance staff and admins only. */
  @Get('donations')
  @Roles(UserRole.ADMIN, UserRole.FINANCE_OFFICER)
  donations(@Query() query: AdminDonationsQueryDto): Promise<PaginatedDonationAudit> {
    return this.audit.donations(query);
  }

  @Get('withdrawals')
  @Roles(UserRole.ADMIN, UserRole.FINANCE_OFFICER)
  withdrawals(@Query() query: AdminWithdrawalsQueryDto) {
    return this.audit.withdrawals(query);
  }

  /* ------------------------------------------------------- super admin */

  /** Current fee plus its change history. Finance staff can read it; only SUPER_ADMIN can change it. */
  @Get('platform-fee')
  @Roles(UserRole.ADMIN, UserRole.FINANCE_OFFICER)
  async platformFee(): Promise<{ ratePercent: number; history: PlatformFeeChangeView[] }> {
    const [rate, history] = await Promise.all([this.platformFees.currentRate(), this.platformFees.history()]);
    return { ratePercent: Math.round(rate * 10_000) / 100, history };
  }

  /** Applies to donations started after the change; ones already in flight keep their quoted rate. */
  @Put('platform-fee')
  @Roles(UserRole.SUPER_ADMIN)
  setPlatformFee(@Body() dto: UpdatePlatformFeeDto, @Req() req: AuthenticatedRequest): Promise<PlatformFeeChangeView> {
    return this.platformFees.setRate(dto.ratePercent, dto.reason, req.user!.id);
  }

  @Delete('campaigns/:id')
  @Roles(UserRole.SUPER_ADMIN)
  deleteCampaign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DeleteCampaignDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ id: string; deletedAt: string }> {
    return this.campaigns.archive(id, req.user!.id, dto.reason);
  }
}
