'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/supabase';

interface UserProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  discord_id: string | null;
  discord_username: string | null;
  discord_global_name: string | null;
  discord_avatar: string | null;
}

export function UserMentionHydrator() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const observer = new MutationObserver(() => {
      document.querySelectorAll('.user-mention:not([data-hydrated])').forEach((el) => {
        const username = el.getAttribute('data-username');
        if (!username) return;
        el.setAttribute('data-hydrated', 'true');
        el.classList.add('cursor-pointer', 'text-primary', 'underline', 'decoration-dotted', 'underline-offset-2');
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}

function UserMentionPopoverContent({
  username,
  triggerRef,
  onClose,
}: {
  username: string;
  triggerRef: React.RefObject<HTMLSpanElement | null>;
  onClose: () => void;
}) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        left: Math.min(rect.left, window.innerWidth - 320),
      });
    }
  }, [triggerRef]);

  useEffect(() => {
    setLoading(true);
    supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, bio, discord_id, discord_username, discord_global_name, discord_avatar')
      .or(`username.ilike.${username},display_name.ilike.${username},discord_username.ilike.${username}`)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!error && data) setProfile(data as UserProfile);
        setLoading(false);
      });
  }, [username]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, triggerRef]);

  return createPortal(
    <div
      ref={popoverRef}
      className="fixed z-[9999] bg-popover border rounded-lg shadow-xl p-4 min-w-[280px] max-w-[320px]"
      style={{ top: position.top, left: position.left }}
    >
      {loading && <p className="text-sm text-muted-foreground">Carregando...</p>}
      {!loading && !profile && (
        <p className="text-sm text-muted-foreground">Usuário não encontrado</p>
      )}
      {!loading && profile && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-lg font-bold text-muted-foreground">
                {(profile.display_name || profile.username || '?')[0]}
              </div>
            )}
            <div>
              <div className="font-medium text-sm">
                {profile.display_name || profile.username || 'Usuário'}
              </div>
              {profile.username && (
                <div className="text-xs text-muted-foreground">@{profile.username}</div>
              )}
            </div>
          </div>
          {profile.discord_id && (
            <div className="border-t pt-3 mt-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <span className="text-[#5865F2] font-semibold">Discord</span>
              </div>
              <div className="flex items-center gap-2">
                {profile.discord_avatar && (
                  <img src={profile.discord_avatar} alt="" className="h-6 w-6 rounded-full" />
                )}
                <div>
                  <span className="text-sm">
                    {profile.discord_global_name || profile.discord_username}
                  </span>
                  {profile.discord_username && (
                    <span className="text-xs text-muted-foreground ml-1">
                      (@{profile.discord_username})
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
          {profile.bio && (
            <p className="text-xs text-muted-foreground leading-relaxed border-t pt-2">
              {profile.bio}
            </p>
          )}
        </div>
      )}
    </div>,
    document.body,
  );
}

export function UserMentionPopover({
  username,
  children,
}: {
  username: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);

  const handleClose = useCallback(() => setOpen(false), []);

  return (
    <>
      <span
        ref={triggerRef}
        className="cursor-pointer text-primary underline decoration-dotted underline-offset-2 hover:text-primary/80 transition-colors"
        onClick={() => setOpen(!open)}
      >
        {children}
      </span>
      {open && (
        <UserMentionPopoverContent
          username={username}
          triggerRef={triggerRef}
          onClose={handleClose}
        />
      )}
    </>
  );
}
