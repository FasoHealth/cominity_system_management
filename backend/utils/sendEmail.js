const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Créer un transporteur
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // Définir les options de l'email
  const mailOptions = {
    from: `CS Alert <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
        <h2 style="color: #f97316; text-align: center;">Vérification de votre compte CS Alert</h2>
        <p>Bonjour,</p>
        <p>Merci de vous être inscrit sur <strong>Community Security Alert</strong>. Pour finaliser la création de votre compte, veuillez utiliser le code de vérification suivant :</p>
        <div style="background-color: #fff7ed; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #f97316;">${options.code}</span>
        </div>
        <p>Ce code est valable pendant 30 minutes.</p>
        <p>Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.</p>
        <hr style="border: none; border-top: 1px solid #eeeeee; margin: 20px 0;">
        <p style="font-size: 12px; color: #777777; text-align: center;">© 2024 Community Security Alert - Groupe 16</p>
      </div>
    `,
  };

  // Envoyer l'email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
