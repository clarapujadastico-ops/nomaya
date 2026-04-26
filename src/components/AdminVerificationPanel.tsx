import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { CheckCircle, XCircle, ChevronDown, ChevronUp } from "lucide-react";

interface PendingUser {
  id: string;
  name: string;
  city: string;
  verification_status: string;
  created_at: string;
}

async function getSignedUrl(path: string) {
  const { data } = await supabase.storage.from("Verification").createSignedUrl(path, 120);
  return data?.signedUrl ?? null;
}

function VerificationCard({ user, onDecision }: { user: PendingUser; onDecision: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [idUrl, setIdUrl] = useState<string | null>(null);
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  async function loadPhotos() {
    if (idUrl) { setExpanded(e => !e); return; }
    setExpanded(true);
    const [id, selfie] = await Promise.all([
      getSignedUrl(`${user.id}_id.jpg`),
      getSignedUrl(`${user.id}_selfie.jpg`),
    ]);
    setIdUrl(id);
    setSelfieUrl(selfie);
  }

  async function decide(status: 'verified' | 'rejected') {
    setLoading(true);
    await supabase.from('profiles').update({ verification_status: status }).eq('id', user.id);
    queryClient.invalidateQueries({ queryKey: ['pending_verifications'] });
    onDecision();
    setLoading(false);
  }

  return (
    <div className="bg-card rounded-2xl overflow-hidden shadow-soft">
      <button className="w-full flex items-center justify-between px-4 py-3" onClick={loadPhotos}>
        <div className="text-left">
          <p className="text-sm font-medium text-foreground">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.city} · {new Date(user.created_at).toLocaleDateString()}</p>
        </div>
        {expanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-muted-foreground mb-1">ID Document</p>
              {idUrl
                ? <img src={idUrl} alt="ID" className="w-full rounded-lg object-cover" style={{ aspectRatio: '85/54' }} />
                : <div className="w-full bg-muted rounded-lg animate-pulse" style={{ aspectRatio: '85/54' }} />
              }
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Selfie</p>
              {selfieUrl
                ? <img src={selfieUrl} alt="Selfie" className="w-full rounded-lg object-cover aspect-square" />
                : <div className="w-full bg-muted rounded-lg animate-pulse aspect-square" />
              }
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => decide('verified')}
              disabled={loading}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-green-500/20 text-green-400 text-sm font-medium disabled:opacity-50"
            >
              <CheckCircle size={15} />
              Approve
            </button>
            <button
              onClick={() => decide('rejected')}
              disabled={loading}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-500/20 text-red-400 text-sm font-medium disabled:opacity-50"
            >
              <XCircle size={15} />
              Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminVerificationPanel() {
  const { data: pending = [], isLoading } = useQuery({
    queryKey: ['pending_verifications'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, name, city, verification_status, created_at')
        .eq('verification_status', 'pending')
        .order('created_at', { ascending: true });
      return (data ?? []) as PendingUser[];
    },
  });

  if (isLoading) return (
    <div className="px-6 py-4 text-sm text-muted-foreground">Loading…</div>
  );

  return (
    <div className="px-6 py-4 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-medium text-foreground">Pending Verifications</h3>
        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">{pending.length}</span>
      </div>

      {pending.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">No pending verifications</p>
      ) : (
        pending.map(u => (
          <VerificationCard key={u.id} user={u} onDecision={() => {}} />
        ))
      )}
    </div>
  );
}
