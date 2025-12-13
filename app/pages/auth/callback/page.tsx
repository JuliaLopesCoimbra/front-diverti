'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';

export default function AuthCallbackPage() {
  const params = useSearchParams();
  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    const access = params.get('access_token');
    const refresh = params.get('refresh_token');

    if (!access || !refresh) {
      router.push('/');
      return;
    }

    login(access, refresh);

 
    router.push('/pages/user/home');
  }, [params, login, router]);

  return <p>Finalizando login...</p>;
}
