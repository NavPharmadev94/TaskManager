"use client";

import { useRouter } from "next/navigation";
import { login } from "@/lib/api";
import { AuthForm } from "@/components/AuthForm";

export default function LoginPage() {
  const router = useRouter();

  async function handleLogin(email: string, password: string) {
    await login(email, password);
    router.push("/dashboard");
  }

  return (
    <AuthForm
      heading="Welcome back"
      subheading="Sign in to manage your tasks"
      submitLabel="Sign in"
      onSubmit={handleLogin}
      footerText="Don't have an account?"
      footerLinkLabel="Create one"
      footerLinkHref="/register"
    />
  );
}
