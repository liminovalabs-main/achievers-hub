import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean } from "class-validator";

export class DecideTutorLinkDto {
  @ApiProperty()
  @IsBoolean()
  approved: boolean;
}
