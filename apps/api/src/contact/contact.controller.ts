import {
  Body,
  Controller,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { Repository } from 'typeorm';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { ContactMessage } from '../modules/contact/entities/contact-message.entity';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;

@Controller('api/v1/contact')
export class ContactController {
  /** Per-sender submission times. In-memory: enough to stop a form being hammered. */
  private readonly recent = new Map<string, number[]>();

  constructor(
    @InjectRepository(ContactMessage)
    private readonly messages: Repository<ContactMessage>,
  ) {}

  @Post()
  @HttpCode(201)
  @UseGuards(OptionalJwtAuthGuard)
  async create(
    @Body() dto: CreateContactMessageDto,
    @Req() req: Request,
  ): Promise<{ received: true; reference: string }> {
    // Honeypot filled: pretend success so the bot learns nothing.
    if (dto.website) {
      return { received: true, reference: 'HN-00000000' };
    }

    this.throttle(`${req.ip ?? 'unknown'}|${dto.email.toLowerCase()}`);

    const userId = (req.user as { id?: string } | undefined)?.id ?? null;
    const saved = await this.messages.save(
      this.messages.create({
        name: dto.name,
        email: dto.email.toLowerCase(),
        phone: dto.phone ?? null,
        topic: dto.topic,
        subject: dto.subject,
        message: dto.message,
        campaignLink: dto.campaignLink ?? null,
        userId,
      }),
    );

    return { received: true, reference: `HN-${saved.id.slice(0, 8).toUpperCase()}` };
  }

  private throttle(key: string): void {
    const now = Date.now();
    const recent = (this.recent.get(key) ?? []).filter((at) => now - at < WINDOW_MS);
    if (recent.length >= MAX_PER_WINDOW) {
      throw new HttpException(
        'You have sent several messages in a short time. Please wait a few minutes and try again.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    recent.push(now);
    this.recent.set(key, recent);

    // Keep the map from growing without bound.
    if (this.recent.size > 5_000) {
      for (const [k, times] of this.recent) {
        if (times.every((at) => now - at >= WINDOW_MS)) this.recent.delete(k);
      }
    }
  }
}
