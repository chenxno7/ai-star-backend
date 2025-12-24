import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppDataSource } from '../data-source';
import { Class } from '../models/class';
import { User } from '../models/user';
import { Student } from '../models/student';
import { BehaviorLog } from '../models/BehaviorLog';
import { UserClassRelation, Role } from '../models/userClassRelation';

const classRepository = AppDataSource.getRepository(Class);
const userRepository = AppDataSource.getRepository(User);
const studentRepository = AppDataSource.getRepository(Student);
const behaviorLogRepository = AppDataSource.getRepository(BehaviorLog);
const userClassRelationRepository = AppDataSource.getRepository(UserClassRelation);

// Helper to check if a string is a valid UUID, not perfect but helps
// Actually TypeORM's generated uuid is standard. 
// The old code used generateId() -> short string. 
// We are moving to UUIDs for IDs.

// Create a new class
export const createClass = async (req: AuthRequest, res: Response) => {
  try {
    const openid = req.user?.openid;
    if (!openid) return res.status(401).json({ code: 401, message: 'Unauthorized' });

    const { name, teacherName } = req.body;
    
    if (!name || !teacherName) {
      return res.status(400).json({ code: 400, message: 'Name and Teacher Name are required' });
    }

    // Find the owner user
    let user = await userRepository.findOne({ where: { openid } });
    if (!user) {
        // If user doesn't exist yet, create them (lazy creation)
        user = userRepository.create({ openid });
        await userRepository.save(user);
    }

    const newClass = classRepository.create({
      name,
      teacherName,
      ownerId: user.id
    });

    await classRepository.save(newClass);

    // Create the relation (User is TEACHER of this class)
    const relation = userClassRelationRepository.create({
      userId: user.id,
      classId: newClass.id,
      role: Role.TEACHER,
      joinTime: new Date()
    });
    await userClassRelationRepository.save(relation);

    // If user has no current class, set this one
    if (!user.currentClassId) {
      user.currentClassId = newClass.id;
      await userRepository.save(user);
    }

    return res.json({ code: 0, data: newClass });
  } catch (error) {
    console.error('createClass error:', error);
    return res.status(500).json({ code: 500, message: 'Internal Server Error' });
  }
};

// Get single class by ID
export const getClass = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const classData = await classRepository.findOne({ 
      where: { id },
      relations: ['students', 'logs'] 
    });
    
    if (!classData) {
      return res.status(404).json({ code: 404, message: 'Class not found' });
    }

    return res.json({ code: 0, data: classData });
  } catch (error) {
    return res.status(500).json({ code: 500, message: 'Internal Server Error' });
  }
};

// Get all classes for the current user
export const getMyClasses = async (req: AuthRequest, res: Response) => {
  try {
    const openid = req.user?.openid;
    if (!openid) return res.status(401).json({ code: 401, message: 'Unauthorized' });

    const user = await userRepository.findOne({ 
      where: { openid },
      relations: ['classes', 'classes.class']
    });

    if (!user || !user.classes || user.classes.length === 0) {
      return res.json({ code: 0, data: [] });
    }

    // Extract classes from the relation
    const classes = user.classes.map(uc => uc.class);

    return res.json({ code: 0, data: classes });
  } catch (error) {
    console.error('getMyClasses error:', error);
    return res.status(500).json({ code: 500, message: 'Internal Server Error' });
  }
};

// Add Student
export const addStudent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) return res.status(400).json({ code: 400, message: 'Student name required' });

    const classData = await classRepository.findOne({ where: { id } });
    if (!classData) return res.status(404).json({ code: 404, message: 'Class not found' });

    // TODO: Permission check (is user a teacher of this class?)

    const newStudent = studentRepository.create({
      name,
      score: 0,
      avatarSeed: Math.random().toString(),
      classId: classData.id
    });

    await studentRepository.save(newStudent);

    return res.json({ code: 0, data: newStudent });
  } catch (error) {
    return res.status(500).json({ code: 500, message: 'Internal Server Error' });
  }
};

// Add Log
export const addLog = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params; // classId
    const { studentId, behaviorLabel, behaviorValue, note } = req.body;
    
    if (!studentId || !behaviorLabel || behaviorValue === undefined) {
        return res.status(400).json({ code: 400, message: 'Missing log details' });
    }

    const classData = await classRepository.findOne({ where: { id } });
    if (!classData) return res.status(404).json({ code: 404, message: 'Class not found' });

    const student = await studentRepository.findOne({ where: { id: studentId, classId: id } });
    if (!student) return res.status(404).json({ code: 404, message: 'Student not found in this class' });

    // Update score
    student.score += behaviorValue;
    await studentRepository.save(student);

    const newLog = behaviorLogRepository.create({
      studentId,
      classId: id,
      studentName: student.name,
      behaviorLabel,
      value: behaviorValue,
      note,
      timestamp: new Date()
    });

    await behaviorLogRepository.save(newLog);

    // Return the updated class data including students and logs, as the frontend expects
    const updatedClassData = await classRepository.findOne({ 
        where: { id },
        relations: ['students', 'logs'],
        order: {
            logs: {
                timestamp: 'DESC'
            }
        }
    });

    return res.json({ code: 0, data: updatedClassData }); 
  } catch (error) {
    console.error(error);
    return res.status(500).json({ code: 500, message: 'Internal Server Error' });
  }
};

