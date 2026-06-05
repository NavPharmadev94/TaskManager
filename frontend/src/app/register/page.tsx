"use client";

import { useRouter } from "next/navigation";
import { register } from "@/lib/api";
import { AuthForm } from "@/components/AuthForm";

export default function RegisterPage() {
  const router = useRouter();

  async function handleRegister(email: string, password: string) {
    await register(email, password);
    router.push("/login");
  }

  return (
    <AuthForm
      heading="Create account"
      submitLabel="Register"
      onSubmit={handleRegister}
      footerText="Already have an account?"
      footerLinkLabel="Sign in"
      footerLinkHref="/login"
    />
  );
}
