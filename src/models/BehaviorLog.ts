import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Student } from './student';
import { Class } from './class';

@Entity()
export class BehaviorLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  studentId!: string;

  @Column()
  classId!: string;

  @Column()
  studentName!: string;

  @Column()
  behaviorLabel!: string;

  @Column()
  value!: number;

  @CreateDateColumn()
  timestamp!: Date;

  @Column({ nullable: true })
  note?: string;

  @ManyToOne(() => Student, student => student.logs)
  @JoinColumn({ name: 'studentId' })
  student!: Student;

  @ManyToOne(() => Class, classEntity => classEntity.logs)
  @JoinColumn({ name: 'classId' })
  class!: Class;
}
