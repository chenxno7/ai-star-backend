import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { UserClassRelation } from './userClassRelation';
import { Class } from './class';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  openid!: string;

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true })
  avatarUrl?: string;

  @Column({ nullable: true })
  currentClassId?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => UserClassRelation, userClassRelation => userClassRelation.user)
  classes!: UserClassRelation[];

  @OneToMany(() => Class, classEntity => classEntity.owner)
  createdClasses!: Class[];
}
