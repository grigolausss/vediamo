const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const Employee = require('./models/employeeModel');

dotenv.config();

const createAdminUser = async () => {
    try {
        await connectDB();

        const email = 'grigolocri004@gmail.com';
        const password = '1234ok';
        const role = 'admin'; // Assuming 'admin' is a valid role

        const employeeExists = await Employee.findOne({ email });

        if (employeeExists) {
            console.log('Utente dipendente già esistente.');
            process.exit();
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const employee = new Employee({
            email,
            password: hashedPassword,
            role,
        });

        await employee.save();
        console.log('Utente dipendente creato con successo!');
        process.exit();

    } catch (error) {
        console.error(`Errore durante la creazione dell'utente: ${error.message}`);
        process.exit(1);
    }
};

createAdminUser();
