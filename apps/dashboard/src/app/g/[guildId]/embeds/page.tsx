'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Plus, Send, Sparkles, Trash2 } from 'lucide-react';
import type { EmbedField, ManagedEmbed } from '@modyrn/shared';
import { apiFetch } from '@/lib/api';
import { useApiData } from '@/lib/use-api';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label, Select, Textarea } from '@/components/ui/input';

interface Channel {
  id: string;
  name: string;
  type: number;
}
interface Template {
  id: string;
  name: string;
  message: { embeds: ManagedEmbed[]; content?: string };
}

function hexToInt(hex: string): number {
  return parseInt(hex.replace('#', ''), 16) || 0x5865f2;
}
function intToHex(int?: number): string {
  return `#${(int ?? 0x5865f2).toString(16).padStart(6, '0')}`;
}

export default function EmbedsPage() {
  const { guildId } = useParams<{ guildId: string }>();
  const meta = useApiData<{ channels: Channel[]; roles: unknown[] }>(`/guilds/${guildId}/utility`);
  const templates = useApiData<Template[]>(`/guilds/${guildId}/utility/templates`);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#5865F2');
  const [footer, setFooter] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [fields, setFields] = useState<EmbedField[]>([]);
  const [content, setContent] = useState('');
  const [channelId, setChannelId] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const buildEmbed = (): ManagedEmbed => ({
    title: title || undefined,
    description: description || undefined,
    color: hexToInt(color),
    footer: footer ? { text: footer } : undefined,
    image: imageUrl ? { url: imageUrl } : undefined,
    fields: fields.length ? fields : undefined,
  });

  const message = () => ({ content: content || undefined, embeds: [buildEmbed()], components: [] });

  const textChannels = meta.data?.channels.filter((c) => c.type === 0) ?? [];

  const send = async () => {
    if (!channelId) return;
    await apiFetch(`/guilds/${guildId}/utility/send`, {
      method: 'POST',
      body: JSON.stringify({ channelId, message: message() }),
    });
    setFeedback('Message sent.');
  };

  const saveTemplate = async () => {
    if (!templateName) return;
    await apiFetch(`/guilds/${guildId}/utility/templates`, {
      method: 'POST',
      body: JSON.stringify({ name: templateName, message: message() }),
    });
    setTemplateName('');
    templates.refetch();
    setFeedback('Template saved.');
  };

  const loadTemplate = (t: Template) => {
    const embed = t.message.embeds[0];
    setTitle(embed?.title ?? '');
    setDescription(embed?.description ?? '');
    setColor(intToHex(embed?.color));
    setFooter(embed?.footer?.text ?? '');
    setImageUrl(embed?.image?.url ?? '');
    setFields(embed?.fields ?? []);
    setContent(t.message.content ?? '');
  };

  return (
    <div>
      <PageHeader
        icon={Sparkles}
        title="Embed Builder"
        description="Design rich embeds with a live preview — no JSON required."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Editor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Message content (optional)</Label>
              <Input
                className="mt-1"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
            <div>
              <Label>Title</Label>
              <Input className="mt-1" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                className="mt-1"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <div>
                <Label>Color</Label>
                <input
                  type="color"
                  className="border-input bg-background mt-1 h-9 w-16 rounded-md border"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Label>Footer</Label>
                <Input
                  className="mt-1"
                  value={footer}
                  onChange={(e) => setFooter(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label>Image URL</Label>
              <Input
                className="mt-1"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <Label>Fields</Label>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setFields((f) => [...f, { name: '', value: '', inline: false }])}
                >
                  <Plus className="size-4" /> Field
                </Button>
              </div>
              {fields.map((field, i) => (
                <div key={i} className="mb-2 flex gap-1.5">
                  <Input
                    placeholder="Name"
                    value={field.name}
                    onChange={(e) =>
                      setFields((fs) =>
                        fs.map((f, j) => (j === i ? { ...f, name: e.target.value } : f)),
                      )
                    }
                  />
                  <Input
                    placeholder="Value"
                    value={field.value}
                    onChange={(e) =>
                      setFields((fs) =>
                        fs.map((f, j) => (j === i ? { ...f, value: e.target.value } : f)),
                      )
                    }
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setFields((fs) => fs.filter((_, j) => j !== i))}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Live preview</CardTitle>
            </CardHeader>
            <CardContent>
              {content && <p className="mb-2 text-sm">{content}</p>}
              <div
                className="rounded-md bg-[#2b2d31] p-3 text-white"
                style={{ borderLeft: `4px solid ${color}` }}
              >
                {title && <p className="font-semibold">{title}</p>}
                {description && (
                  <p className="mt-1 whitespace-pre-wrap text-sm text-[#dbdee1]">{description}</p>
                )}
                {fields.length > 0 && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {fields.map((f, i) => (
                      <div key={i}>
                        <p className="text-xs font-semibold">{f.name || 'Field'}</p>
                        <p className="text-xs text-[#dbdee1]">{f.value}</p>
                      </div>
                    ))}
                  </div>
                )}
                {imageUrl && <img src={imageUrl} alt="" className="mt-2 max-h-40 rounded" />}
                {footer && <p className="mt-2 text-xs text-[#949ba4]">{footer}</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Send & save</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Select value={channelId} onChange={(e) => setChannelId(e.target.value)}>
                  <option value="">Select channel…</option>
                  {textChannels.map((c) => (
                    <option key={c.id} value={c.id}>
                      #{c.name}
                    </option>
                  ))}
                </Select>
                <Button disabled={!channelId} onClick={() => void send()}>
                  <Send className="size-4" /> Send
                </Button>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Template name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                />
                <Button
                  variant="outline"
                  disabled={!templateName}
                  onClick={() => void saveTemplate()}
                >
                  Save
                </Button>
              </div>
              {feedback && <p className="text-sm text-[var(--color-success)]">{feedback}</p>}
              {templates.data && templates.data.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {templates.data.map((t) => (
                    <Button
                      key={t.id}
                      size="sm"
                      variant="secondary"
                      onClick={() => loadTemplate(t)}
                    >
                      {t.name}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
