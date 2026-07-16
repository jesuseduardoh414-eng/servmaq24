import {
  BadRequestException, Body, Controller, Get, NotFoundException, Param,
  ParseIntPipe, Patch, Post, Req, UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@maqserv/db';
import { AdminGuard, forgetAdmin, type AdminRequest } from './admin-auth';
import { adminCreateUser, adminSetPassword } from '../common/supabase-auth';

/**
 * Quién puede entrar al panel.
 *
 * ⚠️ LO QUE HAY QUE ENTENDER ANTES DE TOCAR ESTO: el login de admin **NO valida
 * `admins.password`**. Va por `passwordGrant` de Supabase Auth (ver `admin-auth.ts`);
 * la columna `password` es un hash heredado del Laravel viejo que ya nadie lee.
 *
 * Una cuenta de administrador vive en DOS lados y necesita los dos:
 *   1. la fila en `admins` (id, nombre, rol, `status`),
 *   2. el usuario en `auth.users` con `app_metadata.role = 'admin'` y `app_admin_id`,
 *      enlazado por `admins.auth_id`.
 *
 * Antes esto solo hacía (1): la creación respondía 201 y el administrador nuevo
 * **no podía entrar jamás** (401). Era deuda de la migración a Supabase — el módulo
 * se escribió antes y nunca se re-cableó.
 */
@Controller('admin/admins')
@UseGuards(AdminGuard)
export class AdminAdminsController {
  @Get()
  async list(@Req() req: AdminRequest) {
    const rows = await prisma.admins.findMany({ orderBy: { id: 'asc' } });
    return rows.map((a) => ({
      id: a.id,
      name: a.name,
      email: a.email,
      role: a.role,
      status: a.status,
      /** Sin `auth_id` no existe en Supabase ⇒ no puede entrar por más activo que se vea. */
      canLogin: a.auth_id !== null,
      isMe: a.id === req.adminId,
      createdAt: a.created_at ? a.created_at.toISOString() : null,
    }));
  }

  @Post()
  async create(@Body() body: unknown) {
    const schema = z.object({
      name: z.string().min(2).max(100),
      email: z.string().email().max(190),
      password: z.string().min(8).max(100),
      phone: z.string().max(50).optional(),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.issues[0]?.message ?? 'Datos inválidos');
    const email = parsed.data.email.trim().toLowerCase();

    if (await prisma.admins.findUnique({ where: { email } })) {
      throw new BadRequestException('Ya existe un administrador con ese correo');
    }

    const a = await prisma.admins.create({
      data: {
        name: parsed.data.name,
        email,
        phone: parsed.data.phone ?? '',
        // Se conserva por compatibilidad con el sistema viejo; el login NO lo usa.
        password: await bcrypt.hash(parsed.data.password, 10),
        role: 'Administrator',
        status: 1,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    // La cuenta que SÍ da acceso. `app_admin_id` es lo que el AdminGuard lee del JWT.
    try {
      const user = await adminCreateUser(email, parsed.data.password, {
        role: 'admin',
        provider_role: 'admin',
        app_admin_id: a.id,
      });
      await prisma.admins.update({ where: { id: a.id }, data: { auth_id: user.id } });
    } catch (e) {
      // Sin usuario de Supabase la fila es inservible: se deshace en vez de dejar
      // un administrador fantasma que aparenta estar activo y no puede entrar.
      await prisma.admins.delete({ where: { id: a.id } });
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      throw new BadRequestException(
        /already|exists|registered/i.test(msg)
          ? 'Ese correo ya está registrado en el sistema (quizá como cliente). Usa otro.'
          : `No se pudo crear la cuenta de acceso: ${msg}`,
      );
    }

    return { id: a.id };
  }

  @Patch(':id')
  async update(@Req() req: AdminRequest, @Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    const schema = z.object({
      name: z.string().min(2).max(100).optional(),
      password: z.string().min(8).max(100).optional(),
      status: z.coerce.number().int().min(0).max(1).optional(),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) throw new BadRequestException('Datos inválidos');

    const a = await prisma.admins.findUnique({ where: { id } });
    if (!a) throw new NotFoundException('Administrador no encontrado');
    // Nadie se desactiva a sí mismo (evita quedarse sin acceso).
    if (parsed.data.status === 0 && id === req.adminId) {
      throw new BadRequestException('No puedes desactivar tu propia cuenta');
    }

    // La contraseña vive en Supabase: reescribir solo el hash legacy no cambiaba nada.
    if (parsed.data.password) {
      if (!a.auth_id) throw new BadRequestException('Esta cuenta no tiene acceso configurado; no se le puede cambiar la contraseña.');
      await adminSetPassword(a.auth_id, parsed.data.password);
    }

    await prisma.admins.update({
      where: { id },
      data: {
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        // Se mantiene el hash legacy en sincronía por si algo viejo aún lo lee.
        ...(parsed.data.password !== undefined ? { password: await bcrypt.hash(parsed.data.password, 10) } : {}),
        ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
        updated_at: new Date(),
      },
    });
    // El guard cachea "sigue activa" unos segundos: sin esto, un admin recién
    // desactivado seguiría entrando hasta que la caché venciera sola.
    if (parsed.data.status !== undefined) forgetAdmin(id);
    return { ok: true };
  }
}
