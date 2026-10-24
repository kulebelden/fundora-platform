import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Logger,
  Param,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, timingSafeEqual } from 'crypto';
import { Response, CookieOptions, Request } from 'express';
import { UserRole } from '../common/enums';
import { EnvironmentVariables } from '../config/env.validation';
import { OAuthService, isOAuthProvider } from './oauth.service';
import type { OAuthProvider } from './user-identity.entity';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponse } from './interfaces/auth-response';
import { AuthenticatedRequest } from './interfaces/authenticated-request';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService, VerificationPending } from './auth.service';
import { ResendVerificationDto, VerifyEmailDto } from './dto/email-verification.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/password-reset.dto';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from './constants';

type CookieRequest = Request & {
  cookies?: Record<string, string>;
};

/** Short-lived cookie holding one sign-in attempt's state, nonce and return path. */
const OAUTH_FLOW_COOKIE = 'hn_oauth_flow';
const OAUTH_FLOW_AUDIENCE = 'hopenest-oauth-flow';

interface OAuthFlow {
  provider: OAuthProvider;
  state: string;
  nonce: string;
  next: string | null;
}

/** Staff roles that land on /admin after signing in. Mirrors ADMIN_ROLES in the web app. */
const STAFF_ROLES: readonly UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.MODERATOR,
  UserRole.FINANCE_OFFICER,
];

/** Per client IP. Tighter than the global limit: these are what attackers hammer. */
const MINUTE = 60_000;
const SIGN_UP_LIMIT = { default: { limit: 5, ttl: 60 * MINUTE } };
const LOGIN_LIMIT = { default: { limit: 10, ttl: 5 * MINUTE } };
const EMAIL_LINK_LIMIT = { default: { limit: 5, ttl: 15 * MINUTE } };
const TOKEN_LIMIT = { default: { limit: 10, ttl: 15 * MINUTE } };

/** Same-origin paths only, so a crafted `?next=` cannot send a new session off-site. */
function safeNextPath(next: string | undefined): string | null {
  return next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\')
    ? next
    : null;
}

