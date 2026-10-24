import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { RelationshipsController } from "./relationships.controller";
import { RelationshipsService } from "./relationships.service";

@Module({
  imports: [AuthModule],
  controllers: [RelationshipsController],
  providers: [RelationshipsService],
})
export class RelationshipsModule {}
