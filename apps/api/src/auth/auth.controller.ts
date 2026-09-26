import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response, CookieOptions, Request } from 'express';
import { EnvironmentVariables } from '../config/env.validation';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponse } from './interfaces/auth-response';
import { AuthenticatedRequest } from './interfaces/authenticated-request';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from './constants';

type CookieRequest = Request & {
  cookies?: Record<string, string>;
};

@Controller('api/v1/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  @Post('register')
  @HttpCode(201)
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const response = await this.authService.register(dto);
    this.setAuthCookies(res, response);

    return response;
  }

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const response = await this.authService.login(dto);
    this.setAuthCookies(res, response);

    return response;
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const refreshToken =
      dto?.refreshToken ??
      (req as CookieRequest).cookies?.[REFRESH_TOKEN_COOKIE];

    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }

    const response = await this.authService.refreshTokens(
      req.user?.id ?? '',
      refreshToken,
    );
    this.setAuthCookies(res, response);

    return response;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async logout(
    @Body() dto: RefreshTokenDto | undefined,
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    const refreshToken =
      dto?.refreshToken ??
      (req as CookieRequest).cookies?.[REFRESH_TOKEN_COOKIE];

    if (refreshToken) {
      await this.authService.revokeRefreshToken(refreshToken);
    }

    this.clearAuthCookies(res);

    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  me(@Req() req: AuthenticatedRequest): AuthenticatedRequest['user'] {
    return req.user;
  }

  private setAuthCookies(res: Response, response: AuthResponse): void {
    res.cookie(ACCESS_TOKEN_COOKIE, response.accessToken, {
      ...this.cookieOptions(),
      expires: response.accessTokenExpiresAt,
    });
    res.cookie(REFRESH_TOKEN_COOKIE, response.refreshToken, {
      ...this.cookieOptions(),
      expires: response.refreshTokenExpiresAt,
    });
  }

  private clearAuthCookies(res: Response): void {
    res.clearCookie(ACCESS_TOKEN_COOKIE, this.cookieOptions());
    res.clearCookie(REFRESH_TOKEN_COOKIE, this.cookieOptions());
  }

  private cookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.config.get('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: '/',
    };
  }
}
