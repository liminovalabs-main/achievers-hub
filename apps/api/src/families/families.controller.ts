import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Role } from "@achievers-hub/database";
import { AuthUser } from "../auth/auth-user.interface";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { AcceptStudentInvitationDto } from "./dto/accept-student-invitation.dto";
import { CreateFamilyDto } from "./dto/create-family.dto";
import { InviteStudentDto } from "./dto/invite-student.dto";
import { FamiliesService } from "./families.service";

@ApiTags("families")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("families")
export class FamiliesController {
  constructor(private readonly families: FamiliesService) {}

  @Get()
  @Roles(Role.PARENT)
  list(@CurrentUser() user: AuthUser) {
    return this.families.listForParent(user.id);
  }

  @Post()
  @Roles(Role.PARENT)
  create(@CurrentUser() user: AuthUser, @Body() input: CreateFamilyDto) {
    return this.families.create(user.id, input);
  }

  @Post(":familyId/student-invitations")
  @Roles(Role.PARENT)
  inviteStudent(
    @CurrentUser() user: AuthUser,
    @Param("familyId") familyId: string,
    @Body() input: InviteStudentDto,
  ) {
    return this.families.inviteStudent(user.id, familyId, input);
  }

  @Post("student-invitations/accept")
  @Roles(Role.STUDENT)
  acceptStudentInvitation(@CurrentUser() user: AuthUser, @Body() input: AcceptStudentInvitationDto) {
    return this.families.acceptStudentInvitation(user.id, user.email, input);
  }
}
