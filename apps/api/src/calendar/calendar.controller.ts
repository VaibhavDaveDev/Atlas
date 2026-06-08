import { Controller, Get, UseGuards, Req, Logger } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiCookieAuth } from "@nestjs/swagger";
import { AuthGuard } from "../common/guards/auth.guard";
import { GoogleCalendarService } from "./google-calendar.service";
import { HolidayService } from "./holiday.service";
import type { Request } from "express";

@ApiTags("calendar")
@Controller("calendar")
export class CalendarController {
  private readonly logger = new Logger(CalendarController.name);

  constructor(
    private readonly googleCalendarService: GoogleCalendarService,
    private readonly holidayService: HolidayService,
  ) {}

  @UseGuards(AuthGuard)
  @ApiCookieAuth("better-auth-cookie")
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

  @UseGuards(AuthGuard)
  @ApiCookieAuth("better-auth-cookie")
  @Get("countries")
  @ApiOperation({
    summary: "Get available countries for holidays",
  })
  async getCountries() {
    return await this.holidayService.getAvailableCountries();
  }
}
