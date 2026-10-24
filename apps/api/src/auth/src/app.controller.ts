import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';

/** Health check for the container platform; never rate limited. */
@SkipThrottle()
@Controller()
export class AppController {
  @Get()
  home() {
    return {
      status: 'ok',
      message: 'Fundora API is running',
    };
  }
}