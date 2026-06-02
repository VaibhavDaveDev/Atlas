import { Controller, Get, UseGuards, Req, Logger } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AuthGuard } from "../common/guards/auth.guard";
import { GoogleCalendarService } from "./google-calendar.service";
import type { Request } from "express";

@ApiTags("calendar")
@Controller("calendar")
export class CalendarController {
  private readonly logger = new Logger(CalendarController.name);

  constructor(private readonly googleCalendarService: GoogleCalendarService) {}

  @UseGuards(AuthGuard)
  @ApiBearerAuth("JWT-auth")
  @Get("sync")
  @ApiOperation({
    summary: "Sync upcoming events and holidays to Google Calendar",
  })
  async syncCalendar(@Req() req: Request) {
    const user = (req as any).user;
    this.logger.log(`Manual calendar sync requested by user ${user.userId}`);
    return await this.googleCalendarService.syncUpcomingEventsForUser(
      user.userId,
    );
  }
}
