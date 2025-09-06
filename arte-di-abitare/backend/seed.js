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
        // FIX: The role must match the enum in the schema ('Admin' or 'Agent')
        const role = 'Admin';

        const employeeExists = await Employee.findOne({ email });

        if (employeeExists) {
            console.log('Utente dipendente già esistente.');
            process.exit();
        }

        // The pre-save hook in the model will handle hashing, so we can pass the plain password.
        // This is a better approach as it respects the model's logic.
        const employee = new Employee({
            email,
            password, // Pass plain password, the model will hash it
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
