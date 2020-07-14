import { Controller, Get, Param, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { TopicsEntity } from './storage/topics.entity';
import { ApiParam, ApiQuery } from '@nestjs/swagger';


@Controller('api')
export class AppController {

  constructor(private readonly appService: AppService) {}

  @Get('/occurrence/:fromTS')
  @ApiParam({name: 'fromTS', description: 'Time since when data to be returned Unix TS'})
  @ApiQuery({name: 'ps', description: 'Page Size', required: false})
  report(@Param('fromTS') fromTS: number, @Query('ps') pageSize = 24*60 ): Promise<TopicsEntity[]> {
    return this.appService.getOccurrenceReport(fromTS*1000, +pageSize)
  }

}
