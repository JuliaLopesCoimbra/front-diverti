// /app/pages/home.tsx
'use client';

import { useAuth } from '@/app/context/AuthContext';  // Importando o contexto de autenticação
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';  // Adicionando o useState para controle de carregamento
import { jwtDecode } from 'jwt-decode';  // Corrigindo a importação
import { JwtPayload } from '@/app/types/types';  // Importando o tipo JwtPayload
import HomeHeader from '@/app/components/home/HeaderHome';
import HomeTabs from "@/app/components/home/HomeTabs";

const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();  // Verificando o estado de autenticação
  const router = useRouter();  // Usando o hook do Next.js para redirecionar
  const [loading, setLoading] = useState(true);  // Controle de carregamento
  const [activeTab, setActiveTab] = useState<
    "home" | "eventos" | "foto" | "enredo"
  >("home");
  useEffect(() => {
  const accessToken = localStorage.getItem('access_token');  // Obtendo o token de acesso do localStorage

  if (!accessToken) {
    router.push('/');  // Corrigindo o caminho de redirecionamento
    return;
  }

  const checkToken = async () => {
    try {
      const decoded = jwtDecode<JwtPayload>(accessToken);
      const isExpired = decoded.exp * 1000 < Date.now();

      if (isExpired) {
        router.push('/');  // Se o token expirou, redireciona para login
      } else {
        setLoading(false);  // Se o token for válido, desativa o carregamento
      }
    } catch (err) {
      console.error('Erro ao verificar token:', err);  // Logando o erro
      router.push('/');  // Se houver erro na decodificação do token, redireciona para login
    }
  };
  checkToken();
}, [isAuthenticated, router]);


  // Enquanto o usuário não for autenticado ou a verificação de token estiver em andamento, exibe um carregando
  if (loading) {
    return <div>Carregando...</div>;  // Pode colocar um componente de loading mais sofisticado aqui
  }

  // Renderiza o conteúdo da página após a verificação de autenticação
  return (
    <>
      <HomeHeader />
      <HomeTabs active={activeTab} onChange={setActiveTab} />

      {activeTab === "home" && <div>Feed de notícias</div>}
      {activeTab === "eventos" && <div>Lista de eventos</div>}
      {activeTab === "foto" && <div>Foto IA</div>}
      {activeTab === "enredo" && <div>Enredo</div>}
    </>
  );
};

export default Home;
