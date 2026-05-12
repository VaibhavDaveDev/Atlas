// import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
// import { PrismaClient } from 'generated/prisma/client';
// // import { PrismaClient } from '@prisma/client';

// @Injectable()
// export class PrismaService
//   extends PrismaClient
//   implements OnModuleInit, OnModuleDestroy {
//   constructor() {
//     super({});
//   }

//   public client = this;

//   async onModuleInit() {
//     await this.client.$connect();
//   }

//   async onModuleDestroy() {
//     await this.client.$disconnect();
//   }
// }

// // export const prismaService = new PrismaService().client;

import 'dotenv/config';
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@atlas/database';
import { CustomLoggerService } from './custom-logger.service';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private readonly customLogger: CustomLoggerService) {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error(
        'DATABASE_URL environment variable is not set. Please check your .env file.',
      );
    }
    super({
      datasources: {
        db: {
          url: dbUrl,
        },
      },
    });
  }

  async onModuleInit() {
    this.customLogger.log('Connecting to database...', 'PrismaService');
    await this.$connect();
    this.customLogger.log('Database connected successfully', 'PrismaService');
  }

  async onModuleDestroy() {
    this.customLogger.log('Disconnecting from database...', 'PrismaService');
    await this.$disconnect();
    this.customLogger.log('Database disconnected', 'PrismaService');
  }
}
