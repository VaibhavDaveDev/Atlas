import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/services/prisma.service';

@Injectable()
export class LogsService {
  private readonly logger = new Logger(LogsService.name);
  private readonly lokiUrl: string;
  private readonly lokiEnabled: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.lokiUrl = this.configService.get<string>('LOKI_URL', 'http://localhost:3100');
    this.lokiEnabled = this.configService.get<string>('LOKI_ENABLED') === 'true';
  }

  async getActivityLogs(workspaceId: string, limit = 50, offset = 0): Promise<{ logs: any[]; total: number }> {
    const [logs, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where: { workspaceId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.activityLog.count({ where: { workspaceId } }),
    ]);

    return { logs, total };
  }

  async getSystemLogs(limit = 100) {
    if (!this.lokiEnabled) {
      return { 
        logs: [], 
        message: 'Loki is not enabled. Please check your LOKI_ENABLED environment variable.' 
      };
    }

    try {
      // Query Loki for the last N logs
      // query_range?query={app="atlas-api"}&limit=100
      const query = encodeURIComponent('{app="atlas-api"}');
      const response = await fetch(`${this.lokiUrl}/loki/api/v1/query_range?query=${query}&limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`Loki returned ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      
      // Flatten Loki results
      const logs = data.data.result.flatMap((res: any) => {
        return res.values.map((val: any) => ({
          timestamp: new Date(parseInt(val[0]) / 1000000).toISOString(),
          message: val[1],
          labels: res.stream
        }));
      }).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return { logs: logs.slice(0, limit) };
    } catch (error) {
      this.logger.error(`Failed to fetch logs from Loki: ${error.message}`);
      throw new HttpException(
        'Failed to fetch system logs from Loki', 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
