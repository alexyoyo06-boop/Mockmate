"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function UserNav() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  }

  if (loading) return <div className="w-16 h-6 bg-gray-200 animate-pulse" />;

  if (!user) {
    return (
      <a
        href="/login"
        className="mono text-xs border border-black px-2 py-1 hover:bg-black hover:text-white transition-colors"
      >
        INICIAR SESIÓN
      </a>
    );
  }

  const meta = user.user_metadata ?? {};
  const avatar = (meta.avatar_url || meta.picture) as string | undefined;
  const name = ((meta.full_name || meta.name) as string | undefined)?.split(" ")[0] ?? "TÚ";

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 border border-black px-2 py-1 overflow-hidden">
        {avatar ? (
          <Image
            src={avatar}
            alt={name}
            width={24}
            height={24}
            className="rounded-full flex-shrink-0 object-cover"
            unoptimized
          />
        ) : (
          <div className="w-5 h-5 bg-black text-white flex items-center justify-center mono text-xs">
            {name[0]}
          </div>
        )}
        <span className="mono text-xs font-bold hidden sm:inline">{name.toUpperCase()}</span>
      </div>
      <button
        onClick={handleSignOut}
        className="mono text-xs border border-black px-2 py-1 hover:bg-black hover:text-white transition-colors"
      >
        SALIR
      </button>
    </div>
  );
}
