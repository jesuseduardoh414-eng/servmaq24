import { Module } from '@nestjs/common';
import { WishlistController } from './wishlist.controller';
import { CommentsController } from './comments.controller';
import { ProfileController } from './profile.controller';

/** Cuenta y engagement: wishlist, comentarios de producto, perfil. */
@Module({
  controllers: [WishlistController, CommentsController, ProfileController],
})
export class AccountModule {}
