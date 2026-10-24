import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsUUID } from "class-validator";

export class InviteTutorDto {
  @ApiProperty({ example: "tutor@example.com" })
  @IsEmail()
  email: string;

  @ApiProperty({ description: "StudentProfile identifier" })
  @IsUUID()
  studentId: string;
}
