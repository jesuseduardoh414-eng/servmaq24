import { Module } from '@nestjs/common';
import { WishlistController } from './wishlist.controller';
import { CommentsController } from './comments.controller';
import { ReviewsController } from './reviews.controller';
import { ProductQuestionsController } from './product-questions.controller';
import { ProfileController } from './profile.controller';

/** Cuenta y engagement: wishlist, comentarios, reseñas, preguntas de producto, perfil. */
@Module({
  controllers: [WishlistController, CommentsController, ReviewsController, ProductQuestionsController, ProfileController],
})
export class AccountModule {}
