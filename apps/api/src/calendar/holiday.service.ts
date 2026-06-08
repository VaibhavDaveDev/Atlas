import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../common/services/prisma.service";
import Holidays from "date-holidays";

@Injectable()
export class HolidayService {
  private readonly logger = new Logger(HolidayService.name);
  private readonly hd = new Holidays();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fetches the list of all supported countries from date-holidays
   */
  async getAvailableCountries(): Promise<any[]> {
    try {
      const countries = this.hd.getCountries();
      // Map to the format the frontend expects: { countryCode: "AD", name: "Andorra" }
      return Object.keys(countries).map((code) => ({
        countryCode: code,
        name: countries[code],
      }));
    } catch (error) {
      this.logger.error("Error fetching available countries", error);
      throw error;
    }
  }

  /**
   * Syncs public holidays for a workspace and country code.
   * By default syncs current year and next year.
   */
  async syncHolidays(workspaceId: string, countryCode: string): Promise<void> {
    const currentYear = new Date().getFullYear();
    const years = [currentYear, currentYear + 1];

    for (const year of years) {
      await this.syncYearHolidays(workspaceId, countryCode, year);
    }
  }

  private async syncYearHolidays(
    workspaceId: string,
    countryCode: string,
    year: number,
  ): Promise<void> {
    try {
      this.logger.log(`Syncing holidays for ${countryCode} in ${year}`);
      
      this.hd.init(countryCode);
      const holidays = this.hd.getHolidays(year);

      if (!holidays || holidays.length === 0) {
        this.logger.warn(
          `Could not find any holidays for ${countryCode} in ${year}`,
        );
        return;
      }

      for (const holiday of holidays) {
        // date-holidays returns a date string like "2024-01-01 00:00:00"
        const holidayDate = new Date(holiday.date);

        await this.prisma.holiday.upsert({
          where: {
            workspaceId_date: {
              workspaceId,
              date: holidayDate,
            },
          },
          update: {
            name: holiday.name,
            description: holiday.type || null,
          },
          create: {
            workspaceId,
            name: holiday.name,
            date: holidayDate,
            description: holiday.type || null,
          },
        });
      }
    } catch (error) {
      this.logger.error(
        `Error syncing holidays for workspace ${workspaceId}, country ${countryCode}, year ${year}`,
        error,
      );
    }
  }
}
