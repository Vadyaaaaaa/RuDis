// Тестовый скрипт для проверки отправки email
const { sendVerificationCode } = require('./server/services/emailService');

async function testEmail() {
  console.log('Тестирование отправки email...');
  console.log('Отправка тестового кода на support.rudis@ro.ru');
  
  const result = await sendVerificationCode('support.rudis@ro.ru', '123456');
  
  if (result.success) {
    console.log('✓ Email успешно отправлен!');
    console.log('Message ID:', result.messageId);
  } else {
    console.log('✗ Ошибка отправки email:');
    console.log('Error:', result.error);
  }
}

testEmail().catch(console.error);

