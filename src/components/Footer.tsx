import { animations } from '@/data/animations';

export default function Footer() {
  return (
    <footer className="h-8 border-t border-border flex items-center justify-between px-4 text-dim text-xs bg-bg shrink-0">
      <div>
        {"// "}built by <a href="#" className="hover:text-accent transition-colors">makers</a> for makers
      </div>
      <div className="hidden sm:block">
        {"// "}{animations.length} animations · updated 2026-04-12
      </div>
    </footer>
  );
}
