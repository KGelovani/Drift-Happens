import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Delete,
  HttpCode,
} from '@nestjs/common';
import { SegmentsService } from './segments.service';
import { Segment, SegmentType } from './entities/segment.entity';

@Controller('segments')
export class SegmentsController {
  constructor(private segmentsService: SegmentsService) {}

  @Post()
  async createSegment(
    @Body()
    body: {
      name: string;
      description: string;
      type: SegmentType;
      rules: any[];
      parentSegmentId?: string;
    },
  ): Promise<Segment> {
    return this.segmentsService.createSegment(
      body.name,
      body.description,
      body.type,
      body.rules,
      body.parentSegmentId,
    );
  }

  @Get()
  async getAllSegments(): Promise<Segment[]> {
    return this.segmentsService.getAllSegments();
  }

  @Get(':id')
  async getSegment(@Param('id') id: string): Promise<Segment> {
    return this.segmentsService.getSegment(id);
  }

  @Post(':id/evaluate')
  async evaluateSegment(@Param('id') id: string) {
    return this.segmentsService.evaluateSegment(id);
  }

  @Get(':id/members')
  async getSegmentMembers(
    @Param('id') id: string,
    @Query('limit') limit: number = 100,
    @Query('offset') offset: number = 0,
  ) {
    return this.segmentsService.getSegmentMembers(id, limit, offset);
  }

  @Get(':id/deltas')
  async getSegmentDeltas(@Param('id') id: string) {
    return this.segmentsService.getSegmentDeltas(id);
  }

  @Delete(':id')
  @HttpCode(204)
  async deleteSegment(@Param('id') id: string): Promise<void> {
    return this.segmentsService.deleteSegment(id);
  }
}
