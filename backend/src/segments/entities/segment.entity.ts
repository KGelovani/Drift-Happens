import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { SegmentMembership } from './segment-membership.entity';
import { SegmentDelta } from './segment-delta.entity';

export enum SegmentType {
  DYNAMIC = 'DYNAMIC',
  STATIC = 'STATIC',
}

export interface SegmentRule {
  field: string;
  operator: string;
  value: any;
  logic?: 'AND' | 'OR';
}

@Entity('segments')
export class Segment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column({
    type: 'varchar',
    enum: SegmentType,
    default: SegmentType.DYNAMIC,
  })
  type: SegmentType;

  @Column('simple-json')
  rules: SegmentRule[];

  @Column({ nullable: true })
  parentSegmentId: string;

  @Column({ nullable: true })
  lastEvaluatedAt: Date;

  @Column({ default: 0 })
  memberCount: number;

  @Column({ default: false })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => SegmentMembership, (membership) => membership.segment, {
    cascade: true,
  })
  memberships: SegmentMembership[];

  @OneToMany(() => SegmentDelta, (delta) => delta.segment, {
    cascade: true,
  })
  deltas: SegmentDelta[];

  @ManyToMany(() => Segment)
  @JoinTable()
  dependentSegments: Segment[];
}
