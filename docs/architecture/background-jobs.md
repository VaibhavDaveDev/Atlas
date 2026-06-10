# Background Jobs

Atlas ERP uses [BullMQ](https://docs.bullmq.io/) backed by Redis for handling asynchronous background jobs. This architecture prevents heavy, time-consuming operations from blocking the main API threads, ensuring the system remains responsive.

## Queue Architecture

```mermaid
graph LR
    API[NestJS API (Producers)] -->|Add Job| Redis[(Redis)]
    Redis -->|Pop Job| Worker1[BullMQ Worker (Email)]
    Redis -->|Pop Job| Worker2[BullMQ Worker (Reports)]
    Worker1 -->|Status| Redis
    Worker2 -->|Status| Redis
```

## Use Cases for Background Jobs

We utilize background jobs for tasks such as:
- **Email Dispatching:** Sending transactional emails (welcome emails, password resets, invoices) via Brevo.
- **Report Generation:** Compiling heavy financial or HR reports into PDFs or CSVs.
- **Payroll Processing:** Calculating salaries for hundreds of employees simultaneously.
- **Data Imports/Exports:** Processing large CSV files uploaded by users.

## Implementation Details

### Configuration
The Queue system is configured in `apps/api/src/common/modules/queue.module.ts`. It registers BullMQ and connects it to the Redis instance defined in the environment variables.

### Producers (Adding Jobs)
To add a job to a queue, a service injects the BullMQ queue and calls `add()`.

```typescript
// apps/api/src/common/services/email.service.ts
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class EmailService {
  constructor(@InjectQueue('email') private emailQueue: Queue) {}

  async sendWelcomeEmail(userId: string, email: string) {
    // Add job to queue, offloading the actual HTTP request to Brevo
    await this.emailQueue.add('send-welcome', {
      userId,
      email,
    });
  }
}
```

### Consumers (Processing Jobs)
Workers process the jobs asynchronously. They are defined using the `@Processor` decorator.

```typescript
// apps/api/src/common/queues/email/email.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

@Processor('email')
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.debug(`Processing job ${job.id} of type ${job.name}`);
    
    switch (job.name) {
      case 'send-welcome':
        // Execute actual Brevo API call here
        break;
      // ...
    }
  }
}
```

## Job Retries and Failure Handling

BullMQ handles job failures gracefully. When a job is added, we configure backoff strategies:

```typescript
await this.emailQueue.add('send-welcome', data, {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 1000, // 1s, 2s, 4s...
  },
});
```
If a job fails 3 times, it is moved to the `failed` queue where it can be inspected and manually retried later.