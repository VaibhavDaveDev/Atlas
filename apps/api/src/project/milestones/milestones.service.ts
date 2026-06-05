import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../common/services/prisma.service";
import { CustomLoggerService } from "../../common/services/custom-logger.service";
import { CreateMilestoneDto } from "./dto/create-milestone.dto";
import { UpdateMilestoneDto } from "./dto/update-milestone.dto";
import { Milestone } from "@atlas/database";

@Injectable()
export class MilestonesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: CustomLoggerService,
  ) {}

  async create(
    workspaceId: string,
    createMilestoneDto: CreateMilestoneDto,
  ): Promise<Milestone> {
    this.logger.log(
      `Creating milestone: ${createMilestoneDto.name}`,
      "MilestonesService",
    );

    // Verify project exists in workspace
    const project = await this.prisma.project.findFirst({
      where: { id: createMilestoneDto.projectId, workspaceId },
    });

    if (!project) {
      throw new BadRequestException("Project not found in workspace");
    }

    return this.prisma.milestone.create({
      data: createMilestoneDto,
    });
  }

  async findAll(workspaceId: string, projectId?: string): Promise<Milestone[]> {
    return this.prisma.milestone.findMany({
      where: {
        project: {
          workspaceId,
        },
        ...(projectId ? { projectId } : {}),
      },
      orderBy: { targetDate: "asc" },
    });
  }

  async findOne(workspaceId: string, id: string): Promise<Milestone> {
    const milestone = await this.prisma.milestone.findFirst({
      where: {
        id,
        project: {
          workspaceId,
        },
      },
    });

    if (!milestone) {
      throw new NotFoundException(`Milestone with ID ${id} not found`);
    }

    return milestone;
  }

  async update(
    workspaceId: string,
    id: string,
    updateMilestoneDto: UpdateMilestoneDto,
  ): Promise<Milestone> {
    this.logger.log(`Updating milestone: ${id}`, "MilestonesService");

    await this.findOne(workspaceId, id);

    return this.prisma.milestone.update({
      where: { id },
      data: updateMilestoneDto,
    });
  }

  async remove(workspaceId: string, id: string): Promise<Milestone> {
    this.logger.warn(`Removing milestone: ${id}`, "MilestonesService");

    await this.findOne(workspaceId, id);

    return this.prisma.milestone.delete({
      where: { id },
    });
  }
}
