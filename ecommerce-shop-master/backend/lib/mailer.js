import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const isConfigured = () =>
	Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const transporter = isConfigured()
	? nodemailer.createTransport({
			host: process.env.SMTP_HOST,
			port: Number(process.env.SMTP_PORT) || 587,
			secure: Number(process.env.SMTP_PORT) === 465,
			auth: {
				user: process.env.SMTP_USER,
				pass: process.env.SMTP_PASS,
			},
	  })
	: null;

export const sendEmail = async ({ to, subject, text, html }) => {
	if (!transporter) {
		// No SMTP configured — log the message so flows remain testable in dev.
		console.log(`[mailer:dev-fallback] To: ${to} | Subject: ${subject}\n${text}`);
		return { devFallback: true };
	}

	await transporter.sendMail({
		from: process.env.EMAIL_FROM || process.env.SMTP_USER,
		to,
		subject,
		text,
		html,
	});
	return { delivered: true };
};

export { isConfigured };