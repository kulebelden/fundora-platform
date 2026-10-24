import { AppController } from './auth/src/app.controller';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnvironmentVariables, validateEnv } from './config/env.validation';
import { buildDataSourceOptions } from './database/database-options';
import { AuthModule } from './auth/auth.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { PaymentsModule } from './payments/payments.module';
import { KycModule } from './kyc/kyc.module';
import { StatsModule } from './stats/stats.module';
import { WithdrawalsModule } from './withdrawals/withdrawals.module';
import { UploadsModule } from './uploads/uploads.module';
import { AdminModule } from './admin/admin.module';
import { ContactModule } from './contact/contact.module';
import { ClientIpThrottlerGuard } from './common/client-ip-throttler.guard';

@Module({
  controllers: [AppController],
  providers: [{ provide: APP_GUARD, useClass: ClientIpThrottlerGuard }],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables, true>) =>
        buildDataSourceOptions({
          host: config.get('DB_HOST', { infer: true }),
          port: config.get('DB_PORT', { infer: true }),
          database: config.get('DB_NAME', { infer: true }),
          username: config.get('DB_USER', { infer: true }),
          password: config.get('DB_PASSWORD', { infer: true }),
          ssl: config.get('DB_SSL', { infer: true }),
        }),
    }),
    // Per client IP, across the whole API. Sign-in, sign-up, donations and other
    // sensitive routes set tighter limits with @Throttle.
    ThrottlerModule.forRoot({
      throttlers: [{ name: 'default', ttl: 60_000, limit: 120 }],
      errorMessage: 'Too many requests. Please wait a few minutes and try again.',
    }),
    AuthModule,
    CampaignsModule,
    PaymentsModule,
    KycModule,
    WithdrawalsModule,
    StatsModule,
    UploadsModule,
    AdminModule,
    ContactModule,
  ],
})
export class AppModule {}
