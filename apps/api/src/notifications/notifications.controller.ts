import {
  Controller,
  Get,
  Patch,
  Param,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { NotificationsService } from "./notifications.service";
import { AuthGuard } from "../common/guards/auth.guard";
import { Notification } from "@atlas/database";

@ApiTags("notifications")
@ApiBearerAuth("JWT-auth")
@UseGuards(AuthGuard)
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @ApiOperation({ summary: "Get all notifications for current user" })
  @Get()
  async findAll(@Request() req): Promise<Notification[]> {
    return this.notificationsService.findAll(req.user.userId);
  }

  @ApiOperation({ summary: "Get unread notification count" })
  @Get("unread-count")
  async getUnreadCount(@Request() req) {
    const count = await this.notificationsService.getUnreadCount(
      req.user.userId,
    );
    return { count };
  }

  @ApiOperation({ summary: "Mark a notification as read" })
  @Patch(":id/read")
  async markAsRead(@Param("id") id: string, @Request() req) {
    return this.notificationsService.markAsRead(id, req.user.userId);
  }

  @ApiOperation({ summary: "Mark all notifications as read" })
  @Patch("read-all")
  async markAllAsRead(@Request() req) {
    return this.notificationsService.markAllAsRead(req.user.userId);
  }
}