@Controller('api/v1/auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly oauthService: OAuthService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  /**
   * Creates the account and emails a verification link; no session until it is opened.
   * When verification is switched off, the account is signed in straight away.
   */
  @Post('register')
  @Throttle(SIGN_UP_LIMIT)
  @HttpCode(201)
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<VerificationPending | AuthResponse> {
    const response = await this.authService.register(dto);
    if ('accessToken' in response) this.setAuthCookies(res, response);
    return response;
  }

  /** Opens the emailed link: verifies the address and signs the person in. */
  @Post('verify-email')
  @Throttle(TOKEN_LIMIT)
  @HttpCode(200)
  async verifyEmail(
    @Body() dto: VerifyEmailDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const response = await this.authService.verifyEmail(dto.token);
    this.setAuthCookies(res, response);
    return response;
  }

  /** Always 200, whether or not the address has an account. */
  @Post('resend-verification')
  @Throttle(EMAIL_LINK_LIMIT)
  @HttpCode(200)
  async resendVerification(@Body() dto: ResendVerificationDto): Promise<{ message: string }> {
    await this.authService.resendVerification(dto.email);
    return { message: 'If that address has an unverified account, a new link is on its way.' };
  }

  @Post('login')
  @Throttle(LOGIN_LIMIT)
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    const response = await this.authService.login(dto);
    this.setAuthCookies(res, response);

    return response;
  }

  /** Always 200, whether or not the address has an account. */
  @Post('forgot-password')
  @Throttle(EMAIL_LINK_LIMIT)
  @HttpCode(200)
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<{ message: string }> {
    await this.authService.requestPasswordReset(dto.email);
    return { message: 'If that address has an account, a reset link is on its way.' };
  }

  /** Sets the new password and signs out every device, including this one. */
  @Post('reset-password')
  @Throttle(TOKEN_LIMIT)
  @HttpCode(200)
  async resetPassword(
    @Body() dto: ResetPasswordDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    await this.authService.resetPassword(dto.token, dto.password);
    this.clearAuthCookies(res);
    return { message: 'Your password has been changed. Sign in with the new one.' };
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

  /** Which social sign-in buttons the web app should enable. */
  @Get('oauth/providers')
  oauthProviders(): Record<OAuthProvider, boolean> {
    return this.oauthService.enabledProviders();
  }

  /**
   * Sends the browser to the provider. `state` and `nonce` are kept in a short
   * signed cookie so the callback can prove it answers a request we made.
   */
  @Get('oauth/:provider/start')
  async oauthStart(
    @Param('provider') provider: string,
    @Query('next') next: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    if (!isOAuthProvider(provider) || !this.oauthService.isEnabled(provider)) {
      return res.redirect(303, '/login?oauth_error=unavailable');
    }

    const state = randomBytes(24).toString('base64url');
    const nonce = randomBytes(24).toString('base64url');
    const flow: OAuthFlow = { provider, state, nonce, next: safeNextPath(next) };
    const token = await this.jwtService.signAsync(flow, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      audience: OAUTH_FLOW_AUDIENCE,
      expiresIn: '10m',
    });

    res.cookie(OAUTH_FLOW_COOKIE, token, this.oauthCookieOptions(provider));
    res.redirect(303, this.oauthService.authorizationUrl(provider, state, nonce));
  }

  @Get('oauth/google/callback')
  async googleCallback(
    @Query() query: Record<string, string | undefined>,
    @Req() req: CookieRequest,
    @Res() res: Response,
  ): Promise<void> {
    await this.finishOAuth('google', query, req, res);
  }

  /** Apple posts its answer as a form because we ask for name and email. */
  @Post('oauth/apple/callback')
  async appleCallback(
    @Body() body: Record<string, string | undefined>,
    @Req() req: CookieRequest,
    @Res() res: Response,
  ): Promise<void> {
    await this.finishOAuth('apple', body, req, res);
  }

  private async finishOAuth(
    provider: OAuthProvider,
    params: Record<string, string | undefined>,
    req: CookieRequest,
    res: Response,
  ): Promise<void> {
    const fail = (reason: string) => res.redirect(303, `/login?oauth_error=${reason}`);
    const flowToken = req.cookies?.[OAUTH_FLOW_COOKIE];
    res.clearCookie(OAUTH_FLOW_COOKIE, this.oauthCookieOptions(provider));

    // The person closed the consent screen or said no.
    if (params.error) return fail('cancelled');
    if (!flowToken || !params.code || !params.state) return fail('expired');

    let flow: OAuthFlow;
    try {
      flow = await this.jwtService.verifyAsync<OAuthFlow>(flowToken, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        audience: OAUTH_FLOW_AUDIENCE,
      });
    } catch {
      return fail('expired');
    }

    const stateMatches =
      flow.provider === provider &&
      flow.state.length === params.state.length &&
      timingSafeEqual(Buffer.from(flow.state), Buffer.from(params.state));
    if (!stateMatches) return fail('expired');

    try {
      const profile = await this.oauthService.exchangeCode(provider, params.code, flow.nonce, params.user);
      const response = await this.authService.signInWithOAuth(profile);
      this.setAuthCookies(res, response);
      // Staff land on their console; everyone else on their campaigns, as with a password login.
      const home = STAFF_ROLES.includes(response.user.role) ? '/admin' : '/dashboard/campaigns';
      res.redirect(303, flow.next ?? home);
    } catch (error) {
      this.logger.warn(`${provider} sign-in failed: ${error instanceof Error ? error.message : String(error)}`);
      fail(error instanceof UnauthorizedException ? 'unverified' : 'failed');
    }
  }

  /**
   * Apple returns with a cross-site POST, which drops `SameSite=Lax` cookies, so
   * its flow cookie must be `None` (and therefore `Secure`; browsers accept
   * that on http://localhost too).
   */
  private oauthCookieOptions(provider: OAuthProvider): CookieOptions {
    return {
      httpOnly: true,
      path: '/api/v1/auth/oauth',
      maxAge: 10 * 60 * 1000,
      ...(provider === 'apple'
        ? { sameSite: 'none', secure: true }
        : { sameSite: 'lax', secure: this.config.get('NODE_ENV') === 'production' }),
    };
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
