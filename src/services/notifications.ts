import { supabase } from "./auth";

export async function sendEmail(to: string, subject: string, body: string) {
  const { data, error } = await supabase.functions.invoke("send-email", {
    body: { to, subject, body },
  });

  if (error) {
    throw new Error("Error enviando email: " + error.message);
  }

  return data;
}