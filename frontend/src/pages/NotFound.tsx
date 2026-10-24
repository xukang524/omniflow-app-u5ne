import { Link } from 'react-router-dom';
import AppNavbar from '@/components/custom/AppNavbar';

const NotFound = () => (
  <div className="zb-theme flex min-h-screen flex-col">
    <AppNavbar />
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-5xl font-bold">404</p>
      <p className="text-sm text-muted-foreground">你访问的页面不存在</p>
      <Link to="/" className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-white hover:opacity-90">
        返回工作台
      </Link>
    </main>
  </div>
);

export default NotFound;
