import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppDataSource } from '../data-source';
import { User } from '../models/user';
import { UserClassRelation, Role } from '../models/userClassRelation';

const userRepository = AppDataSource.getRepository(User);
const userClassRelationRepository = AppDataSource.getRepository(UserClassRelation);

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const openid = req.user?.openid;
    if (!openid) return res.status(401).json({ code: 401, message: 'Unauthorized' });

    const user = await userRepository.findOne({ 
      where: { openid },
      relations: ['classes', 'classes.class']
    });

    if (!user) {
      // User not found, return 404 so frontend knows to register/handle
      return res.status(404).json({ code: 404, message: 'User not found' });
    }

    return res.json({ code: 0, data: user });
  } catch (error) {
    console.error('getMe error:', error);
    return res.status(500).json({ code: 500, message: 'Internal Server Error' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const openid = req.user?.openid;
    if (!openid) return res.status(401).json({ code: 401, message: 'Unauthorized' });

    const { newClassRelation, ...userData } = req.body;

    // Find user or create if not exists
    let user = await userRepository.findOne({ 
      where: { openid },
      relations: ['classes']
    });
    
    if (!user) {
      user = userRepository.create({ openid });
      await userRepository.save(user);
    }

    // Update basic fields
    if (userData.name) user.name = userData.name;
    if (userData.avatarUrl) user.avatarUrl = userData.avatarUrl;
    if (userData.currentClassId) user.currentClassId = userData.currentClassId;

    await userRepository.save(user);

    // Handle new class relation
    if (newClassRelation) {
      const { classId, role, alias } = newClassRelation;
      
      // Check if already in class
      let relation = await userClassRelationRepository.findOne({
        where: {
          userId: user.id,
          classId: classId
        }
      });

      if (relation) {
        // Update existing
        relation.role = role;
        if (alias) relation.alias = alias;
        await userClassRelationRepository.save(relation);
      } else {
        // Add new
        relation = userClassRelationRepository.create({
          userId: user.id,
          classId: classId,
          role: role as Role,
          alias: alias
        });
        await userClassRelationRepository.save(relation);
      }
      
      // If this is the first class (or specifically set), set as current
      // Logic for setting currentClassId if not present could be here
      // But we already updated user above, let's re-check if currentClassId is missing
      if (!user.currentClassId) {
        user.currentClassId = classId;
        await userRepository.save(user);
      }
    }
    
    // Reload user with relations to return complete data
    const updatedUser = await userRepository.findOne({
      where: { id: user.id },
      relations: ['classes', 'classes.class']
    });

    return res.json({ code: 0, data: updatedUser });

  } catch (error) {
    console.error('updateProfile error:', error);
    return res.status(500).json({ code: 500, message: 'Internal Server Error' });
  }
};
