import { Resend } from "resend";

export const FROM = process.env.RESEND_FROM || "CLeo's Pot <onboarding@resend.dev>";

export function getResend() {
  return new Resend(process.env.RESEND_API_KEY || "");
}