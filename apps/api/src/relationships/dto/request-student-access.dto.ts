import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length } from "class-validator";

export class RequestStudentAccessDto {
  @ApiProperty({ example: "A1B2C3D4E5" })
  @IsString()
  @Length(10, 10)
  inviteCode: string;
}
