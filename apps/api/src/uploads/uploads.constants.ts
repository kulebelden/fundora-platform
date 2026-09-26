import { join } from 'path';

/** Where uploaded files are written. Relative to the API's working directory. */
export const UPLOADS_ROOT = join(process.cwd(), 'uploads');

/** URL prefix the files are served under (proxied by the web app like any API route). */
export const UPLOADS_URL_PREFIX = '/api/v1/uploads';

export const COVER_DIR = 'covers';

export const MAX_COVER_BYTES = 5 * 1024 * 1024;

/** A cover path this API issued: `/api/v1/uploads/covers/<uuid>.<ext>`. */
export const LOCAL_COVER_URL = /^\/api\/v1\/uploads\/covers\/[0-9a-f-]{36}\.(jpg|png|webp)$/;
