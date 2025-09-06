const User = require('../models/userModel');
const { sendEmail, generateOtpEmailHtml } = require('../utils/sendEmail');
const jwt = require('jsonwebtoken');

// Function to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '1d', // Token expires in 1 day
  });
};

// @desc    Request an OTP for a user
// @route   POST /api/users/request-otp
// @access  Public
const requestOtp = async (req, res) => {
  const { name, surname, email } = req.body;

  if (!name || !surname || !email) {
    res.status(400);
    return res.json({ message: 'Per favore, fornisci nome, cognome ed email.' });
  }

  try {
    let user = await User.findOne({ email });

    if (user) {
      user.name = name;
      user.surname = surname;
    } else {
      user = new User({
        name,
        surname,
        email,
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(new Date().getTime() + 10 * 60 * 1000); // 10 minutes

    user.otp = otp;
    user.otpExpires = otpExpires;
    user.isVerified = false;

    await user.save();

    try {
      // Generate both HTML and plain text content for the email
      const htmlContent = generateOtpEmailHtml(user.name, otp);
      const textContent = `Il tuo codice OTP è: ${otp}. Questo codice scadrà tra 10 minuti.`;

      await sendEmail({
        email: user.email,
        subject: 'Il tuo codice di verifica - Arte di Abitare',
        message: textContent, // Fallback for plain text clients
        htmlContent: htmlContent,
      });

      res.status(200).json({
        message: `OTP inviato a ${email}. Scadrà tra 10 minuti.`,
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      res.status(200).json({
        message: `OTP generato per ${email}, ma c'è stato un problema con l'invio dell'email. Per favore, riprova più tardi.`,
      });
    }
  } catch (dbError) {
    console.error('DB error:', dbError);
    res.status(500).json({ message: 'Errore del server.', error: dbError.message });
  }
};

// @desc    Verify an OTP for a user
// @route   POST /api/users/verify-otp
// @access  Public
const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    res.status(400);
    return res.json({ message: 'Per favore, fornisci email e OTP.' });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      res.status(404);
      return res.json({ message: 'Utente non trovato.' });
    }

    if (user.otp !== otp || user.otpExpires < new Date()) {
      res.status(400);
      return res.json({ message: 'OTP non valido o scaduto.' });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({
      message: 'Email verificata con successo.',
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Errore del server.', error: error.message });
  }
};

const updateUserPhone = async (req, res) => {
    const { phone } = req.body;
    const userId = req.user._id;

    if (!phone) {
        return res.status(400).json({ message: 'Il numero di telefono è obbligatorio.' });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Utente non trovato.' });
        }

        user.phone = phone;
        await user.save();

        res.status(200).json({ message: 'Numero di telefono aggiornato con successo.' });

    } catch (error) {
        console.error('Error updating phone:', error);
        res.status(500).json({ message: 'Errore del server durante l\'aggiornamento.' });
    }
};

module.exports = {
  requestOtp,
  verifyOtp,
  updateUserPhone,
};
