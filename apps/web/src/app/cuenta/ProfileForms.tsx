'use client';

import { useState } from 'react';
import { Button, Card, Input } from '@maqserv/ui';
import type { AuthUser } from '@maqserv/types';

export function ProfileForms({
  user,
  labels,
}: {
  user: AuthUser;
  labels: {
    profileTitle: string;
    name: string;
    phone: string;
    address: string;
    city: string;
    zip: string;
    save: string;
    saved: string;
    passwordTitle: string;
    current: string;
    next: string;
    submit: string;
    changed: string;
  };
}) {
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [passMsg, setPassMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const full = { width: '100%' } as const;

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setProfileMsg(null);
    const form = new FormData(e.currentTarget);
    const res = await fetch('/api/proxy/auth/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: String(form.get('name') ?? ''),
        phone: String(form.get('phone') ?? ''),
        address: String(form.get('address') ?? ''),
        city: String(form.get('city') ?? ''),
        zip: String(form.get('zip') ?? ''),
      }),
    });
    const data = await res.json().catch(() => null);
    setProfileMsg(res.ok
      ? { ok: true, text: labels.saved }
      : { ok: false, text: typeof data?.message === 'string' ? data.message : 'Error al guardar' });
  }

  async function changePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPassMsg(null);
    const form = new FormData(e.currentTarget);
    const res = await fetch('/api/proxy/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current: String(form.get('current') ?? ''),
        next: String(form.get('next') ?? ''),
      }),
    });
    const data = await res.json().catch(() => null);
    if (res.ok) {
      setPassMsg({ ok: true, text: labels.changed });
      (e.target as HTMLFormElement).reset();
    } else {
      setPassMsg({ ok: false, text: typeof data?.message === 'string' ? data.message : 'Error al actualizar' });
    }
  }

  const msg = (m: { ok: boolean; text: string } | null) =>
    m ? (
      <p role={m.ok ? 'status' : 'alert'} style={{ color: m.ok ? 'var(--color-success)' : 'var(--color-error)', margin: 0, fontSize: 'var(--text-sm)' }}>
        {m.text}
      </p>
    ) : null;

  return (
    <div style={{ display: 'grid', gap: '1.2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', alignItems: 'start' }}>
      <Card style={{ display: 'grid', gap: '.8rem' }}>
        <h2 style={{ fontSize: 'var(--text-lg)' }}>{labels.profileTitle}</h2>
        <form onSubmit={saveProfile} style={{ display: 'grid', gap: '.8rem' }}>
          <Input name="name" required minLength={2} defaultValue={user.name} placeholder={labels.name} aria-label={labels.name} style={full} />
          <Input name="phone" defaultValue={user.phone ?? ''} placeholder={labels.phone} aria-label={labels.phone} style={full} />
          <Input name="address" defaultValue={user.address ?? ''} placeholder={labels.address} aria-label={labels.address} style={full} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.8rem' }}>
            <Input name="city" defaultValue={user.city ?? ''} placeholder={labels.city} aria-label={labels.city} style={full} />
            <Input name="zip" defaultValue={user.zip ?? ''} placeholder={labels.zip} aria-label={labels.zip} style={full} />
          </div>
          {msg(profileMsg)}
          <div><Button type="submit">{labels.save}</Button></div>
        </form>
      </Card>

      <Card style={{ display: 'grid', gap: '.8rem' }}>
        <h2 style={{ fontSize: 'var(--text-lg)' }}>{labels.passwordTitle}</h2>
        <form onSubmit={changePassword} style={{ display: 'grid', gap: '.8rem' }}>
          <Input name="current" type="password" required placeholder={labels.current} aria-label={labels.current} autoComplete="current-password" style={full} />
          <Input name="next" type="password" required minLength={8} placeholder={labels.next} aria-label={labels.next} autoComplete="new-password" style={full} />
          {msg(passMsg)}
          <div><Button type="submit">{labels.submit}</Button></div>
        </form>
      </Card>
    </div>
  );
}
