import { Controller, Get, HttpCode, Query } from '@nestjs/common';
import { PlatformStatsQueryDto } from './dto/platform-stats-query.dto';
import { PlatformStats } from './interfaces/platform-stats';
import { StatsService } from './stats.service';

@Controller('api/v1/stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  /** Public: powers the landing page stats ticker. */
  @Get('platform')
  @HttpCode(200)
  async platform(@Query() query: PlatformStatsQueryDto): Promise<PlatformStats> {
    return this.statsService.getPlatformStats(query.currency);
  }
}
