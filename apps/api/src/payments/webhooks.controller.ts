import {
  Controller,
  HttpCode,
  Param,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PaymentsService } from './payments.service';

@Controller('api/v1/webhooks')
export class WebhooksController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post(':provider')
  @HttpCode(200)
  async webhook(
    @Param('provider') provider: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const rawBody: string =
      (req as Request & { rawBody?: string }).rawBody ??
      JSON.stringify(req.body);

    const result = await this.paymentsService.processWebhook(
      provider,
      req.headers,
      rawBody,
    );

    res.status(result.statusCode).json(result);
  }
}
