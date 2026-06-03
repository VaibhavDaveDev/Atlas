import { Controller, Get, Post, Body, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { PeriodsService } from "./periods.service";

@ApiTags("Finance / Periods")
@ApiBearerAuth()
@Controller("finance/periods")
export class PeriodsController {
  constructor(private readonly periodsService: PeriodsService) {}

  @Get()
  @ApiOperation({ summary: "Get all fiscal periods" })
  async findAll(@Req() req: any) {
    const workspaceId = req.user.workspaceId;
    const data = await this.periodsService.findAll(workspaceId);
    return { success: true, data };
  }

  @Post("close")
  @ApiOperation({ summary: "Close a fiscal period" })
  async closePeriod(
    @Req() req: any,
    @Body() body: { name: string; startDate: string; endDate: string },
  ) {
    const workspaceId = req.user.workspaceId;
    const userId = req.user.id;
    const data = await this.periodsService.closePeriod(
      workspaceId,
      userId,
      body,
    );
    return { success: true, data };
  }
}
