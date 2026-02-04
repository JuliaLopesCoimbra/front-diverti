"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Redireciona para a rota raiz onde o login agora está
export default function LoginPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace("/");
  }, [router]);
  
  return null;
}
