import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

type ContactEmailData = {
  name: string;
  phone: string;
  email?: string;
  message: string;
};

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  private createTransporter() {
    const port = Number(process.env.SMTP_PORT) || 25;
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1',
        maxVersion: 'TLSv1.3',
      },
      connectionTimeout: 300000,
      greetingTimeout: 120000,
      socketTimeout: 300000,
      pool: false,
      maxConnections: 1,
      maxMessages: 1,
      logger: process.env.NODE_ENV === 'development',
      debug: process.env.NODE_ENV === 'development',
    } as nodemailer.TransportOptions);
  }

  async sendEmail(data: ContactEmailData): Promise<nodemailer.SentMessageInfo> {
    const safe = (value?: string) => value?.trim() || '—';

    const mailOptions: nodemailer.SendMailOptions = {
      from: `"Winner Website" <${process.env.SMTP_USER}>`,
      to: process.env.CONTACT_EMAIL,
      replyTo: data.email || undefined,
      subject: 'Winner – Новое сообщение с сайта',
      html: `
        <h2>📩 Новое сообщение с сайта Winner</h2>
        <p><strong>ФИО:</strong> ${safe(data.name)}</p>
        <p><strong>Email:</strong> ${safe(data.email)}</p>
        <p><strong>Телефон:</strong> ${safe(data.phone)}</p>
        <p><strong>Сообщение:</strong></p>
        <div style="background:#f4f6f8;padding:15px;border-left:4px solid #e8b923;">
          ${safe(data.message)}
        </div>
        <hr />
        <small>Время отправки: ${new Date().toLocaleString('ru-RU')}</small>
      `,
    };

    let lastError: unknown;
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const transporter = this.createTransporter();

      try {
        const info = await transporter.sendMail(mailOptions);

        this.logger.log(
          `Contact email muvaffaqiyatli yuborildi | to=${process.env.CONTACT_EMAIL} | messageId=${info.messageId ?? '—'} | name=${safe(data.name)} | phone=${safe(data.phone)} | replyTo=${safe(data.email)}`,
        );

        transporter.close();
        return info;
      } catch (error) {
        lastError = error;

        if (attempt < maxAttempts) {
          this.logger.warn(
            `Contact email urinish ${attempt}/${maxAttempts} muvaffaqiyatsiz, qayta uriniladi...`,
          );
          await new Promise((resolve) => setTimeout(resolve, attempt * 5000));
        } else {
          this.logger.error(
            `Contact email yuborilmadi | to=${process.env.CONTACT_EMAIL} | name=${safe(data.name)} | phone=${safe(data.phone)}`,
            error instanceof Error ? error.stack : String(error),
          );
          throw lastError ?? new Error('Email yuborilmadi');
        }
      } finally {
        try {
          transporter.close();
        } catch {}
      }
    }

    throw lastError ?? new Error('Email yuborilmadi');
  }

  async sendEmailAsync(data: ContactEmailData) {
    try {
      await this.sendEmail(data);
    } catch {
      // Xato sendEmail ichida log qilingan
    }
  }
}
