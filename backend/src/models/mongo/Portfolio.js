const mongoose = require('mongoose');

const PortfolioSchema = new mongoose.Schema({
  student_id: { type: Number, required: true, index: true },
  resumes: { type: [Object], default: [] },
  projects: { type: [Object], default: [] },
  achievements: { type: [Object], default: [] },
}, { timestamps: true });

const Portfolio = mongoose.model('Portfolio', PortfolioSchema, 'portfolios');

module.exports = { Portfolio };
