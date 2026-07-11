'use client';

export function Stepper({
    value,
    onChange,
    min = 0,
    max = 99,
}: {
    value: number;
    onChange: (next: number) => void;
    min?: number;
    max?: number;
}) {
    return (
        <div className='flex items-center gap-3'>
            <StepBtn
                label='−'
                disabled={value <= min}
                onClick={() => onChange(Math.max(min, value - 1))}
            />
            <span
                className='min-w-[18px] text-center'
                style={{ font: '600 15px var(--font-sans)' }}
            >
                {value}
            </span>
            <StepBtn
                label='+'
                disabled={value >= max}
                onClick={() => onChange(Math.min(max, value + 1))}
            />
        </div>
    );
}

function StepBtn({
    label,
    onClick,
    disabled,
}: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
}) {
    return (
        <button
            type='button'
            onClick={onClick}
            disabled={disabled}
            className='grid h-[30px] w-[30px] place-items-center rounded-full border border-line text-[15px] text-ink transition-colors enabled:hover:border-ink3 disabled:opacity-40'
            style={{ cursor: disabled ? 'default' : 'pointer' }}
        >
            {label}
        </button>
    );
}

export function Spinner({ size = 22 }: { size?: number }) {
    return (
        <span
            className='animate-spin-slow inline-block text-accent'
            style={{ fontSize: size }}
            aria-hidden
        >
            ◌
        </span>
    );
}

export function Kicker({ children }: { children: React.ReactNode }) {
    return <div className='mono text-[10.5px] tracking-[0.2em] text-ink3'>{children}</div>;
}

export function EmptyState({
    title,
    body,
    action,
}: {
    title: string;
    body?: string;
    action?: React.ReactNode;
}) {
    return (
        <div className='grid justify-items-center gap-2.5 rounded-porch border border-dashed border-line px-6 py-14 text-center'>
            <div style={{ font: '600 20px var(--font-sans)' }}>{title}</div>
            {body && (
                <div
                    className='max-w-[380px] text-[14px] text-ink2'
                    style={{ fontFamily: 'var(--font-sans)' }}
                >
                    {body}
                </div>
            )}
            {action && <div className='mt-1.5'>{action}</div>}
        </div>
    );
}

export function CenterLoader() {
    return (
        <div className='grid place-items-center py-24'>
            <Spinner />
        </div>
    );
}
