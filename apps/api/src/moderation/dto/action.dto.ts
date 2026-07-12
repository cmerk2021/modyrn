import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

/** Warn a member. */
export class WarnDto {
  @IsString() targetUserId!: string;
  @IsOptional() @IsString() @MaxLength(2000) reason?: string;
  @IsOptional() dmUser?: boolean;
}

/** Timeout a member for a duration (ms). */
export class TimeoutDto {
  @IsString() targetUserId!: string;
  /** Duration in milliseconds (max 28 days). */
  @IsInt() @Min(1000) @Max(28 * 24 * 60 * 60 * 1000) durationMs!: number;
  @IsOptional() @IsString() @MaxLength(2000) reason?: string;
  @IsOptional() dmUser?: boolean;
}

/** Kick a member. */
export class KickDto {
  @IsString() targetUserId!: string;
  @IsOptional() @IsString() @MaxLength(2000) reason?: string;
  @IsOptional() dmUser?: boolean;
}

/** Ban (optionally temporary) a member. */
export class BanDto {
  @IsString() targetUserId!: string;
  @IsOptional() @IsString() @MaxLength(2000) reason?: string;
  /** Optional temp-ban duration in ms; omit for a permanent ban. */
  @IsOptional() @IsInt() @Min(1000) durationMs?: number;
  /** Days of messages to delete (0-7). */
  @IsOptional() @IsInt() @Min(0) @Max(7) deleteMessageDays?: number;
  @IsOptional() dmUser?: boolean;
}

export class UnbanDto {
  @IsString() targetUserId!: string;
  @IsOptional() @IsString() @MaxLength(2000) reason?: string;
}

export class QuarantineDto {
  @IsString() targetUserId!: string;
  @IsOptional() @IsString() @MaxLength(2000) reason?: string;
  /** Optional profile to use; falls back to the guild's default quarantine role. */
  @IsOptional() @IsString() profileId?: string;
}

export class NoteDto {
  @IsString() targetUserId!: string;
  @IsString() @MaxLength(2000) content!: string;
}

export class RoleActionDto {
  @IsString() targetUserId!: string;
  @IsString() roleId!: string;
  @IsIn(['add', 'remove']) operation!: 'add' | 'remove';
  @IsOptional() @IsString() @MaxLength(2000) reason?: string;
}

export class NicknameDto {
  @IsString() targetUserId!: string;
  @IsOptional() @IsString() @MaxLength(32) nickname?: string;
  @IsOptional() @IsString() @MaxLength(2000) reason?: string;
}

export class PurgeDto {
  @IsString() channelId!: string;
  @IsInt() @Min(1) @Max(100) count!: number;
  /** Restrict deletion to messages from this user. */
  @IsOptional() @IsString() targetUserId?: string;
  @IsOptional() @IsString() @MaxLength(2000) reason?: string;
}
