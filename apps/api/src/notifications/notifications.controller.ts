import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtGuard, type AuthedRequest } from '../auth/jwt.guard';
import { NotificationsService } from './notifications.service';

/** Campana del sitio: solo del usuario de la sesión. */
@Controller('notifications')
@UseGuards(JwtGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@Req() req: AuthedRequest) {
    return this.notifications.list(req.userId);
  }

  @Post('read')
  read(@Req() req: AuthedRequest, @Body() body: { id?: number }) {
    const id = Number(body?.id);
    return this.notifications.markRead(req.userId, Number.isInteger(id) && id > 0 ? id : undefined);
  }
}
