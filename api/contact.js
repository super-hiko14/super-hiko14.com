import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // CORSヘッダーの設定
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // OPTIONSメソッドの処理
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // POSTメソッド以外を拒否
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { email, name, message, recaptchaToken } = req.body;

  // reCAPTCHA v3 検証
  if (!recaptchaToken) {
    return res.status(400).json({ message: 'reCAPTCHA トークンがありません' });
  }
  try {
    const verifyRes = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`,
      { method: 'POST' }
    );
    const verifyData = await verifyRes.json();
    if (!verifyData.success || verifyData.score < 0.5) {
      return res.status(403).json({ message: 'Bot判定されました。しばらく時間をおいてお試しください。' });
    }
  } catch (err) {
    return res.status(500).json({ message: 'reCAPTCHA の検証に失敗しました' });
  }

  // バリデーション
  if (!email || !name || !message) {
    return res.status(400).json({ message: '必須フィールドが不足しています' });
  }

  // メールアドレスの形式チェック
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'メールアドレスが無効です' });
  }

  // メッセージの長さチェック
  if (message.length > 5000) {
    return res.status(400).json({ message: 'メッセージが長すぎます（5000文字制限）' });
  }

  try {
    // メーラーの設定
    // Gmail App Password または 他のSMTP情報をを環境変数から取得
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // 管理者へのメール
    const mailOptionsToAdmin = {
      from: `"Super Hiko14 Contact Form" <${process.env.EMAIL_USER}>`,
      to: 'kokyujene.contact@gmail.com',
      subject: `新しいお問い合わせ: ${name}`,
      html: `
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { border-bottom: 2px solid #6ddbb0; padding-bottom: 20px; }
              .header h1 { margin: 0; color: #6ddbb0; font-size: 24px; }
              .info { background: #f9f9f9; padding: 15px; border-left: 4px solid #6ddbb0; margin: 20px 0; }
              .info-item { margin: 10px 0; }
              .info-label { font-weight: bold; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>新しいお問い合わせが届きました</h1>
              </div>
              <div class="info">
                <div class="info-item">
                  <span class="info-label">送信者名：</span> ${escapeHtml(name)}
                </div>
                <div class="info-item">
                  <span class="info-label">メールアドレス：</span> ${escapeHtml(email)}
                </div>
                <div class="info-item">
                  <span class="info-label">送信日時：</span> ${new Date().toLocaleString('ja-JP')}
                </div>
              </div>
              <div style="margin: 20px 0;">
                <h3>お問い合わせ内容：</h3>
                <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; white-space: pre-wrap;">
                  ${escapeHtml(message)}
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    // メール送信（管理者宛のみ）
    await transporter.sendMail(mailOptionsToAdmin);

    res.status(200).json({ message: 'メールを送信しました' });
  } catch (error) {
    console.error('Email send error:', error);
    res.status(500).json({ 
      message: 'メール送信に失敗しました。時間をおいてお試しください。',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * HTMLエスケープ関数
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, char => map[char]);
}
