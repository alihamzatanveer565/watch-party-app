import { Controller, Get, Param } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get(':roomId/messages')
  getMessages(@Param('roomId') roomId: string) {
    return this.chatService.getMessages(roomId);
  }
}
