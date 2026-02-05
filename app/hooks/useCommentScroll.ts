"use client";

import { useEffect, useRef } from "react";
import { CommentResponse, listReplies } from "@/app/services/comments/commentService";
import { NewsDetailsResponse } from "@/app/services/news/newsService";

interface UseCommentScrollProps {
  news: NewsDetailsResponse | null;
  loading: boolean;
  newsId: number;
  expandedComments: Set<number>;
  replies: Record<number, CommentResponse[]>;
  setExpandedComments: React.Dispatch<React.SetStateAction<Set<number>>>;
  setReplies: React.Dispatch<React.SetStateAction<Record<number, CommentResponse[]>>>;
  setLoadingReplies: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
  setRepliesOffset: React.Dispatch<React.SetStateAction<Record<number, number>>>;
  setHasMoreReplies: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
  REPLIES_PER_PAGE: number;
  commentIdFromUrl: string | null;
}

export function useCommentScroll({
  news,
  loading,
  newsId,
  expandedComments,
  replies,
  setExpandedComments,
  setReplies,
  setLoadingReplies,
  setRepliesOffset,
  setHasMoreReplies,
  REPLIES_PER_PAGE,
  commentIdFromUrl,
}: UseCommentScrollProps) {
  const scrollExecutedRef = useRef<number | null>(null);

  useEffect(() => {
    if (!news || loading) {
      return;
    }
    
    const getCommentIdFromUrl = (): number | null => {
      if (typeof window === 'undefined') return null;
      const urlParams = new URLSearchParams(window.location.search);
      const commentIdParam = urlParams.get("commentId");
      return commentIdParam ? parseInt(commentIdParam, 10) : null;
    };
    
    const targetCommentId = getCommentIdFromUrl();
    
    if (!targetCommentId) {
      if (scrollExecutedRef.current !== null) {
        scrollExecutedRef.current = null;
      }
      return;
    }
    
    if (scrollExecutedRef.current === targetCommentId) {
      return;
    }
    
    scrollExecutedRef.current = targetCommentId;
    
    if (targetCommentId && news && !loading) {
      const highlightAndScroll = (element: HTMLElement) => {
        let scrollContainer: HTMLElement | null = document.getElementById("news-content-scroll-container");
        
        if (!scrollContainer) {
          scrollContainer = element.parentElement;
          while (scrollContainer && scrollContainer !== document.body) {
            const style = window.getComputedStyle(scrollContainer);
            if (style.overflowY === "auto" || style.overflowY === "scroll" || style.maxHeight) {
              break;
            }
            scrollContainer = scrollContainer.parentElement;
          }
        }
        
        if (!scrollContainer || scrollContainer === document.body) {
          scrollContainer = null;
        }
        
        if (scrollContainer) {
          const containerRect = scrollContainer.getBoundingClientRect();
          const elementRect = element.getBoundingClientRect();
          const scrollTop = scrollContainer.scrollTop;
          const relativeTop = elementRect.top - containerRect.top;
          const targetScroll = scrollTop + relativeTop - 100;
          
          const finalScroll = Math.max(0, Math.min(targetScroll, scrollContainer.scrollHeight - containerRect.height));
          
          if (scrollContainer.scrollHeight <= containerRect.height) {
            element.scrollIntoView({ 
              behavior: "smooth", 
              block: "center",
              inline: "nearest"
            });
          } else {
            scrollContainer.scrollTo({
              top: finalScroll,
              behavior: "smooth"
            });
            
            const checkAndRetry = (attempts = 0) => {
              setTimeout(() => {
                const currentScroll = scrollContainer!.scrollTop;
                const diff = Math.abs(currentScroll - finalScroll);
                
                if (diff > 50 && attempts < 3) {
                  scrollContainer!.scrollTop = finalScroll;
                  if (attempts < 2) {
                    checkAndRetry(attempts + 1);
                  }
                } else if (diff > 50) {
                  element.scrollIntoView({ 
                    behavior: "smooth", 
                    block: "center",
                    inline: "nearest"
                  });
                }
              }, attempts === 0 ? 100 : 200);
            };
            
            checkAndRetry();
          }
        } else {
          const container = document.getElementById("news-content-scroll-container");
          if (container) {
            element.scrollIntoView({ 
              behavior: "smooth", 
              block: "center",
              inline: "nearest"
            });
            
            setTimeout(() => {
              const elementRect = element.getBoundingClientRect();
              const containerRect = container.getBoundingClientRect();
              const relativeTop = elementRect.top - containerRect.top;
              const targetScroll = container.scrollTop + relativeTop - 100;
              container.scrollTop = Math.max(0, targetScroll);
            }, 200);
          } else {
            element.scrollIntoView({ 
              behavior: "smooth", 
              block: "center",
              inline: "nearest"
            });
          }
        }
        
        setTimeout(() => {
          element.style.transition = "all 0.3s ease";
          element.style.borderLeft = "3px solid rgba(255, 255, 255, 0.5)";
          element.style.paddingLeft = "12px";
          
          setTimeout(() => {
            element.style.transition = "all 0.5s ease";
            element.style.borderLeft = "none";
            element.style.paddingLeft = "0";
          }, 30000);
        }, 1000);
        
        setTimeout(() => {
          const url = new URL(window.location.href);
          url.searchParams.delete("commentId");
          window.history.replaceState({}, "", url.toString());
          if (scrollExecutedRef.current === targetCommentId) {
            scrollExecutedRef.current = null;
          }
        }, 4500);
      };

      const tryScrollToComment = (attempts = 0) => {
        const commentElement = document.getElementById(`comment-${targetCommentId}`);
        
        if (commentElement) {
          highlightAndScroll(commentElement);
          return;
        }
        
        if (attempts < 15) {
          setTimeout(() => tryScrollToComment(attempts + 1), 300);
        }
      };

      const scrollToComment = async () => {
        const isMainComment = news.comments.some((c: CommentResponse) => c.id === targetCommentId);
        
        if (isMainComment) {
          setTimeout(() => tryScrollToComment(), 800);
        } else {
          // É uma resposta - precisa encontrar o comentário pai e expandir
          let foundParent = false;
          let parentCommentId: number | null = null;
          
          // Primeiro, tenta encontrar o comentário pai que contém essa resposta
          for (const comment of news.comments) {
            if (comment.replies_count > 0) {
              const replyList = replies[comment.id] || [];
              const hasReply = replyList.some(r => r.id === targetCommentId);
              
              if (hasReply) {
                foundParent = true;
                parentCommentId = comment.id;
                // Expande se não estiver expandido
                if (!expandedComments.has(comment.id)) {
                  setExpandedComments(prev => new Set(prev).add(comment.id));
                }
                // Aguarda um pouco mais para garantir que o DOM foi atualizado
                setTimeout(() => tryScrollToComment(), 1200);
                break;
              }
            }
          }
          
          // Se não encontrou nas respostas já carregadas, precisa carregar
          if (!foundParent) {
            for (const comment of news.comments) {
              if (comment.replies_count > 0) {
                // Expande o comentário se não estiver expandido
                if (!expandedComments.has(comment.id)) {
                  setExpandedComments(prev => new Set(prev).add(comment.id));
                }
                
                // Carrega as respostas se ainda não foram carregadas
                if (!replies[comment.id] || replies[comment.id].length === 0) {
                  setLoadingReplies(prev => ({ ...prev, [comment.id]: true }));
                  try {
                    const fetchedReplies = await listReplies(newsId, comment.id, REPLIES_PER_PAGE, 0);
                    setReplies(prev => ({ ...prev, [comment.id]: fetchedReplies }));
                    setRepliesOffset(prev => ({ ...prev, [comment.id]: fetchedReplies.length }));
                    const totalReplies = comment.replies_count || 0;
                    setHasMoreReplies(prev => ({ ...prev, [comment.id]: totalReplies > fetchedReplies.length }));
                    
                    // Verifica se encontrou a resposta após carregar
                    if (fetchedReplies.some(r => r.id === targetCommentId)) {
                      foundParent = true;
                      parentCommentId = comment.id;
                      // Aguarda um pouco mais para garantir que o DOM foi atualizado com as respostas
                      setTimeout(() => tryScrollToComment(), 1500);
                      break;
                    }
                  } catch (error) {
                    console.error("Erro ao carregar respostas", error);
                  } finally {
                    setLoadingReplies(prev => ({ ...prev, [comment.id]: false }));
                  }
                } else {
                  // Respostas já estão carregadas, verifica se a resposta está lá
                  const replyList = replies[comment.id] || [];
                  if (replyList.some(r => r.id === targetCommentId)) {
                    foundParent = true;
                    parentCommentId = comment.id;
                    // Expande se não estiver expandido
                    if (!expandedComments.has(comment.id)) {
                      setExpandedComments(prev => new Set(prev).add(comment.id));
                    }
                    setTimeout(() => tryScrollToComment(), 1200);
                    break;
                  }
                }
              }
            }
          }
          
          // Se não encontrou em nenhum comentário, tenta scroll mesmo assim (pode estar carregando)
          if (!foundParent) {
            setTimeout(() => tryScrollToComment(), 2000);
          }
        }
      };
      
      const timer = setTimeout(() => {
        scrollToComment();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [news, loading, newsId, expandedComments, replies, setExpandedComments, setReplies, setLoadingReplies, setRepliesOffset, setHasMoreReplies, REPLIES_PER_PAGE, commentIdFromUrl]);
  
  // Efeito adicional para tentar scroll quando as respostas são carregadas/expandidas
  useEffect(() => {
    if (!news || loading) return;
    
    const getCommentIdFromUrl = (): number | null => {
      if (typeof window === 'undefined') return null;
      const urlParams = new URLSearchParams(window.location.search);
      const commentIdParam = urlParams.get("commentId");
      return commentIdParam ? parseInt(commentIdParam, 10) : null;
    };
    
    const targetCommentId = getCommentIdFromUrl();
    if (!targetCommentId || scrollExecutedRef.current !== targetCommentId) return;
    
    // Se já executou o scroll mas o elemento ainda não foi encontrado, tenta novamente
    // Isso é útil quando as respostas são carregadas após o primeiro scroll
    const isMainComment = news.comments.some((c: CommentResponse) => c.id === targetCommentId);
    if (!isMainComment) {
      // É uma resposta - verifica se está nas respostas carregadas
      let replyFound = false;
      for (const comment of news.comments) {
        if (replies[comment.id]?.some((r: CommentResponse) => r.id === targetCommentId)) {
          replyFound = true;
          // Verifica se o elemento existe no DOM
          const element = document.getElementById(`comment-${targetCommentId}`);
          if (!element && expandedComments.has(comment.id)) {
            // Elemento não encontrado mas comentário está expandido - tenta novamente
            setTimeout(() => {
              const retryElement = document.getElementById(`comment-${targetCommentId}`);
              if (retryElement) {
                // Faz scroll e destaque
                const highlightAndScroll = (el: HTMLElement) => {
                  let scrollContainer: HTMLElement | null = document.getElementById("news-content-scroll-container");
                  
                  if (!scrollContainer) {
                    scrollContainer = el.parentElement;
                    while (scrollContainer && scrollContainer !== document.body) {
                      const style = window.getComputedStyle(scrollContainer);
                      if (style.overflowY === "auto" || style.overflowY === "scroll" || style.maxHeight) {
                        break;
                      }
                      scrollContainer = scrollContainer.parentElement;
                    }
                  }
                  
                  if (!scrollContainer || scrollContainer === document.body) {
                    scrollContainer = null;
                  }
                  
                  if (scrollContainer) {
                    const containerRect = scrollContainer.getBoundingClientRect();
                    const elementRect = el.getBoundingClientRect();
                    const scrollTop = scrollContainer.scrollTop;
                    const relativeTop = elementRect.top - containerRect.top;
                    const targetScroll = scrollTop + relativeTop - 100;
                    const finalScroll = Math.max(0, Math.min(targetScroll, scrollContainer.scrollHeight - containerRect.height));
                    
                    if (scrollContainer.scrollHeight > containerRect.height) {
                      scrollContainer.scrollTo({
                        top: finalScroll,
                        behavior: "smooth"
                      });
                    } else {
                      el.scrollIntoView({ 
                        behavior: "smooth", 
                        block: "center",
                        inline: "nearest"
                      });
                    }
                  } else {
                    el.scrollIntoView({ 
                      behavior: "smooth", 
                      block: "center",
                      inline: "nearest"
                    });
                  }
                  
                  setTimeout(() => {
                    el.style.transition = "all 0.3s ease";
                    el.style.borderLeft = "3px solid rgba(255, 255, 255, 0.5)";
                    el.style.paddingLeft = "12px";
                    
                    setTimeout(() => {
                      el.style.transition = "all 0.5s ease";
                      el.style.borderLeft = "none";
                      el.style.paddingLeft = "0";
                    }, 3000);
                  }, 1000);
                };
                
                highlightAndScroll(retryElement);
              }
            }, 500);
          }
          break;
        }
      }
    }
  }, [news, loading, expandedComments, replies]);
}

