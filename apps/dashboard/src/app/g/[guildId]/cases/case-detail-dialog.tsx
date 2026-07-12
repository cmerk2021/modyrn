'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import {
  ACTION_METADATA,
  CASE_SEVERITIES,
  CASE_STATUSES,
  type CaseSeverity,
  type CaseStatus,
  type ModerationActionType,
} from '@modyrn/shared';
import { apiFetch } from '@/lib/api';
import { useApiData } from '@/lib/use-api';
import { formatRelativeTime } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input, Label, Select, Textarea } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface LinkedCase {
  id: string;
  caseNumber: number;
  action: ModerationActionType;
  status: string;
  severity: CaseSeverity;
  targetName: string;
  reason: string | null;
  createdAt: string;
}

interface CaseDetail {
  id: string;
  caseNumber: number;
  action: ModerationActionType;
  status: CaseStatus;
  severity: CaseSeverity;
  targetUserId: string;
  moderatorId: string;
  targetName: string;
  moderatorName: string;
  reason: string | null;
  durationMs: number | null;
  expiresAt: string | null;
  evidence: { messageLinks?: string[]; attachmentUrls?: string[]; note?: string } | null;
  metadataNames: Record<string, string>;
  createdAt: string;
  notes: {
    id: string;
    content: string;
    authorId: string;
    authorName: string;
    createdAt: string;
  }[];
  links: {
    id: string;
    linkedCaseId: string;
    createdByName: string;
    createdAt: string;
    case: LinkedCase | null;
  }[];
}

interface CaseListResponse {
  items: LinkedCase[];
}

const SEVERITY_VARIANT: Record<CaseSeverity, 'secondary' | 'warning' | 'destructive'> = {
  low: 'secondary',
  medium: 'warning',
  high: 'destructive',
  critical: 'destructive',
};

interface CaseDetailDialogProps {
  guildId: string;
  caseId: string;
  onClose: () => void;
  onChange: () => void;
}

