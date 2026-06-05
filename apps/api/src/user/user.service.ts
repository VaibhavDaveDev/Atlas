import { Injectable } from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { CustomLoggerService } from "../common/services/custom-logger.service";
import { PrismaService } from "../common/services/prisma.service";

@Injectable()
export class UserService {
  constructor(
    private readonly customLogger: CustomLoggerService,
    private readonly prisma: PrismaService,
  ) {}

  async checkUsernameAvailability(
    username: string,
  ): Promise<{ isAvailable: boolean }> {
    const user = await this.prisma.authUser.findUnique({
      where: { username },
      select: { id: true },
    });
    return { isAvailable: !user };
  }

  create(createUserDto: CreateUserDto) {
    this.customLogger.log("Creating new user", "UserService");
    return "This action adds a new user";
  }

  findAll() {
    this.customLogger.log("Fetching all users", "UserService");
    return `This action returns all user`;
  }

  findOne(id: string) {
    this.customLogger.log(`Fetching user with id: ${id}`, "UserService");
    return `This action returns user #${id}`;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    this.customLogger.log(`Updating user with id: ${id}`, "UserService");

    // Check if user exists
    const user = await this.prisma.authUser.findUnique({
      where: { id },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Check username uniqueness if provided
    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const existing = await this.prisma.authUser.findUnique({
        where: { username: updateUserDto.username },
      });
      if (existing) {
        throw new Error("Username already taken");
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const userUpdate = await tx.authUser.update({
        where: { id },
        data: {
          username: updateUserDto.username,
          name:
            updateUserDto.firstName && updateUserDto.lastName
              ? `${updateUserDto.firstName} ${updateUserDto.lastName}`
              : undefined,
          image: updateUserDto.image,
        },
        select: {
          id: true,
          email: true,
          username: true,
          globalRole: true,
          verified: true,
          image: true,
        },
      });

      // Update UserProfile if profile-related fields are provided
      if (
        updateUserDto.firstName ||
        updateUserDto.lastName ||
        updateUserDto.notificationRetentionDays !== undefined
      ) {
        await tx.userProfile.upsert({
          where: { authId: id },
          create: {
            authId: id,
            firstName: updateUserDto.firstName,
            lastName: updateUserDto.lastName,
            notificationRetentionDays:
              updateUserDto.notificationRetentionDays ?? 30,
          },
          update: {
            firstName: updateUserDto.firstName,
            lastName: updateUserDto.lastName,
            notificationRetentionDays: updateUserDto.notificationRetentionDays,
          },
        });
      }

      return userUpdate;
    });

    return {
      ...updated,
      role: updated.globalRole,
    };
  }

  remove(id: string) {
    this.customLogger.warn(`Removing user with id: ${id}`, "UserService");
    return `This action removes user #${id}`;
  }
}
