import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length } from "class-validator";

export class CreateFamilyDto {
  @ApiProperty({ example: "The Morgan family" })
  @IsString()
  @Length(2, 80)
  name: string;
}
