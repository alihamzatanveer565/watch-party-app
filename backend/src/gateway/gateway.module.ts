import { Module } from '@nestjs/common';
import { AppGateway } from './app.gateway';
import { ChatModule } from '../chat/chat.module';
import { RoomsModule } from '../rooms/rooms.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ChatModule, RoomsModule, AuthModule],
  providers: [AppGateway],
})
export class GatewayModule {}
