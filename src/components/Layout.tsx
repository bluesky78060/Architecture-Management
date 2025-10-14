import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import {
  HomeIcon,
  DocumentTextIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
  CogIcon,
  CalculatorIcon,
  UserIcon
} from '@heroicons/react/24/outline';

interface LayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: '대시보드', href: '/', icon: HomeIcon },
  { name: '견적서 관리', href: '/estimates', icon: CalculatorIcon },
  { name: '청구서 관리', href: '/invoices', icon: DocumentTextIcon },
  { name: '건축주 관리', href: '/clients', icon: UsersIcon },
  { name: '작업 항목 관리', href: '/work-items', icon: WrenchScrewdriverIcon },
  { name: '환경설정', href: '/company-info', icon: CogIcon },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { logout } = useUser();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current !== null && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        {/* Header */}
        <div className="flex h-20 items-center justify-center px-6 bg-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <HomeIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">건축 관리 시스템</h1>
              <p className="text-gray-500 text-xs">Architecture Management</p>
            </div>
          </div>
        </div>
        
        <nav className="mt-10 px-4">
          <ul className="space-y-6">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={`
                      flex items-center px-4 py-4 text-base font-medium rounded-xl transition-all duration-200
                      ${isActive 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        
        {/* User menu */}
        <div className="absolute bottom-6 left-4 right-4" ref={menuRef}>
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex w-full items-center px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors duration-200"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                <UserIcon className="h-4 w-4 text-white" />
              </div>
              <div className="text-left flex-1">
                <div className="text-sm font-medium text-gray-900">사용자</div>
                <div className="text-xs text-gray-500">v2.0 Enhanced Edition</div>
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute bottom-full mb-2 w-full rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
                <button
                  onClick={logout}
                  className="flex w-full items-center px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <UserIcon className="mr-3 h-4 w-4 text-gray-500" />
                  로그아웃
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        <main className="py-10 px-8 lg:px-12">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
