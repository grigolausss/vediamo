const jwt = require('jsonwebtoken');
const Employee = require('../models/employeeModel');

const protectEmployee = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if it's an employee token
      if (decoded.type !== 'employee') {
        res.status(401);
        throw new Error('Not authorized for this role');
      }

      // Get employee from the token
      req.employee = await Employee.findById(decoded.id).select('-password -otp -otpExpires -resetPasswordToken -resetPasswordExpire');

      if (!req.employee) {
        res.status(401);
        throw new Error('Not authorized, employee not found');
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      return res.json({ message: 'Non autorizzato, token non valido o scaduto.' });
    }
  }

  if (!token) {
    res.status(401);
    return res.json({ message: 'Non autorizzato, nessun token fornito.' });
  }
};

const admin = (req, res, next) => {
    if (req.employee && req.employee.role === 'Admin') {
        next();
    } else {
        res.status(403);
        // Using a simple json response for now
        return res.json({ message: 'Non autorizzato come admin.' });
    }
};

module.exports = { protectEmployee, admin };
