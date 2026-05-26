import express from 'express';
import {
    register,
    login,
    me,
    updateProfile,
} from '../controllers/authController.js';
import { project } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', project, me);
router.put('/me', project, updateProfile);
router.put('/profile', project, updateProfile);

export default router;
