'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthProvider';
import { useTheme } from './ThemeProvider';

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
    return (
        <Link
            href={href}
            className='flex items-center gap-1.5 px-0.5 py-2 no-underline text-ink2 hover:text-ink transition-colors'
            style={{ font: '500 14px var(--font-sans)' }}
        >
            {label}
            {active && <span className='h-[5px] w-[5px] rounded-full bg-accent' aria-hidden />}
        </Link>
    );
}

export function Nav() {
    const pathname = usePathname();
    const router = useRouter();
    const { toggle } = useTheme();
    const { user, isAuthed, logout } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!menuOpen) return;
        const onClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, [menuOpen]);

    // The booking flow / gallery render their own chrome; nav stays on every page.
    const isActive = (href: string) =>
        href === '/' ? pathname === '/' : pathname.startsWith(href);

    return (
        <div className='sticky top-0 z-[60] border-b border-line bg-[color-mix(in_oklab,var(--bg)_82%,transparent)] backdrop-blur-[14px]'>
            <div className='mx-auto flex h-[58px] max-w-[1360px] items-center gap-[clamp(10px,1.8vw,24px)] px-[clamp(14px,3.5vw,32px)]'>
                <Link
                    href='/'
                    className='flex items-center gap-[9px] py-1.5 text-ink no-underline'
                    style={{
                        font: '700 17px var(--font-sans)',
                        letterSpacing: '-0.02em',
                    }}
                >
                    <span
                        className='grid h-[22px] w-[22px] place-items-center rounded-porch bg-accent text-[11px] text-on-accent'
                        aria-hidden
                    >
                        ◆
                    </span>
                    <span className='hidden sm:inline'>Porchlight</span>
                </Link>

                <div className='flex-1' />

                <NavLink href='/explore' label='Explore' active={isActive('/explore')} />
                <NavLink href='/trips' label='Trips' active={isActive('/trips')} />
                <NavLink href='/host' label='Host' active={isActive('/host')} />

                <button
                    type='button'
                    onClick={toggle}
                    title='Toggle dark mode'
                    className='grid h-[34px] w-[34px] place-items-center rounded-full border border-line text-[15px] text-ink transition-transform hover:border-ink3 active:scale-90'
                >
                    ◐
                </button>

                {isAuthed && user ? (
                    <div className='relative' ref={menuRef}>
                        <button
                            type='button'
                            onClick={() => setMenuOpen((o) => !o)}
                            className='flex items-center gap-2 rounded-full border border-line py-1 pl-1 pr-3 text-ink transition-colors hover:border-ink3'
                            style={{ font: '500 13px var(--font-sans)' }}
                        >
                            <span
                                className='grid h-[26px] w-[26px] place-items-center rounded-full bg-ink text-bg'
                                style={{ font: '600 12px var(--font-sans)' }}
                            >
                                {user.name.charAt(0).toUpperCase()}
                            </span>
                            <span className='hidden sm:inline'>{user.name.split(' ')[0]}</span>
                        </button>
                        {menuOpen && (
                            <div className='animate-fade absolute right-0 top-[calc(100%+8px)] w-56 rounded-porch border border-line bg-surface p-1.5 shadow-porch'>
                                <div className='px-3 py-2'>
                                    <div style={{ font: '600 14px var(--font-sans)' }}>
                                        {user.name}
                                    </div>
                                    <div className='mono mt-0.5 text-[11px] text-ink3'>
                                        {user.email}
                                    </div>
                                </div>
                                <MenuItem
                                    href='/trips'
                                    label='My trips'
                                    onNavigate={() => setMenuOpen(false)}
                                />
                                <MenuItem
                                    href='/host'
                                    label='Host dashboard'
                                    onNavigate={() => setMenuOpen(false)}
                                />
                                <MenuItem
                                    href='/favorites'
                                    label='Saved'
                                    onNavigate={() => setMenuOpen(false)}
                                />
                                <button
                                    type='button'
                                    onClick={() => {
                                        setMenuOpen(false);
                                        logout();
                                        router.push('/');
                                    }}
                                    className='w-full rounded-[2px] px-3 py-2 text-left text-ink2 transition-colors hover:bg-surface2 hover:text-ink'
                                    style={{ font: '500 13px var(--font-sans)' }}
                                >
                                    Sign out
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <Link
                        href='/auth'
                        className='rounded-full bg-ink px-4 py-[9px] text-bg no-underline transition-transform active:scale-95'
                        style={{ font: '600 13px var(--font-sans)' }}
                    >
                        Sign in
                    </Link>
                )}
            </div>
        </div>
    );
}

function MenuItem({
    href,
    label,
    onNavigate,
}: {
    href: string;
    label: string;
    onNavigate: () => void;
}) {
    return (
        <Link
            href={href}
            onClick={onNavigate}
            className='block rounded-[2px] px-3 py-2 text-ink no-underline transition-colors hover:bg-surface2'
            style={{ font: '500 13px var(--font-sans)' }}
        >
            {label}
        </Link>
    );
}
