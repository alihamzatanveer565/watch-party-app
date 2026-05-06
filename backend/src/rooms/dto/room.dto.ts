import { IsString, IsUrl, IsOptional, MinLength, MaxLength } from 'class-validator';

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
}

export class UpdateVideoDto {
  @IsString()
  @IsUrl()
  youtubeUrl: string;
}
