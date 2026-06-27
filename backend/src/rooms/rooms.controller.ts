import { Controller, Post, Get, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto, UpdateVideoDto, UpdateVisibilityDto } from './dto/room.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('rooms')
export class RoomsController {
  constructor(private roomsService: RoomsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Request() req, @Body() dto: CreateRoomDto) {
    return this.roomsService.create(req.user.id, dto);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  myRooms(@Request() req) {
    return this.roomsService.getMyRooms(req.user.id);
  }

  @Get('public')
  getPublicRooms() {
    return this.roomsService.findPublicRooms();
  }

  @Get('invite/:code')
  findByInvite(@Param('code') code: string) {
    return this.roomsService.findByInviteCode(code);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roomsService.findById(id);
  }

  @Patch(':id/video')
  @UseGuards(JwtAuthGuard)
  updateVideo(@Param('id') id: string, @Request() req, @Body() dto: UpdateVideoDto) {
    return this.roomsService.updateVideo(id, req.user.id, dto);
  }

  @Patch(':id/visibility')
  @UseGuards(JwtAuthGuard)
  updateVisibility(@Param('id') id: string, @Request() req, @Body() dto: UpdateVisibilityDto) {
    return this.roomsService.updateVisibility(id, req.user.id, dto.visibility);
  }

  @Get(':id/participants')
  getParticipants(@Param('id') id: string) {
    return this.roomsService.getParticipants(id);
  }

  @Get(':id/pending-requests')
  @UseGuards(JwtAuthGuard)
  getPendingRequests(@Param('id') id: string, @Request() req) {
    return this.roomsService.getPendingRequests(id, req.user.id);
  }
}