export function CaseDetailDialog({ guildId, caseId, onClose, onChange }: CaseDetailDialogProps) {
  const {
    data: detail,
    loading,
    refetch,
  } = useApiData<CaseDetail>(`/guilds/${guildId}/cases/${caseId}`);

  const [reason, setReason] = useState('');
  const [status, setStatus] = useState<CaseStatus>('open');
  const [severity, setSeverity] = useState<CaseSeverity>('low');
  const [evidenceNote, setEvidenceNote] = useState('');
  const [messageLinks, setMessageLinks] = useState<string[]>([]);
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([]);
  const [newLink, setNewLink] = useState('');
  const [newAttachment, setNewAttachment] = useState('');
  const [note, setNote] = useState('');
  const [linkTarget, setLinkTarget] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sync local edit state whenever the case (re)loads.
  useEffect(() => {
    if (!detail) return;
    setReason(detail.reason ?? '');
    setStatus(detail.status);
    setSeverity(detail.severity);
    setEvidenceNote(detail.evidence?.note ?? '');
    setMessageLinks(detail.evidence?.messageLinks ?? []);
    setAttachmentUrls(detail.evidence?.attachmentUrls ?? []);
  }, [detail]);

  // Prior cases for the same target, offered as link candidates.
  const { data: priorCases } = useApiData<CaseListResponse>(
    detail ? `/guilds/${guildId}/cases?targetUserId=${detail.targetUserId}&pageSize=50` : null,
  );

  const patch = async (body: Record<string, unknown>, key: string) => {
    setBusy(key);
    setError(null);
    try {
      await apiFetch(`/guilds/${guildId}/cases/${caseId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      refetch();
      onChange();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const saveDetails = () => patch({ reason: reason.trim() || null, status, severity }, 'details');

  const saveEvidence = () =>
    patch(
      {
        evidence: {
          note: evidenceNote.trim() || undefined,
          messageLinks,
          attachmentUrls,
        },
      },
      'evidence',
    );

  const addNote = async () => {
    if (!note.trim()) return;
    setBusy('note');
    setError(null);
    try {
      await apiFetch(`/guilds/${guildId}/cases/${caseId}/notes`, {
        method: 'POST',
        body: JSON.stringify({ content: note }),
      });
      setNote('');
      refetch();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const deleteNote = async (noteId: string) => {
    setBusy(`note-${noteId}`);
    try {
      await apiFetch(`/guilds/${guildId}/cases/${caseId}/notes/${noteId}`, { method: 'DELETE' });
      refetch();
    } finally {
      setBusy(null);
    }
  };

  const addLink = async () => {
    if (!linkTarget) return;
    setBusy('link');
    setError(null);
    try {
      await apiFetch(`/guilds/${guildId}/cases/${caseId}/links`, {
        method: 'POST',
        body: JSON.stringify({ linkedCaseId: linkTarget }),
      });
      setLinkTarget('');
      refetch();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const removeLink = async (linkId: string) => {
    setBusy(`link-${linkId}`);
    try {
      await apiFetch(`/guilds/${guildId}/cases/${caseId}/links/${linkId}`, { method: 'DELETE' });
      refetch();
    } finally {
      setBusy(null);
    }
  };

  const linkedIds = new Set(detail?.links.map((l) => l.linkedCaseId));
  const linkCandidates = (priorCases?.items ?? []).filter(
    (c) => c.id !== caseId && !linkedIds.has(c.id),
  );

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {detail
              ? `Case #${detail.caseNumber} · ${ACTION_METADATA[detail.action]?.label}`
              : 'Case'}
          </DialogTitle>
          <DialogDescription>
            {detail
              ? `${detail.targetName} · by ${detail.moderatorName} · ${formatRelativeTime(detail.createdAt)}`
              : 'Loading…'}
          </DialogDescription>
        </DialogHeader>

        {loading || !detail ? (
          <p className="text-muted-foreground py-8 text-center text-sm">Loading case…</p>
        ) : (
          <Tabs defaultValue="details">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="evidence">Evidence</TabsTrigger>
              <TabsTrigger value="notes">Notes ({detail.notes.length})</TabsTrigger>
              <TabsTrigger value="history">History ({detail.links.length})</TabsTrigger>
            </TabsList>

            {/* Details --------------------------------------------------- */}
            <TabsContent value="details">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant={SEVERITY_VARIANT[detail.severity]}>{detail.severity}</Badge>
                  <Badge variant="outline">{detail.status}</Badge>
                  {detail.expiresAt && (
                    <span className="text-muted-foreground">
                      Expires {formatRelativeTime(detail.expiresAt)}
                    </span>
                  )}
                  {detail.metadataNames.channel && (
                    <span className="text-muted-foreground">
                      Channel: #{detail.metadataNames.channel}
                    </span>
                  )}
                  {detail.metadataNames.role && (
                    <span className="text-muted-foreground">Role: {detail.metadataNames.role}</span>
                  )}
                </div>

                <div>
                  <Label>Reason</Label>
                  <Textarea
                    className="mt-1"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="No reason recorded"
                  />
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label>Status</Label>
                    <Select
                      className="mt-1"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as CaseStatus)}
                    >
                      {CASE_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label>Severity</Label>
                    <Select
                      className="mt-1"
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value as CaseSeverity)}
                    >
                      {CASE_SEVERITIES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                {error && <p className="text-destructive text-sm">{error}</p>}

                <Button disabled={busy !== null} onClick={() => void saveDetails()}>
                  {busy === 'details' ? 'Saving…' : 'Save changes'}
                </Button>
              </div>
            </TabsContent>

            {/* Evidence -------------------------------------------------- */}
            <TabsContent value="evidence">
              <div className="space-y-4">
                <EvidenceList
                  label="Message links"
                  items={messageLinks}
                  value={newLink}
                  placeholder="https://discord.com/channels/…"
                  onValueChange={setNewLink}
                  onAdd={() => {
                    if (!newLink.trim()) return;
                    setMessageLinks((l) => [...l, newLink.trim()]);
                    setNewLink('');
                  }}
                  onRemove={(i) => setMessageLinks((l) => l.filter((_, idx) => idx !== i))}
                />

                <EvidenceList
                  label="Attachment URLs"
                  items={attachmentUrls}
                  value={newAttachment}
                  placeholder="https://…"
                  onValueChange={setNewAttachment}
                  onAdd={() => {
                    if (!newAttachment.trim()) return;
                    setAttachmentUrls((l) => [...l, newAttachment.trim()]);
                    setNewAttachment('');
                  }}
                  onRemove={(i) => setAttachmentUrls((l) => l.filter((_, idx) => idx !== i))}
                />

                <div>
                  <Label>Evidence note</Label>
                  <Textarea
                    className="mt-1"
                    value={evidenceNote}
                    onChange={(e) => setEvidenceNote(e.target.value)}
                    placeholder="Context or summary of the evidence…"
                  />
                </div>

                {error && <p className="text-destructive text-sm">{error}</p>}

                <Button disabled={busy !== null} onClick={() => void saveEvidence()}>
                  {busy === 'evidence' ? 'Saving…' : 'Save evidence'}
                </Button>
              </div>
            </TabsContent>

            {/* Notes ----------------------------------------------------- */}
            <TabsContent value="notes">
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Add an investigative note…"
                    className="min-h-[40px]"
                  />
                  <Button disabled={busy !== null} onClick={() => void addNote()}>
                    Add
                  </Button>
                </div>
                <div className="max-h-64 space-y-2 overflow-y-auto">
                  {detail.notes.length === 0 ? (
                    <p className="text-muted-foreground py-6 text-center text-sm">No notes yet.</p>
                  ) : (
                    detail.notes.map((n) => (
                      <div key={n.id} className="border-border rounded-md border p-3 text-sm">
                        <div className="flex items-start justify-between gap-2">
                          <p className="min-w-0 break-words">{n.content}</p>
                          <button
                            type="button"
                            className="text-muted-foreground hover:text-destructive shrink-0"
                            disabled={busy !== null}
                            onClick={() => void deleteNote(n.id)}
                            aria-label="Delete note"
                          >
                            <X className="size-4" />
                          </button>
                        </div>
                        <p className="text-muted-foreground mt-1 text-xs">
                          {n.authorName} · {formatRelativeTime(n.createdAt)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>

            {/* History (linked cases) ------------------------------------ */}
            <TabsContent value="history">
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Select
                    className="flex-1"
                    value={linkTarget}
                    onChange={(e) => setLinkTarget(e.target.value)}
                  >
                    <option value="">Attach a prior case…</option>
                    {linkCandidates.map((c) => (
                      <option key={c.id} value={c.id}>
                        #{c.caseNumber} · {ACTION_METADATA[c.action]?.label ?? c.action}
                        {c.reason ? ` — ${c.reason.slice(0, 40)}` : ''}
                      </option>
                    ))}
                  </Select>
                  <Button disabled={busy !== null || !linkTarget} onClick={() => void addLink()}>
                    Link
                  </Button>
                </div>

                {error && <p className="text-destructive text-sm">{error}</p>}

                <div className="max-h-64 space-y-2 overflow-y-auto">
                  {detail.links.length === 0 ? (
                    <p className="text-muted-foreground py-6 text-center text-sm">
                      No prior cases linked.
                    </p>
                  ) : (
                    detail.links.map((l) => (
                      <div
                        key={l.id}
                        className="border-border flex items-center justify-between gap-2 rounded-md border p-3 text-sm"
                      >
                        <div className="min-w-0">
                          {l.case ? (
                            <>
                              <span className="font-medium">
                                #{l.case.caseNumber} ·{' '}
                                {ACTION_METADATA[l.case.action]?.label ?? l.case.action}
                              </span>
                              <p className="text-muted-foreground truncate text-xs">
                                {l.case.targetName} · {l.case.reason || 'No reason'} ·{' '}
                                {formatRelativeTime(l.case.createdAt)}
                              </p>
                            </>
                          ) : (
                            <span className="text-muted-foreground">Linked case unavailable</span>
                          )}
                        </div>
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-destructive shrink-0"
                          disabled={busy !== null}
                          onClick={() => void removeLink(l.id)}
                          aria-label="Remove link"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface EvidenceListProps {
  label: string;
  items: string[];
  value: string;
  placeholder: string;
  onValueChange: (value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

function EvidenceList({
  label,
  items,
  value,
  placeholder,
  onValueChange,
  onAdd,
  onRemove,
}: EvidenceListProps) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-1 flex gap-2">
        <Input
          value={value}
          placeholder={placeholder}
          onChange={(e) => onValueChange(e.target.value)}
        />
        <Button type="button" variant="secondary" onClick={onAdd}>
          Add
        </Button>
      </div>
      {items.length > 0 && (
        <ul className="mt-2 space-y-1">
          {items.map((item, i) => (
            <li
              key={`${item}-${i}`}
              className="border-border flex items-center justify-between gap-2 rounded-md border px-2 py-1 text-xs"
            >
              <span className="min-w-0 truncate">{item}</span>
              <button
                type="button"
                className="text-muted-foreground hover:text-destructive shrink-0"
                onClick={() => onRemove(i)}
                aria-label={`Remove ${label}`}
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
