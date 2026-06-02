import { Module, Global } from "@nestjs/common";
import { HolidayService } from "./holiday.service";
import { GoogleCalendarService } from "./google-calendar.service";
import { CalendarController } from "./calendar.controller";
import { PrismaService } from "../common/services/prisma.service";

@Global()
@Module({
  controllers: [CalendarController],
  providers: [HolidayService, GoogleCalendarService, PrismaService],
  exports: [HolidayService, GoogleCalendarService],
})
export class CalendarModule {}
