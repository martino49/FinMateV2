const express = require('express');
const router = express.Router();
const incomeController = require('../controllers/incomeController');
const { authenticate } = require('../middlewares/authMiddleware');

router.get('/', authenticate, incomeController.getIncomes);
router.get('/stats/summary', authenticate, incomeController.getIncomeSummary);
router.get('/:id', authenticate, incomeController.getIncomeById);
router.post('/', authenticate, incomeController.createIncome);
router.put('/:id', authenticate, incomeController.updateIncome);
router.delete('/:id', authenticate, incomeController.deleteIncome);

module.exports = router;