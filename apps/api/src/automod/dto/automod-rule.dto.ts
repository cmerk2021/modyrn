import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { AutomodEventType, type AutomodAction, type AutomodConditionGroup } from '@modyrn/shared';

const EVENT_VALUES = Object.values(AutomodEventType);

export class UpsertAutomodRuleDto {
  @IsString() @MaxLength(100) name!: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
  @IsOptional() @IsBoolean() enabled?: boolean;
  @IsOptional() @IsInt() priority?: number;
  @IsIn(EVENT_VALUES) event!: AutomodEventType;
  @IsObject() conditions!: AutomodConditionGroup;
  @IsArray() actions!: AutomodAction[];
  @IsOptional() @IsBoolean() stopProcessing?: boolean;
  @IsOptional() @IsArray() exemptRoleIds?: string[];
  @IsOptional() @IsArray() exemptChannelIds?: string[];
}
