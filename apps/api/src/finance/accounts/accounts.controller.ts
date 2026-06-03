import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { WorkspaceGuard } from '../../auth/guards/workspace.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { PermissionGuard } from '../../auth/guards/permission.guard';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator';
import type { Request } from 'express';

@ApiTags('finance-accounts')
@Controller('finance/accounts')
@UseGuards(AuthGuard, WorkspaceGuard, RolesGuard, PermissionGuard)
@ApiBearerAuth('JWT-auth')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  @RequirePermission({ resource: 'finance_accounts', action: 'create', scope: 'all' })
  @ApiOperation({ summary: 'Create a new account' })
  async create(@Body() createAccountDto: CreateAccountDto, @Req() req: Request): Promise<any> {
    const workspaceId = (req as any).user.workspaceId;
    return this.accountsService.create(workspaceId, createAccountDto);
  }

  @Get()
  @RequirePermission({ resource: 'finance_accounts', action: 'read', scope: 'all' })
  @ApiOperation({ summary: 'Get all accounts' })
  async findAll(@Req() req: Request): Promise<any[]> {
    const workspaceId = (req as any).user.workspaceId;
    return this.accountsService.findAll(workspaceId);
  }

  @Get(':id')
  @RequirePermission({ resource: 'finance_accounts', action: 'read', scope: 'all' })
  @ApiOperation({ summary: 'Get account by ID' })
  async findOne(@Param('id') id: string, @Req() req: Request): Promise<any> {
    const workspaceId = (req as any).user.workspaceId;
    return this.accountsService.findOne(workspaceId, id);
  }

  @Put(':id')
  @RequirePermission({ resource: 'finance_accounts', action: 'update', scope: 'all' })
  @ApiOperation({ summary: 'Update an account' })
  async update(
    @Param('id') id: string,
    @Body() updateAccountDto: UpdateAccountDto,
    @Req() req: Request,
  ): Promise<any> {
    const workspaceId = (req as any).user.workspaceId;
    return this.accountsService.update(workspaceId, id, updateAccountDto);
  }

  @Delete(':id')
  @RequirePermission({ resource: 'finance_accounts', action: 'delete', scope: 'all' })
  @ApiOperation({ summary: 'Delete an account' })
  async remove(@Param('id') id: string, @Req() req: Request): Promise<any> {
    const workspaceId = (req as any).user.workspaceId;
    return this.accountsService.remove(workspaceId, id);
  }
}
