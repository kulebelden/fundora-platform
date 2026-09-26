import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request';
import { UserRole } from '../common/enums';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { CreateCampaignUpdateDto } from './dto/create-campaign-update.dto';
import { AdminCampaignQueryDto } from './dto/admin-campaign-query.dto';
import { CampaignQueryDto } from './dto/campaign-query.dto';
import { UpdateCampaignStatusDto } from './dto/update-campaign-status.dto';
import {
  CampaignDetail,
  CampaignSummary,
  CampaignUpdateView,
  PaginatedCampaigns,
} from './interfaces/campaign-response';
import { CampaignsService } from './campaigns.service';

@Controller('api/v1/campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FUNDRAISER, UserRole.DONOR)
  async create(
    @Body() dto: CreateCampaignDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<CampaignDetail> {
    return this.campaignsService.createCampaign(req.user!.id, dto);
  }

  @Post(':id/submit')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async submit(@Param('id') id: string, @Req() req: AuthenticatedRequest): Promise<CampaignSummary> {
    return this.campaignsService.submitForReview(id, req.user!.id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @HttpCode(200)
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateCampaignStatusDto,
  ): Promise<CampaignSummary> {
    return this.campaignsService.updateStatus(id, dto);
  }

  @Get()
  @HttpCode(200)
  async findAll(@Query() query: CampaignQueryDto): Promise<PaginatedCampaigns> {
    return this.campaignsService.findAllPublic(query);
  }

  /**
   * Moderation queue. Declared before ':slug' so the literal segment is not
   * captured as a slug, and role-guarded because it exposes unpublished campaigns.
   */
  @Get('admin/queue')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @HttpCode(200)
  async adminQueue(
    @Query() query: AdminCampaignQueryDto,
  ): Promise<PaginatedCampaigns> {
    return this.campaignsService.findAllForAdmin(query);
  }

  @Get('admin/counts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @HttpCode(200)
  async adminCounts(): Promise<Record<string, number>> {
    return this.campaignsService.countsByStatus();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async myCampaigns(@Req() req: AuthenticatedRequest): Promise<CampaignSummary[]> {
    return this.campaignsService.findUserCampaigns(req.user!.id);
  }

  /**
   * Declared before the ':slug' route so the literal "id" segment is not captured
   * as a slug. Returns wallet balances, so it is owner/finance-only.
   */
  @Get('id/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<CampaignDetail> {
    return this.campaignsService.findByIdForRequester(id, {
      id: req.user!.id,
      role: req.user!.role,
    });
  }

  @Get(':id/updates')
  @HttpCode(200)
  async listUpdates(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CampaignUpdateView[]> {
    return this.campaignsService.listUpdates(id);
  }

  @Post(':id/updates')
  @UseGuards(JwtAuthGuard)
  @HttpCode(201)
  async addUpdate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCampaignUpdateDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<CampaignUpdateView> {
    return this.campaignsService.addUpdate(id, req.user!.id, dto);
  }

  @Get(':slug')
  @HttpCode(200)
  async findBySlug(@Param('slug') slug: string): Promise<CampaignDetail> {
    return this.campaignsService.findBySlug(slug);
  }
}
