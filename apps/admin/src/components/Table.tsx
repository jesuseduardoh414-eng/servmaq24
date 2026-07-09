import type { ReactNode } from 'react';

/** Tabla básica del admin sobre tokens. */
export function Table({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div style={{ overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 640 }}>
        <thead>
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                style={{
                  textAlign: 'left',
                  padding: '.7rem .9rem',
                  borderBottom: '1px solid var(--color-border)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-muted)',
                  whiteSpace: 'nowrap',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Td({ children, muted }: { children: ReactNode; muted?: boolean }) {
  return (
    <td
      style={{
        padding: '.65rem .9rem',
        borderBottom: '1px solid var(--color-border)',
        fontSize: 'var(--text-sm)',
        color: muted ? 'var(--color-text-muted)' : 'var(--color-text)',
        verticalAlign: 'middle',
      }}
    >
      {children}
    </td>
  );
}
