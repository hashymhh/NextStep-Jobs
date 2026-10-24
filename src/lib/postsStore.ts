import { useState, useEffect, useCallback } from 'react';
import { Post } from '../types';
import { DEMO_POSTS } from './seed/demoData';

const POSTS_STORAGE_KEY = 'nextstep_v2_pk_posts_store';
const REMOVED_POSTS_KEY = 'nextstep_v2_pk_removed_posts';
const POSTS_EVENT = 'nextstep_v2_pk_posts_sync';

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return fallback;
}

export function usePostsStore() {
  const [allPosts, setAllPosts] = useState<Post[]>(() =>
    readJson(POSTS_STORAGE_KEY, DEMO_POSTS)
  );
  const [removedPostIds, setRemovedPostIds] = useState<string[]>(() =>
    readJson(REMOVED_POSTS_KEY, [])
  );

  useEffect(() => {
    const handleSync = () => {
      setAllPosts(readJson(POSTS_STORAGE_KEY, DEMO_POSTS));
      setRemovedPostIds(readJson(REMOVED_POSTS_KEY, []));
    };
    window.addEventListener(POSTS_EVENT, handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener(POSTS_EVENT, handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const emit = () => window.dispatchEvent(new CustomEvent(POSTS_EVENT));

  const saveAllPosts = useCallback((updater: Post[] | ((prev: Post[]) => Post[])) => {
    const current = readJson<Post[]>(POSTS_STORAGE_KEY, DEMO_POSTS);
    const next = typeof updater === 'function' ? updater(current) : updater;
    setAllPosts(next);
    localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(next));
    emit();
  }, []);

  const moderateRemovePost = useCallback((postId: string) => {
    const currentRemoved = readJson<string[]>(REMOVED_POSTS_KEY, []);
    if (!currentRemoved.includes(postId)) {
      const next = [...currentRemoved, postId];
      setRemovedPostIds(next);
      localStorage.setItem(REMOVED_POSTS_KEY, JSON.stringify(next));
      emit();
    }
  }, []);

  const moderateRestorePost = useCallback((postId: string) => {
    const currentRemoved = readJson<string[]>(REMOVED_POSTS_KEY, []);
    const next = currentRemoved.filter((id) => id !== postId);
    setRemovedPostIds(next);
    localStorage.setItem(REMOVED_POSTS_KEY, JSON.stringify(next));
    emit();
  }, []);

  const activePosts = allPosts.filter((p) => !removedPostIds.includes(p.id));

  return {
    allPosts,
    activePosts,
    removedPostIds,
    saveAllPosts,
    moderateRemovePost,
    moderateRestorePost,
  };
}
