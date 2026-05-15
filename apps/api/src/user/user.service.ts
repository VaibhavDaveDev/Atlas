import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CustomLoggerService } from '../common/services/custom-logger.service';
import { PrismaService } from '../common/services/prisma.service';

@Injectable()
export class UserService {
  constructor(
    private readonly customLogger: CustomLoggerService,
    private readonly prisma: PrismaService,
  ) {}

  async checkUsernameAvailability(username: string): Promise<{ isAvailable: boolean }> {
    const user = await this.prisma.authUser.findUnique({
      where: { username },
      select: { id: true },
    });
    return { isAvailable: !user };
  }

  create(createUserDto: CreateUserDto) {
    this.customLogger.log('Creating new user', 'UserService');
    return 'This action adds a new user';
  }

  findAll() {
    this.customLogger.log('Fetching all users', 'UserService');
    return `This action returns all user`;
  }

  findOne(id: string) {
    this.customLogger.log(`Fetching user with id: ${id}`, 'UserService');
    return `This action returns user #${id}`;
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    this.customLogger.log(`Updating user with id: ${id}`, 'UserService');
    return `This action updates user #${id}`;
  }

  remove(id: string) {
    this.customLogger.warn(`Removing user with id: ${id}`, 'UserService');
    return `This action removes user #${id}`;
  }
}
