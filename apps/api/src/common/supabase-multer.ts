import type { StorageEngine } from 'multer';
import { MEDIA_BUCKET, sanitizeKey, supabase } from './supabase';

/**
 * Motor de multer que sube el archivo a Supabase Storage (bucket `media/uploads/`)
 * en lugar de disco. Mantiene la convención previa: `file.filename` es el nombre pelón
 * y el handler guarda `uploads/${file.filename}` en la BD (que imageUrl() resuelve al bucket).
 */
export function supabaseStorage(): StorageEngine {
  const engine: StorageEngine = {
    _handleFile(_req, file, cb) {
      const chunks: Buffer[] = [];
      file.stream.on('data', (c: Buffer) => chunks.push(c));
      file.stream.on('error', (e) => cb(e));
      file.stream.on('end', () => {
        const safe = file.originalname.replace(/[^a-zA-Z0-9.]+/g, '-').slice(-60);
        const filename = `${Date.now()}-${safe}`;
        const buf = Buffer.concat(chunks);
        supabase()
          .storage.from(MEDIA_BUCKET)
          .upload(sanitizeKey(`uploads/${filename}`), buf, { contentType: file.mimetype, upsert: true })
          .then(({ error }) =>
            error ? cb(error) : cb(null, { filename, size: buf.length, path: `uploads/${filename}` }),
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
