const crypto = require('crypto');
const Employee = require('../models/employeeModel');
const sendEmail = require('../utils/sendEmail');
const jwt = require('jsonwebtoken');
const logActivity = require('../utils/logger');

const generateEmployeeToken = (id) => {
  return jwt.sign({ id, type: 'employee' }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

const loginEmployee = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Per favore, fornisci email e password.' });
    }
    try {
        const employee = await Employee.findOne({ email });
        if (employee && (await employee.matchPassword(password))) {
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            employee.otp = otp;
            employee.otpExpires = new Date(new Date().getTime() + 10 * 60 * 1000);
            await employee.save();
            await sendEmail({
                email: employee.email,
                subject: 'Codice di Accesso Area Riservata - Arte di Abitare',
                message: `Il tuo codice OTP per l'accesso all'area riservata è: ${otp}`,
            });
            res.status(200).json({ message: `Accesso autorizzato. Ti abbiamo inviato un codice OTP via email.` });
        } else {
            res.status(401).json({ message: 'Email o password non valide.' });
        }
    } catch (error) {
        console.error('Employee login error:', error);
        res.status(500).json({ message: 'Errore del server.' });
    }
};

const verifyEmployeeOtp = async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
        return res.status(400).json({ message: 'Per favore, fornisci email e OTP.' });
    }
    try {
        const employee = await Employee.findOne({ email });
        if (!employee || !employee.otp || employee.otp !== otp || employee.otpExpires < new Date()) {
            return res.status(400).json({ message: 'OTP non valido o scaduto.' });
        }
        employee.otp = undefined;
        employee.otpExpires = undefined;
        await employee.save();
        logActivity(employee._id, 'EMPLOYEE_LOGIN', `L'impiegato ${employee.email} ha effettuato il login.`);
        res.status(200).json({
            message: 'Login effettuato con successo.',
            token: generateEmployeeToken(employee._id),
            employee: { _id: employee._id, email: employee.email, role: employee.role },
        });
    } catch (error) {
        console.error('Employee OTP verification error:', error);
        res.status(500).json({ message: 'Errore del server.' });
    }
};

const forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const employee = await Employee.findOne({ email });
        if (!employee) {
            return res.status(200).json({ message: 'Se l\'email è registrata, riceverai un link per il reset.' });
        }
        const resetToken = employee.getResetPasswordToken();
        await employee.save({ validateBeforeSave: false });
        const resetUrl = `${req.protocol}://${req.get('host')}/employee/reset-password/${resetToken}`;
        const message = `Hai richiesto un reset della password. Clicca su questo link: \n\n ${resetUrl}`;
        await sendEmail({
            email: employee.email,
            subject: 'Reset della Password - Arte di Abitare',
            message,
        });
        res.status(200).json({ message: 'Email per il reset della password inviata.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Errore del server.' });
    }
};

const resetPassword = async (req, res) => {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.resettoken).digest('hex');
    try {
        const employee = await Employee.findOne({ resetPasswordToken, resetPasswordExpire: { $gt: Date.now() } });
        if (!employee) {
            return res.status(400).json({ message: 'Token non valido o scaduto.' });
        }
        employee.password = req.body.password;
        employee.resetPasswordToken = undefined;
        employee.resetPasswordExpire = undefined;
        await employee.save();
        res.status(200).json({ message: 'Password resettata con successo.' });
    } catch (error) {
        res.status(500).json({ message: 'Errore del server.' });
    }
};

const createEmployee = async (req, res) => {
    const { email, password, role } = req.body;
    try {
        const employeeExists = await Employee.findOne({ email });
        if (employeeExists) {
            return res.status(400).json({ message: 'Un dipendente con questa email esiste già.' });
        }
        const employee = await Employee.create({ email, password, role });
        logActivity(req.employee._id, 'CREATE_EMPLOYEE', `Creato nuovo impiegato: ${employee.email}`);
        res.status(201).json({ _id: employee._id, email: employee.email, role: employee.role });
    } catch (error) {
        res.status(400).json({ message: 'Dati non validi.', error: error.message });
    }
};

const getEmployees = async (req, res) => {
    const employees = await Employee.find({}).select('-password');
    res.json(employees);
};

const getEmployeeById = async (req, res) => {
    const employee = await Employee.findById(req.params.id).select('-password');
    if (employee) {
        res.json(employee);
    } else {
        res.status(404).json({ message: 'Dipendente non trovato.' });
    }
};

const updateEmployee = async (req, res) => {
    const employee = await Employee.findById(req.params.id);
    if (employee) {
        employee.email = req.body.email || employee.email;
        employee.role = req.body.role || employee.role;
        if (req.body.password) {
            employee.password = req.body.password;
        }
        const updatedEmployee = await employee.save();
        logActivity(req.employee._id, 'UPDATE_EMPLOYEE', `Aggiornato impiegato: ${updatedEmployee.email}`);
        res.json({ _id: updatedEmployee._id, email: updatedEmployee.email, role: updatedEmployee.role });
    } else {
        res.status(404).json({ message: 'Dipendente non trovato.' });
    }
};

const deleteEmployee = async (req, res) => {
    const employee = await Employee.findById(req.params.id);
    if (employee) {
        if (req.employee._id.equals(employee._id)) {
            return res.status(400).json({ message: 'Non puoi eliminare il tuo account admin.' });
        }
        await employee.deleteOne();
        logActivity(req.employee._id, 'DELETE_EMPLOYEE', `Rimosso impiegato: ${employee.email}`);
        res.json({ message: 'Dipendente rimosso.' });
    } else {
        res.status(404).json({ message: 'Dipendente non trovato.' });
    }
};

const updateMyPassword = async (req, res) => {
    const employee = await Employee.findById(req.employee._id);
    if (employee) {
        if (req.body.password) {
            employee.password = req.body.password;
            await employee.save();
            res.json({ message: 'Password aggiornata con successo.' });
        } else {
            res.status(400).json({ message: 'Per favore, fornisci una nuova password.' });
        }
    } else {
        res.status(404).json({ message: 'Dipendente non trovato.' });
    }
};

module.exports = {
    loginEmployee, verifyEmployeeOtp, forgotPassword, resetPassword, createEmployee,
    getEmployees, getEmployeeById, updateEmployee, deleteEmployee, updateMyPassword,
};
