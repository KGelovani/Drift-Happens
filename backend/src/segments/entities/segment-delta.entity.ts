import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Segment } from './segment.entity';

export enum DeltaType {
  ADDED = 'ADDED',
  REMOVED = 'REMOVED',
}

@Entity('segment_deltas')
export class SegmentDelta {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  segmentId: string;

  @Column('simple-array')
  customerIds: string[];

  @Column({
    type: 'varchar',
    enum: DeltaType,
  })
  type: DeltaType;

  @Column({ default: 0 })
  count: number;

  @Column('simple-json', { nullable: true })
  metadata: Record<string, any>;

  @Column({ default: false })
  processed: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Segment, (segment) => segment.deltas, {
    onDelete: 'CASCADE',
  })
  segment: Segment;
}
