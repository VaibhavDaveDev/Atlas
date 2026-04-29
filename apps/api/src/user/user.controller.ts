import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CustomLoggerService } from '../common/services/custom-logger.service';
import {
  ApiResponseDecorator,
  ApiArrayResponseDecorator,
} from '../common/decorators';
import { User } from './entities/user.entity';
import { AuthGuard } from '../common/guards/auth.guard';

@ApiTags('users')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard)  // All user management endpoints require authentication
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly customLogger: CustomLoggerService,
  ) {}

  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponseDecorator(201, 'User created successfully', User)
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @ApiOperation({ summary: 'Get all users' })
  @ApiArrayResponseDecorator(200, 'Users retrieved successfully', User)
  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponseDecorator(200, 'User retrieved successfully', User)
  @Get(':id')
  findOne(@Param('id') id: string) {
    // id is a UUID string — do NOT coerce to number with +id
    return this.userService.findOne(id);
  }

  @ApiOperation({ summary: 'Update user by ID' })
  @ApiResponseDecorator(200, 'User updated successfully', User)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @ApiOperation({ summary: 'Delete user by ID' })
  @ApiResponseDecorator(200, 'User deleted successfully')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
