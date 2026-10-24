import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Target = 'chat-input' | 'models';

export default function AppNavbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const goTo = (target: Target) => {
    const run = () => {
      const el = document.getElementById(target);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (target === 'chat-input') (el as HTMLTextAreaElement | null)?.focus();
    };
    if (location.pathname === '/') {
      run();
    } else {
      navigate('/');
      setTimeout(run, 200);
    }
  };

  const linkBase = 'text-sm transition-colors cursor-pointer whitespace-nowrap py-3 md:py-1';
  const idle = 'text-muted-foreground hover:text-primary';
  const active = 'text-primary font-medium';
  const isHome = location.pathname === '/';
  const isAdmin = location.pathname === '/admin';

  const links = (
    <>
      <Link to="/" aria-current={isHome ? 'page' : undefined} className={cn(linkBase, isHome ? active : idle)}>
        工作台
      </Link>
      <a
        href="#/"
        className={cn(linkBase, idle)}
        onClick={(e) => {
          e.preventDefault();
          goTo('models');
        }}
      >
        模型广场
      </a>
      <a
        href="#/"
        data-omniflow-feature-status="unbuilt"
        className={cn(linkBase, idle)}
        onClick={(e) => {
          e.preventDefault();
          toast.info('历史记录功能即将上线');
        }}
      >
        历史记录
      </a>
      <Link to="/admin" aria-current={isAdmin ? 'page' : undefined} className={cn(linkBase, isAdmin ? active : idle)}>
        管理后台
      </Link>
    </>
  );

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-screen-xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary">
            <span className="font-bold text-white">智</span>
          </div>
          <span className="text-lg font-bold tracking-tight sm:text-xl">智辨AI汇</span>
        </Link>
        <div className="hidden items-center gap-6 md:flex">{links}</div>
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            type="button"
            data-omniflow-feature-status="unbuilt"
            onClick={() => toast.info('登录功能即将上线,目前可直接使用')}
            className="min-h-[40px] cursor-pointer rounded-full border border-border px-4 py-2 text-sm font-medium transition-all hover:bg-card"
          >
            登录
          </button>
          <button
            type="button"
            onClick={() => goTo('chat-input')}
            className="cursor-pointer rounded-full bg-primary px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-500/20 transition-all hover:opacity-90"
          >
            开始体验
          </button>
        </div>
      </div>
      <div className="no-scrollbar flex items-center gap-6 overflow-x-auto border-t border-border px-4 md:hidden">{links}</div>
    </nav>
  );
}
