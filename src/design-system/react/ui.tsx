import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import { Icon } from './Icon';
import type { ButtonVariant, IconName, LiveCardTone, TagKind, ToastKind } from './types';

export function Button({
  variant = 'default',
  small,
  icon,
  children,
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  small?: boolean;
  icon?: IconName;
}) {
  const v = variant === 'default' ? '' : variant;
  return (
    <button type="button" className={`btn ${v} ${small ? 'small' : ''} ${className}`.trim()} {...rest}>
      {icon && <Icon name={icon} />}
      {children}
    </button>
  );
}

export function CleanButton({
  label,
  sub,
  icon = 'broom',
  done = false,
  busy = false,
  onClick,
  disabled,
}: {
  label: string;
  sub?: string;
  icon?: IconName;
  done?: boolean;
  busy?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button type="button" className={`cta${done ? ' done' : ''}${busy ? ' busy' : ''}`} onClick={onClick} disabled={disabled || busy}>
      <span className="cta-ico">{busy ? <span className="spinner on-color" /> : <Icon name={done ? 'check' : icon} />}</span>
      <span className="cta-t">
        <b>{label}</b>
        {sub && <small>{sub}</small>}
      </span>
    </button>
  );
}

export function ScreenHead({ title, sub, children }: { title: string; sub?: ReactNode; children?: ReactNode }) {
  return (
    <header className="screen-head icc-chrome card-w">
      <div className="min-w-0">
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {children}
    </header>
  );
}

export function Empty({ icon, title, text, children }: { icon: IconName; title: string; text?: ReactNode; children?: ReactNode }) {
  return (
    <div className="empty">
      <span className="chip-ico" style={{ width: 52, height: 52, borderRadius: 18 }}>
        <Icon name={icon} size={26} />
      </span>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {children}
    </div>
  );
}

export function Progress({ value }: { value?: number }) {
  if (value === undefined) {
    return (
      <div className="progress">
        <i />
      </div>
    );
  }
  return (
    <div className="progress" data-value={value}>
      <i style={{ width: `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%` }} />
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} className="toggle" onClick={() => onChange(!checked)} />;
}

export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Tag({ kind = 'default', children }: { kind?: TagKind; children: ReactNode }) {
  return <span className={`tag${kind !== 'default' ? ` ${kind}` : ''}`}>{children}</span>;
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card-w ${className}`.trim()}>{children}</div>;
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="input" {...props} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="textarea" {...props} />;
}

export function Checkbox(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input type="checkbox" className="check" {...props} />;
}

export function Eyebrow({ live = true, children }: { live?: boolean; children: ReactNode }) {
  return (
    <span className="eyebrow">
      <span className={`dot${live ? '' : ' idle'}`} />
      <span className="eyebrow-t">{children}</span>
    </span>
  );
}

export function Toast({ kind = 'ok', children }: { kind?: ToastKind; children: ReactNode }) {
  return (
    <div className={`toast${kind === 'err' ? ' err' : ''}`}>
      <Icon name={kind === 'err' ? 'warning' : 'check'} />
      {children}
    </div>
  );
}

const TONE: Record<LiveCardTone, string> = {
  clean: 'c-clean',
  speed: 'c-speed',
  prot: 'c-prot',
  apps: 'c-apps',
};

export function LiveCard({
  tone,
  icon,
  title,
  value,
  unit,
  sub,
  action,
  done,
}: {
  tone: LiveCardTone;
  icon: IconName;
  title: string;
  value: string;
  unit?: string;
  sub?: string;
  action?: string;
  done?: boolean;
}) {
  return (
    <article className={`lc ${TONE[tone]}`}>
      <span className="glow" aria-hidden="true" />
      <span className="shine" aria-hidden="true" />
      <div className="lc-top">
        <span className="glass-ico">
          <Icon name={icon} />
        </span>
        <b>{title}</b>
      </div>
      <div className="lc-num">
        <strong>{value}</strong>
        {unit && <em>{unit}</em>}
      </div>
      {sub && <div className="lc-sub">{sub}</div>}
      {action && (
        <div className="lc-foot">
          <button type="button" className={`pill${done ? ' done' : ''}`} disabled={done}>
            {action}
          </button>
        </div>
      )}
    </article>
  );
}

export function WaitOrb({ icon = 'broom', title, text }: { icon?: IconName; title: string; text?: string }) {
  return (
    <div className="fx-wait">
      <span className="orb">
        <Icon name={icon} />
      </span>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
    </div>
  );
}

export function Dock({ bytes, unit, sub, children }: { bytes: string; unit: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="fx-dock">
      <div className="grow">
        <div className="fx-dock-num">
          {bytes} <small>{unit}</small>
        </div>
        {sub && <div className="fx-dock-sub">{sub}</div>}
      </div>
      {children}
    </div>
  );
}
