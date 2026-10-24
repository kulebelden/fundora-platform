import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../common/enums';
import { BankTransfersService } from './bank-transfers.service';
import { BankTransfersQueryDto, ConfirmBankTransferDto } from './dto/confirm-bank-transfer.dto';

/** Finance staff and admins; SUPER_ADMIN passes every @Roles check. */
@Controller('api/v1/admin/bank-transfers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.FINANCE_OFFICER)
export class BankTransfersController {
  constructor(private readonly bankTransfers: BankTransfersService) {}

  @Get()
  list(@Query() query: BankTransfersQueryDto) {
    return query.status === 'confirmed' ? this.bankTransfers.confirmations() : this.bankTransfers.pending();
  }

  @Post(':id/confirm')
  // Each attempt re-checks the staff password, so cap guessing through this route too.
  @Throttle({ default: { limit: 10, ttl: 15 * 60_000 } })
  @HttpCode(200)
  confirm(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConfirmBankTransferDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.bankTransfers.confirm(id, req.user!.id, dto);
  }
}
