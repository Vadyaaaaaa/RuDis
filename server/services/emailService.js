const nodemailer = require('nodemailer');

// Настройка SMTP для ro.ru (Rambler)
// Для ro.ru может потребоваться полный email в качестве логина
const transporter = nodemailer.createTransport({
  host: 'smtp.rambler.ru',
  port: 465,
  secure: true, // SSL
  auth: {
    user: 'support.rudis@ro.ru', // Полный email
    pass: 'Rudis2025'
  },
  tls: {
    rejectUnauthorized: false
  },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 15000,
  // Дополнительные опции для Rambler
  pool: false,
  maxConnections: 1,
  maxMessages: 1
});

// Функция для отправки кода подтверждения
async function sendVerificationCode(email, code) {
  const mailOptions = {
    from: 'support.rudis@ro.ru',
    to: email,
    subject: 'Код подтверждения регистрации в RuDis',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #36393f; color: #dcddde;">
        <div style="background-color: #5865f2; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: #ffffff; margin: 0;">RuDis</h1>
        </div>
        <div style="background-color: #2f3136; padding: 30px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #ffffff; margin-top: 0;">Подтверждение регистрации</h2>
          <p style="color: #dcddde; font-size: 16px;">Спасибо за регистрацию в RuDis!</p>
          <p style="color: #dcddde; font-size: 16px;">Ваш код подтверждения:</p>
          <div style="background-color: #202225; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <h1 style="color: #5865f2; font-size: 48px; margin: 0; letter-spacing: 8px;">${code}</h1>
          </div>
          <p style="color: #b9bbbe; font-size: 14px;">Введите этот код на странице регистрации для завершения процесса.</p>
          <p style="color: #b9bbbe; font-size: 14px;">Код действителен в течение 10 минут.</p>
          <hr style="border: none; border-top: 1px solid #40444b; margin: 30px 0;">
          <p style="color: #72767d; font-size: 12px; text-align: center; margin: 0;">Если вы не регистрировались в RuDis, просто проигнорируйте это письмо.</p>
        </div>
      </div>
    `,
    text: `Ваш код подтверждения для регистрации в RuDis: ${code}. Код действителен 10 минут.`
  };

  try {
    // Пробуем отправить без предварительной проверки соединения
    // (некоторые SMTP серверы не поддерживают verify)
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to', email);
    console.log('Message ID:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email to', email);
    console.error('Error code:', error.code);
    console.error('Error command:', error.command);
    console.error('Error response:', error.response);
    console.error('Full error:', error.message);
    
    // Если ошибка связана с соединением, пробуем альтернативные настройки
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'EAUTH') {
      console.log('Trying alternative SMTP configuration...');
      
      // Пробуем порт 587 с STARTTLS
      const altTransporter = nodemailer.createTransport({
        host: 'smtp.rambler.ru',
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
          user: 'support.rudis@ro.ru',
          pass: 'Rudis2025'
        },
        tls: {
          rejectUnauthorized: false
        },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 15000,
        pool: false,
        maxConnections: 1,
        maxMessages: 1
      });
      
      // Также пробуем smtp.ro.ru
      if (error.code === 'EAUTH') {
        console.log('Trying smtp.ro.ru...');
        const roTransporter = nodemailer.createTransport({
          host: 'smtp.ro.ru',
          port: 465,
          secure: true,
          auth: {
            user: 'support.rudis@ro.ru',
            pass: 'Rudis2025'
          },
          tls: {
            rejectUnauthorized: false
          },
          connectionTimeout: 15000,
          greetingTimeout: 15000,
          socketTimeout: 15000
        });
        
        try {
          const info = await roTransporter.sendMail(mailOptions);
          console.log('Email sent with smtp.ro.ru:', info.messageId);
          return { success: true, messageId: info.messageId };
        } catch (roError) {
          console.error('smtp.ro.ru also failed:', roError.message);
        }
      }

      try {
        const info = await altTransporter.sendMail(mailOptions);
        console.log('Email sent with alternative config:', info.messageId);
        return { success: true, messageId: info.messageId };
      } catch (altError) {
        console.error('Alternative config also failed:', altError.message);
        return { success: false, error: 'Не удалось отправить email. Проверьте настройки SMTP.' };
      }
    }
    
    return { success: false, error: error.message || 'Не удалось отправить email' };
  }
}

module.exports = {
  sendVerificationCode
};

