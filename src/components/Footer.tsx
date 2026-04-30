import Link from 'next/link';
import { animations } from '@/data/animations';

const GITHUB_URL = 'https://github.com/ImpulseTechy/pixbyte';

export default function Footer() {
  return (
    <footer className="border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-2 text-dim text-xs bg-bg shrink-0 gap-1 sm:gap-4">
      <div>
        {"// "}built by{' '}
        <Link href="/about" className="hover:text-accent transition-colors">
          makers
        </Link>{' '}
        for makers
      </div>
      <div className="hidden md:block">
        {"// "}open source · MIT · contributions welcome →{' '}
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noreferrer"
          className="hover:text-accent transition-colors"
        >
          github
        </a>
      </div>
      <div>
        {"// "}{animations.length} animations · updated 2026-04-12
      </div>
    </footer>
  );
}
