import { BadRequestException } from '@nestjs/common';
import type { StorageEngine } from 'multer';
import { MEDIA_BUCKET, sanitizeKey, supabase } from './supabase';
import { resolveImageMime } from './image-sniff';

/** Lo que aceptan por defecto todas las subidas: imágenes de verdad, sin SVG. */
const RASTER = /^image\/(png|jpeg|webp|avif|gif)$/;

/**
 * Motor de multer que sube el archivo a Supabase Storage (bucket `media/uploads/`)
 * en lugar de disco. Mantiene la convención previa: `file.filename` es el nombre pelón
 * y el handler guarda `uploads/${file.filename}` en la BD (que imageUrl() resuelve al bucket).
 *
 * Aquí se decide el tipo real del archivo (ver `image-sniff`), y con ESE se sirve. Antes
 * se guardaba con el `Content-Type` que mandaba el navegador: quien subía elegía cómo se
 * serviría su archivo. Se valida en este punto, y no en cada controller, porque todas las
 * subidas pasan por aquí: así ninguna ruta nueva puede olvidarse de hacerlo.
 *
 * @param allowed qué tipos REALES acepta este campo. Por defecto, imágenes sin SVG; el
 *   endpoint de favicon/logo pasa el suyo para permitir `image/svg+xml` y `image/x-icon`.
 */
export function supabaseStorage(allowed: RegExp = RASTER): StorageEngine {
  const engine: StorageEngine = {
    _handleFile(_req, file, cb) {
      const chunks: Buffer[] = [];
      file.stream.on('data', (c: Buffer) => chunks.push(c));
      file.stream.on('error', (e) => cb(e));
      file.stream.on('end', () => {
        const buf = Buffer.concat(chunks);
        const resolved = resolveImageMime(buf, allowed);
        if ('error' in resolved) {
          // Tiene que ser una HttpException: Nest (`transformException`) reenvía tal cual
          // las que ya lo son, y cualquier otro Error acabaría como un 500 sin explicación.
          cb(new BadRequestException(resolved.error));
          return;
        }

        const safe = file.originalname.replace(/[^a-zA-Z0-9.]+/g, '-').slice(-60);
        const filename = `${Date.now()}-${safe}`;
        supabase()
          .storage.from(MEDIA_BUCKET)
          // `contentType` sale de los BYTES, no de lo que dijo el navegador.
          .upload(sanitizeKey(`uploads/${filename}`), buf, { contentType: resolved.mime, upsert: true })
          .then(({ error }) =>
            error ? cb(error) : cb(null, { filename, size: buf.length, path: `uploads/${filename}`, mimetype: resolved.mime }),
          )
          .catch(cb);
      });
    },
    _removeFile(_req, file, cb) {
      const p = (file as { path?: string }).path ?? `uploads/${file.filename}`;
      supabase()
        .storage.from(MEDIA_BUCKET)
        .remove([sanitizeKey(p)])
        .then(() => cb(null))
        .catch(cb);
    },
  };
  return engine;
}

/** Para el favicon/logo del sitio: además de imágenes, ahí sí tienen sentido SVG e ICO. */
export const ICON_TYPES = /^image\/(png|jpeg|webp|avif|gif|svg\+xml|x-icon)$/;
