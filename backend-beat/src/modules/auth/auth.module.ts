import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './services/auth.service';
import { DatabaseModule } from '../../database/database.module';
import { ProviderModule } from '../../providers/provider.module';
import { JwtStrategy } from './strategies/jwt.strategies';

@Module({
  imports: [
    DatabaseModule,
    ProviderModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtStrategy],
})
export class AuthModule {}
