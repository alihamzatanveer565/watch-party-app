import { IsString, IsUrl, IsOptional, IsEnum, MinLength, MaxLength } from 'class-validator';

export type RoomVisibility = 'PUBLIC' | 'PRIVATE' | 'UNLISTED';

export class CreateRoomDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name: string;

  @IsString()
  @IsUrl()
  youtubeUrl: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @IsOptional()
  @IsEnum(['PUBLIC', 'PRIVATE', 'UNLISTED'])
  visibility?: RoomVisibility;
}

export class UpdateVideoDto {
  @IsString()
  @IsUrl()
  youtubeUrl: string;
}

export class UpdateVisibilityDto {
  @IsEnum(['PUBLIC', 'PRIVATE', 'UNLISTED'])
  visibility: RoomVisibility;
}
