import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { COMPLEXITY_MODES, type ComplexityMode } from '@modyrn/shared';

/** Payload for updating a guild's settings. All fields are optional. */
export class UpdateGuildSettingsDto {
  @IsOptional()
  @IsIn(COMPLEXITY_MODES)
  complexityMode?: ComplexityMode;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  modLogChannelId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  quarantineRoleId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  memberRoleId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;

  @IsOptional()
  dmOnAction?: boolean;
}
