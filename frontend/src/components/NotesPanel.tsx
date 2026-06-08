'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';

interface Props {
  interviewId: string;
}

export default function NotesPanel({ interviewId }: Props) {
  const [privateNote, setPrivateNote] = useState('');
  const [sharedNote, setSharedNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<Array<{ content: string; is_private: boolean }>>(`/api/notes/${interviewId}`)
      .then((notes) => {
        notes.forEach((n) => {
          if (n.is_private) setPrivateNote(n.content);
          else setSharedNote(n.content);
        });
      })
      .catch(() => {});
  }, [interviewId]);

  const save = useCallback(
    async (content: string, isPrivate: boolean) => {
      setSaving(true);
      try {
        await api(`/api/notes/${interviewId}`, {
          method: 'PUT',
          body: JSON.stringify({ content, isPrivate }),
        });
      } finally {
        setSaving(false);
      }
    },
    [interviewId]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (privateNote) save(privateNote, true);
    }, 1500);
    return () => clearTimeout(timer);
  }, [privateNote, save]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (sharedNote) save(sharedNote, false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [sharedNote, save]);

  return (
    <div className="flex h-full flex-col gap-3 p-2">
      <div>
        <label className="text-xs text-gray-400">Private Notes {saving && '(saving...)'}</label>
        <textarea
          value={privateNote}
          onChange={(e) => setPrivateNote(e.target.value)}
          className="mt-1 h-24 w-full rounded bg-gray-800 p-2 text-sm"
          placeholder="Only you can see this..."
        />
      </div>
      <div>
        <label className="text-xs text-gray-400">Shared Notes</label>
        <textarea
          value={sharedNote}
          onChange={(e) => setSharedNote(e.target.value)}
          className="mt-1 h-24 w-full rounded bg-gray-800 p-2 text-sm"
          placeholder="Visible to all participants..."
        />
      </div>
    </div>
  );
}
