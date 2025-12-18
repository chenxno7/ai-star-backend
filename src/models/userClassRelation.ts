import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { User } from './user';
import { Class } from './class';

export enum Role {
  TEACHER = 'TEACHER',
  PARENT = 'PARENT',
  NONE = 'NONE'
}

@Entity()
@Unique(['userId', 'classId'])
export class UserClassRelation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @Column()
  classId!: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.NONE
  })
  role!: Role;

  @CreateDateColumn()
  joinTime!: Date;

  @Column({ nullable: true })
  alias?: string;

  @ManyToOne(() => User, user => user.classes)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne(() => Class, classEntity => classEntity.members)
  @JoinColumn({ name: 'classId' })
  class!: Class;
}
