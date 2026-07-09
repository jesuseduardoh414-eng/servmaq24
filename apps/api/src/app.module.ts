import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { ThemeModule } from './theme/theme.module';

@Module({
  imports: [ThemeModule],
  controllers: [HealthController],
})
export class AppModule {}
