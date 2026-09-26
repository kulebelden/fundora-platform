import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import {
  BadRequestException,
  Controller,
  HttpCode,
  PayloadTooLargeException,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  COVER_DIR,
  MAX_COVER_BYTES,
  UPLOADS_ROOT,
  UPLOADS_URL_PREFIX,
} from './uploads.constants';

/** The fields of multer's in-memory file this controller relies on. */
interface UploadedImage {
  buffer: Buffer;
  size: number;
}

type ImageExtension = 'jpg' | 'png' | 'webp';

/**
 * Identify the image from its first bytes. The client's filename and MIME type
 * are ignored entirely: both are trivially forged, and the extension this picks
 * is what the static server later uses to set Content-Type.
 */
function sniffImage(bytes: Buffer): ImageExtension | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'jpg';
  }
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length >= 8 && png.every((byte, i) => bytes[i] === byte)) {
    return 'png';
  }
  if (
    bytes.length >= 12 &&
    bytes.toString('ascii', 0, 4) === 'RIFF' &&
    bytes.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'webp';
  }
  return null;
}

@Controller('api/v1/uploads')
export class UploadsController {
  /**
   * Stores a campaign cover photo and returns the URL to put in `coverImageUrl`.
   * Any signed-in user may upload: the photo only becomes public once it is
   * attached to a campaign, and campaigns are reviewed before they go live.
   */
  @Post('campaign-cover')
  @UseGuards(JwtAuthGuard)
  @HttpCode(201)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_COVER_BYTES, files: 1 } }),
  )
  async uploadCampaignCover(
    @UploadedFile() file: UploadedImage | undefined,
  ): Promise<{ url: string }> {
    if (!file) {
      throw new BadRequestException('Attach an image in the "file" field.');
    }
    if (file.size > MAX_COVER_BYTES) {
      throw new PayloadTooLargeException('Cover photos must be 5 MB or smaller.');
    }

    const extension = sniffImage(file.buffer);
    if (!extension) {
      throw new BadRequestException('Cover photos must be JPEG, PNG or WebP images.');
    }

    const name = `${randomUUID()}.${extension}`;
    const directory = join(UPLOADS_ROOT, COVER_DIR);
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, name), file.buffer, { flag: 'wx' });

    return { url: `${UPLOADS_URL_PREFIX}/${COVER_DIR}/${name}` };
  }
}
