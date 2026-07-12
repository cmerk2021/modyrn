'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  AutomodActionType,
  AutomodConditionField,
  AutomodEventType,
  AutomodLogic,
  AutomodOperator,
  type AutomodAction,
  type AutomodConditionLeaf,
  type AutomodRule,
} from '@modyrn/shared';
import { apiFetch } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input, Label, Select } from '@/components/ui/input';

interface RuleEditorProps {
  guildId: string;
  rule: AutomodRule | null;
  onClose: () => void;
  onSaved: () => void;
}

const FIELDS = Object.values(AutomodConditionField);
const OPERATORS = Object.values(AutomodOperator);
const EVENTS = Object.values(AutomodEventType);
const ACTIONS = Object.values(AutomodActionType);

/** Form-based automod rule builder: IF (conditions) THEN (actions). */
export function RuleEditor({ guildId, rule, onClose, onSaved }: RuleEditorProps) {
  const [name, setName] = useState(rule?.name ?? '');
  const [event, setEvent] = useState<AutomodEventType>(
    rule?.event ?? AutomodEventType.MessageCreate,
  );
  const [logic, setLogic] = useState<AutomodLogic>(rule?.conditions.logic ?? AutomodLogic.And);
  const [conditions, setConditions] = useState<AutomodConditionLeaf[]>(
    (rule?.conditions.children.filter((c) => c.kind === 'condition') as AutomodConditionLeaf[]) ??
      [],
  );
  const [actions, setActions] = useState<AutomodAction[]>(rule?.actions ?? []);
  const [priority, setPriority] = useState(rule?.priority ?? 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addCondition = () =>
    setConditions((c) => [
      ...c,
      {
        kind: 'condition',
        field: AutomodConditionField.MessageContent,
        operator: AutomodOperator.Contains,
        value: '',
      },
    ]);

  const addAction = () =>
    setActions((a) => [...a, { type: AutomodActionType.DeleteMessage, params: {} }]);

  const save = async () => {
    setSaving(true);
    setError(null);
    const body = {
      name: name || 'Untitled rule',
      event,
      priority,
      conditions: { kind: 'group', logic, children: conditions },
      actions,
      enabled: rule?.enabled ?? true,
    };
    try {
      if (rule) {
        await apiFetch(`/guilds/${guildId}/automod/${rule.id}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
      } else {
        await apiFetch(`/guilds/${guildId}/automod`, {
          method: 'POST',
          body: JSON.stringify(body),
        });
      }
      onSaved();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{rule ? 'Edit rule' : 'New automod rule'}</DialogTitle>
          <DialogDescription>Define when the rule triggers and what it does.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Name</Label>
              <Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>Priority</Label>
              <Input
                type="number"
                className="mt-1"
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
              />
            </div>
          </div>

          <div>
            <Label>When this event occurs</Label>
            <Select
              className="mt-1"
              value={event}
              onChange={(e) => setEvent(e.target.value as AutomodEventType)}
            >
              {EVENTS.map((ev) => (
                <option key={ev} value={ev}>
                  {ev}
                </option>
              ))}
            </Select>
          </div>

          <div className="border-border rounded-lg border p-3">
            <div className="mb-2 flex items-center justify-between">
              <Label>
                IF{' '}
                <Select
                  className="ml-1 inline-flex h-7 w-20"
                  value={logic}
                  onChange={(e) => setLogic(e.target.value as AutomodLogic)}
                >
                  <option value={AutomodLogic.And}>ALL</option>
                  <option value={AutomodLogic.Or}>ANY</option>
                  <option value={AutomodLogic.Not}>NONE</option>
                </Select>{' '}
                match
              </Label>
              <Button size="sm" variant="ghost" onClick={addCondition}>
                <Plus className="size-4" /> Condition
              </Button>
            </div>
            <div className="space-y-2">
              {conditions.length === 0 && (
                <p className="text-muted-foreground text-xs">
                  No conditions — the rule matches every event.
                </p>
              )}
              {conditions.map((cond, i) => (
                <div key={i} className="flex gap-1.5">
                  <Select
                    value={cond.field}
                    onChange={(e) =>
                      setConditions((cs) =>
                        cs.map((c, j) =>
                          j === i ? { ...c, field: e.target.value as AutomodConditionField } : c,
                        ),
                      )
                    }
                  >
                    {FIELDS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </Select>
                  <Select
                    className="max-w-[9rem]"
                    value={cond.operator}
                    onChange={(e) =>
                      setConditions((cs) =>
                        cs.map((c, j) =>
                          j === i ? { ...c, operator: e.target.value as AutomodOperator } : c,
                        ),
                      )
                    }
                  >
                    {OPERATORS.map((op) => (
                      <option key={op} value={op}>
                        {op}
                      </option>
                    ))}
                  </Select>
                  <Input
                    placeholder="value"
                    value={String(cond.value ?? '')}
                    onChange={(e) =>
                      setConditions((cs) =>
                        cs.map((c, j) => (j === i ? { ...c, value: e.target.value } : c)),
                      )
                    }
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setConditions((cs) => cs.filter((_, j) => j !== i))}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="border-border rounded-lg border p-3">
            <div className="mb-2 flex items-center justify-between">
              <Label>THEN do</Label>
              <Button size="sm" variant="ghost" onClick={addAction}>
                <Plus className="size-4" /> Action
              </Button>
            </div>
            <div className="space-y-2">
              {actions.map((action, i) => (
                <div key={i} className="flex gap-1.5">
                  <Select
                    value={action.type}
                    onChange={(e) =>
                      setActions((as) =>
                        as.map((a, j) =>
                          j === i ? { ...a, type: e.target.value as AutomodActionType } : a,
                        ),
                      )
                    }
                  >
                    {ACTIONS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </Select>
                  <Input
                    placeholder="param (e.g. reason or durationMs)"
                    value={String(
                      (action.params?.reason as string) ??
                        (action.params?.durationMs as number) ??
                        '',
                    )}
                    onChange={(e) =>
                      setActions((as) =>
                        as.map((a, j) =>
                          j === i
                            ? {
                                ...a,
                                params: /^\d+$/.test(e.target.value)
                                  ? { durationMs: Number(e.target.value) }
                                  : { reason: e.target.value },
                              }
                            : a,
                        ),
                      )
                    }
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setActions((as) => as.filter((_, j) => j !== i))}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              {actions.length === 0 && (
                <p className="text-muted-foreground text-xs">Add at least one action.</p>
              )}
            </div>
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={saving} onClick={() => void save()}>
            {saving ? 'Saving…' : 'Save rule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
