import nodemailer from 'nodemailer';
import config from '../../config/index.js';
import { draftConfirmation, draftPreview } from './emailTemplates.js';

let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  const { host, port, user, pass } = config.email.smtp;

  if (host) {
    _transporter = nodemailer.createTransport({
      host,
      port: port || 587,
      secure: port === 465,
      auth: user ? { user, pass } : undefined,
    });
  } else {
    _transporter = nodemailer.createTransport({ jsonTransport: true });
  }

  return _transporter;
}

export function setTransporter(transport) {
  _transporter = transport;
}

function buildEmail(templateFn, data) {
  return templateFn(data);
}

async function send(to, email) {
  const transporter = getTransporter();
  const from = config.email.fromAddress || 'rehearsify@example.com';

  try {
    const result = await transporter.sendMail({
      from,
      to,
      subject: email.subject,
      text: email.text,
      html: email.html,
    });

    console.log(`[mailer] Sent "${email.subject}" to ${to} (messageId: ${result.messageId || 'json-transport'})`);
    return result;
  } catch (err) {
    console.error(`[mailer] Failed to send "${email.subject}" to ${to}:`, err.message);
    throw err;
  }
}

export async function sendDraftConfirmation(to, data) {
  const email = buildEmail(draftConfirmation, data);
  return send(to, email);
}

export async function sendDraftPreview(to, data) {
  const email = buildEmail(draftPreview, data);
  return send(to, email);
}

export { draftConfirmation, draftPreview };
