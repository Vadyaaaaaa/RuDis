import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Кэш для Ethereal аккаунта
let etherealAccount = null;

// Создание транспортера для отправки email
const createTransporter = async () => {
  // Если указаны настройки SMTP в .env, используем их
  const isSmtpConfigured = 
    process.env.SMTP_HOST && 
    process.env.SMTP_USER && 
    process.env.SMTP_PASS &&
    process.env.SMTP_USER !== 'your-email@gmail.com' &&
    process.env.SMTP_PASS !== 'your-app-password-here';

  if (isSmtpConfigured) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Если SMTP не настроен, используем Ethereal Email (автоматический тестовый аккаунт)
  if (!etherealAccount) {
    try {
      etherealAccount = await nodemailer.createTestAccount();
      console.log('\n✅ Ethereal Email аккаунт создан автоматически!');
      console.log('📧 Письма будут отправляться через Ethereal Email');
      console.log('   Вы сможете просмотреть их по ссылке, которая появится в консоли\n');
    } catch (error) {
      console.error('❌ Ошибка создания Ethereal аккаунта:', error);
      return null;
    }
  }

  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: etherealAccount.user,
      pass: etherealAccount.pass,
    },
  });
};

export const sendVerificationCode = async (email, code) => {
  try {
    const transporter = await createTransporter();
    
    if (!transporter) {
      // Если не удалось создать транспортер, выводим код в консоль
      console.log('\n═══════════════════════════════════════════════════════');
      console.log('📧 КОД ПОДТВЕРЖДЕНИЯ (РЕЖИМ РАЗРАБОТКИ)');
      console.log('═══════════════════════════════════════════════════════');
      console.log(`Email: ${email}`);
      console.log(`Код: ${code}`);
      console.log('═══════════════════════════════════════════════════════\n');
      return { success: true, messageId: 'dev-mode', devMode: true };
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@ruscord.com',
      to: email,
      subject: 'Код подтверждения Ruscord',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #5865F2;">Подтверждение регистрации в Ruscord</h2>
          <p>Ваш код подтверждения:</p>
          <div style="background-color: #5865F2; color: white; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; border-radius: 8px; margin: 20px 0;">
            ${code}
          </div>
          <p style="color: #666;">Этот код действителен в течение 10 минут.</p>
          <p style="color: #666; font-size: 12px;">Если вы не запрашивали этот код, просто проигнорируйте это письмо.</p>
        </div>
      `,
      text: `Ваш код подтверждения Ruscord: ${code}\n\nЭтот код действителен в течение 10 минут.`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email отправлен:', info.messageId);
    
    // Если используется Ethereal Email, выводим ссылку для просмотра письма
    if (info.messageId && nodemailer.getTestMessageUrl) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log('\n📧 Просмотр письма:');
        console.log('   ' + previewUrl);
        console.log('   (Откройте эту ссылку в браузере, чтобы увидеть письмо)\n');
      }
    }

    return { success: true, messageId: info.messageId, previewUrl: nodemailer.getTestMessageUrl?.(info) };
  } catch (error) {
    console.error('❌ Ошибка отправки email:', error);
    throw new Error('Не удалось отправить код подтверждения');
  }
};

