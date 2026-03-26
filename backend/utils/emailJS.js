const emailjs = require('@emailjs/nodejs');

const sendVerificationEmail = async (options) => {
  try {
    const templateParams = {
      app_name: 'Community Security Alert',
      to_name: options.name,
      to_email: options.email,
      verification_link: options.verification_link,
      email: options.email,
    };

    console.log('📤 Envoi EmailJS avec params:', JSON.stringify(templateParams, null, 2));
    console.log('🔑 ServiceID:', process.env.EMAILJS_SERVICE_ID);
    console.log('🔑 TemplateID:', process.env.EMAILJS_TEMPLATE_ID);

    const result = await emailjs.send(
      process.env.EMAILJS_SERVICE_ID,
      process.env.EMAILJS_TEMPLATE_ID,
      templateParams,
      {
        publicKey: process.env.EMAILJS_PUBLIC_KEY,
      }
    );

    console.log('📬 Résultat EmailJS:', result.status, result.text);
    return result;
  } catch (error) {
    console.error('💥 Erreur EmailJS détaillée:', error);
    if (error.text) console.error('💥 Erreur texte EmailJS:', error.text);
    throw error;
  }
};

module.exports = sendVerificationEmail;