// Delete Class or Leave Class
export const deleteClassOrLeave = async (req: AuthRequest, res: Response) => {
  try {
    const openid = req.user?.openid;
    if (!openid) return res.status(401).json({ code: 401, message: 'Unauthorized' });

    const { id } = req.params; // classId

    const user = await userRepository.findOne({ where: { openid } });
    if (!user) {
      return res.status(404).json({ code: 404, message: 'User not found' });
    }

    const relation = await userClassRelationRepository.findOne({
      where: { userId: user.id, classId: id }
    });

    if (!relation) {
      return res.status(404).json({ code: 404, message: 'You are not a member of this class' });
    }

    if (relation.role === Role.TEACHER) {
      // Dissolve the class
      await AppDataSource.transaction(async (transactionalEntityManager) => {
        // Delete logs
        await transactionalEntityManager.delete(BehaviorLog, { classId: id });
        
        // Delete students
        await transactionalEntityManager.delete(Student, { classId: id });
        
        // Delete all relations
        await transactionalEntityManager.delete(UserClassRelation, { classId: id });
        
        // Delete class
        await transactionalEntityManager.delete(Class, { id });

        // Update currentClassId for the teacher if needed
        if (user.currentClassId === id) {
          user.currentClassId = undefined; // Or select another one?
          // To update user in transaction, we need to save via manager
          await transactionalEntityManager.update(User, user.id, { currentClassId: undefined });
        }
      });
      
      return res.json({ code: 0, message: 'Class dissolved successfully' });

    } else {
      // Leave the class (PARENT or NONE)
      await userClassRelationRepository.remove(relation);
      
      if (user.currentClassId === id) {
        user.currentClassId = undefined;
        await userRepository.save(user);
      }

      return res.json({ code: 0, message: 'Left class successfully' });
    }

  } catch (error) {
    console.error('deleteClassOrLeave error:', error);
    return res.status(500).json({ code: 500, message: 'Internal Server Error' });
  }
};

// Delete Student
export const deleteStudent = async (req: AuthRequest, res: Response) => {
  try {
    const openid = req.user?.openid;
    if (!openid) return res.status(401).json({ code: 401, message: 'Unauthorized' });

    const { id, studentId } = req.params; // classId, studentId

    // Check permissions: only TEACHER can delete students
    const user = await userRepository.findOne({ where: { openid } });
    if (!user) return res.status(404).json({ code: 404, message: 'User not found' });

    const relation = await userClassRelationRepository.findOne({
      where: { userId: user.id, classId: id, role: Role.TEACHER }
    });

    if (!relation) {
      return res.status(403).json({ code: 403, message: 'Permission denied: Only teacher can delete students' });
    }

    await AppDataSource.transaction(async (transactionalEntityManager) => {
      // Delete logs for this student
      await transactionalEntityManager.delete(BehaviorLog, { studentId: studentId, classId: id });
      
      // Delete student
      await transactionalEntityManager.delete(Student, { id: studentId, classId: id });
    });

    return res.json({ code: 0, message: 'Student deleted successfully' });
  } catch (error) {
    console.error('deleteStudent error:', error);
    return res.status(500).json({ code: 500, message: 'Internal Server Error' });
  }
};

// Undo Log
export const undoLog = async (req: AuthRequest, res: Response) => {
  try {
    const openid = req.user?.openid;
    if (!openid) return res.status(401).json({ code: 401, message: 'Unauthorized' });

    const { id, logId } = req.params; // classId, logId

    // Check permissions: only TEACHER can undo logs (assumed)
    const user = await userRepository.findOne({ where: { openid } });
    if (!user) return res.status(404).json({ code: 404, message: 'User not found' });

    const relation = await userClassRelationRepository.findOne({
      where: { userId: user.id, classId: id, role: Role.TEACHER }
    });

    if (!relation) {
      return res.status(403).json({ code: 403, message: 'Permission denied: Only teacher can undo logs' });
    }

    await AppDataSource.transaction(async (transactionalEntityManager) => {
      // Find the log first to know the value to rollback
      const log = await transactionalEntityManager.findOne(BehaviorLog, { where: { id: logId, classId: id } });
      
      if (!log) {
        throw new Error('Log not found');
      }

      // Revert student score
      const student = await transactionalEntityManager.findOne(Student, { where: { id: log.studentId } });
      if (student) {
        student.score -= log.value;
        await transactionalEntityManager.save(student);
      }

      // Delete the log
      await transactionalEntityManager.remove(log);
    });

    // Return updated class data
    const updatedClassData = await classRepository.findOne({ 
        where: { id },
        relations: ['students', 'logs'],
        order: {
            logs: {
                timestamp: 'DESC'
            }
        }
    });

    return res.json({ code: 0, message: 'Log undone successfully', data: updatedClassData });

  } catch (error: any) {
    if (error.message === 'Log not found') {
        return res.status(404).json({ code: 404, message: 'Log not found' });
    }
    console.error('undoLog error:', error);
    return res.status(500).json({ code: 500, message: 'Internal Server Error' });
  }
};
