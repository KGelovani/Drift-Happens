import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Segment } from './segment.entity';
import { Customer } from '../../customers/entities/customer.entity';

@Entity('segment_memberships')
export class SegmentMembership {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  segmentId: string;

  @Column()
  customerId: string;

  @ManyToOne(() => Segment, (segment) => segment.memberships, {
    onDelete: 'CASCADE',
  })
  segment: Segment;

  @ManyToOne(() => Customer)
  customer: Customer;

  @CreateDateColumn()
  joinedAt: Date;
}
