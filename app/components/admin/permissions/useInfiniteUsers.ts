"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { UserResponse } from "@/app/services/auth/authAdminService";
import { sortUsersAlphabetically } from "./utils";

const LIMIT = 5;

type ListFunction = (limit: number, offset: number) => Promise<UserResponse[]>;

interface UseInfiniteUsersReturn {
  users: UserResponse[];
  loading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  reset: () => void;
  loaderRef: React.RefObject<HTMLDivElement | null>;
}

export function useInfiniteUsers(listFunction: ListFunction): UseInfiniteUsersReturn {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement>(null);

  const loadUsers = useCallback(
    async (reset = false) => {
      if (loading) return;

      setLoading(true);
      const nextOffset = reset ? 0 : offset;

      try {
        const data = await listFunction(LIMIT, nextOffset);
        const sortedData = sortUsersAlphabetically(data);

        setUsers((prev) => {
          if (reset) {
            return sortedData;
          }
          // Merge e remove duplicatas
          const merged = [...prev, ...sortedData];
          const unique = Array.from(new Map(merged.map((item) => [item.id, item])).values());
          return sortUsersAlphabetically(unique);
        });

        setOffset(nextOffset + data.length);

        if (data.length < LIMIT) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }
      } catch (error) {
        console.error("Erro ao carregar usuários", error);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    [listFunction, loading, offset]
  );

  const reset = useCallback(() => {
    setUsers([]);
    setOffset(0);
    setHasMore(true);
    loadUsers(true);
  }, [loadUsers]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadUsers(false);
    }
  }, [loading, hasMore, loadUsers]);

  // Infinite scroll com IntersectionObserver
  useEffect(() => {
    if (!loaderRef.current || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 1 }
    );

    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, loadMore]);

  // Carregar inicial
  useEffect(() => {
    loadUsers(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    users,
    loading,
    hasMore,
    loadMore,
    reset,
    loaderRef,
  };
}



