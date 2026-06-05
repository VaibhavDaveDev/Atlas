import { Module } from "@nestjs/common";
import { ProjectsService } from "./projects/projects.service";
import { ProjectsController } from "./projects/projects.controller";
import { TasksService } from "./tasks/tasks.service";
import { TasksController } from "./tasks/tasks.controller";
import { MilestonesService } from "./milestones/milestones.service";
import { MilestonesController } from "./milestones/milestones.controller";
import { PrismaService } from "../common/services/prisma.service";
import { CustomLoggerService } from "../common/services/custom-logger.service";

@Module({
  controllers: [ProjectsController, TasksController, MilestonesController],
  providers: [
    ProjectsService,
    TasksService,
    MilestonesService,
    PrismaService,
    CustomLoggerService,
  ],
  exports: [ProjectsService, TasksService, MilestonesService],
})
export class ProjectModule {}
