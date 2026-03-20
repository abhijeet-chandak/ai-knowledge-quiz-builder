const express = require('express');
const authController = require('../controllers/authController');
const quizController = require('../controllers/quizController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

const authRouter = express.Router();
authRouter.post('/register', authController.register);
authRouter.post('/login', authController.login);
authRouter.get('/me', requireAuth, authController.me);
router.use('/auth', authRouter);

const quizRouter = express.Router();
quizRouter.use(requireAuth);
quizRouter.post('/', quizController.create);
quizRouter.get('/', quizController.list);
quizRouter.get('/:quizId/questions', quizController.getQuestions);
quizRouter.post('/:quizId/submissions', quizController.submit);
quizRouter.get('/:quizId', quizController.getById);
router.use('/quizzes', quizRouter);

module.exports = router;
