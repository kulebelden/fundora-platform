import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Campaign } from '../modules/campaigns/entities/campaign.entity';
import { CampaignCategory } from '../modules/campaigns/entities/campaign-category.entity';
import { CampaignUpdate } from '../modules/campaigns/entities/campaign-update.entity';
import { CampaignWallet } from '../modules/campaigns/entities/campaign-wallet.entity';
import { CategoriesModule } from './categories/categories.module';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';

@Module({
  imports: [
    AuthModule,
    CategoriesModule,
    TypeOrmModule.forFeature([
      Campaign,
      CampaignCategory,
      CampaignUpdate,
      CampaignWallet,
    ]),
  ],
  controllers: [CampaignsController],
  providers: [CampaignsService],
  exports: [CampaignsService],
})
export class CampaignsModule {}
