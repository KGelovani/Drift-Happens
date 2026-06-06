import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHealth() {
    return { status: 'ok', message: 'Drift Happens API is running' };
  }

  @Get('health')
  checkHealth() {
    return { status: 'healthy', timestamp: new Date().toISOString() };
  }
}
