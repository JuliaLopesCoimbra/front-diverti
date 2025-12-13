'use client';

import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { jwtDecode } from 'jwt-decode'; // Correção na importação
import { JwtPayload } from '@/app/types/types';

const ProtectedPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const accessToken = localStorage.getItem('access_token');
    
    if (!accessToken) {
      router.push('/');
      return;
    }

    try {
      const decoded: JwtPayload = jwtDecode(accessToken); // Agora o tipo está correto
      const isExpired = decoded.exp * 1000 < Date.now(); // Verifica se o token expirou

      if (isExpired) {
        router.push('/');
      }
    } catch (err) {
      console.error('Erro ao decodificar o token:', err); // Logando o erro para depuração
      router.push('/');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null; // ou um carregando
  }

  return <div>Conteúdo protegido</div>;
};

export default ProtectedPage;
