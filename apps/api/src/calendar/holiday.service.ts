import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../common/services/prisma.service";

@Injectable()
export class HolidayService {
  private readonly logger = new Logger(HolidayService.name);
  private readonly baseUrl = "https://date.nager.at/api/v3";

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fetches the list of all supported countries from Nager.Date API
   */
  async getAvailableCountries(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/AvailableCountries`);
      if (!response.ok) {
        throw new Error(`Failed to fetch countries: ${response.statusText}`);
      }
      return await response.json();
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
      const response = await fetch(
        `${this.baseUrl}/PublicHolidays/${year}/${countryCode}`,
      );

      if (!response.ok) {
        this.logger.warn(
          `Could not fetch holidays for ${countryCode} in ${year}: ${response.statusText}`,
        );
        return;
      }

      const holidays = await response.json();

      for (const holiday of holidays) {
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
            description:
              holiday.localName !== holiday.name ? holiday.localName : null,
          },
          create: {
            workspaceId,
            name: holiday.name,
            date: holidayDate,
            description:
              holiday.localName !== holiday.name ? holiday.localName : null,
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
