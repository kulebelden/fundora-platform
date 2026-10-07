import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';
import { EnvironmentVariables } from '../config/env.validation';

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/**
 * Outgoing email over SMTP. Without SMTP_HOST nothing is sent: the message is
 * written to the log instead, so links can still be followed in development.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;

  constructor(private readonly config: ConfigService<EnvironmentVariables, true>) {
    const host = this.config.get('SMTP_HOST', { infer: true });
    const user = this.config.get('SMTP_USER', { infer: true });
    this.transporter = host
      ? createTransport({
          host,
          port: this.config.get('SMTP_PORT', { infer: true }),
          secure: this.config.get('SMTP_SECURE', { infer: true }),
          auth: user ? { user, pass: this.config.get('SMTP_PASS', { infer: true }) } : undefined,
        })
      : null;

    if (!this.transporter) {
      const level = this.config.get('NODE_ENV', { infer: true }) === 'production' ? 'error' : 'warn';
      this.logger[level]('SMTP_HOST is not set: emails will be logged, not sent.');
    }
  }

  async send(message: MailMessage): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(`[email not sent] to=${message.to} subject="${message.subject}"\n${message.text}`);
      return;
    }
    await this.transporter.sendMail({
      from: this.config.get('MAIL_FROM', { infer: true }),
      ...message,
    });
  }
}
