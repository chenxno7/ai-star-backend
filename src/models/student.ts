import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Class } from './class';
import { BehaviorLog } from './BehaviorLog';

@Entity()
export class Student {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ default: 0 })
  score!: number;

  @Column()
  avatarSeed!: string;

  @Column()
  classId!: string;

  @ManyToOne(() => Class, classEntity => classEntity.students)
  @JoinColumn({ name: 'classId' })
  class!: Class;

  @OneToMany(() => BehaviorLog, log => log.student)
  logs!: BehaviorLog[];
}
