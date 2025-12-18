import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user';
import { UserClassRelation } from './userClassRelation';
import { Student } from './student';
import { BehaviorLog } from './BehaviorLog';

@Entity()
export class Class {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  teacherName!: string;

  @Column()
  ownerId!: string;

  @ManyToOne(() => User, user => user.createdClasses)
  @JoinColumn({ name: 'ownerId' })
  owner!: User;

  @OneToMany(() => UserClassRelation, userClassRelation => userClassRelation.class)
  members!: UserClassRelation[];

  @OneToMany(() => Student, student => student.class)
  students!: Student[];

  @OneToMany(() => BehaviorLog, log => log.class)
  logs!: BehaviorLog[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
