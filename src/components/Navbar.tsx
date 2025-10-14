import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import {
  HomeIcon,
  DocumentTextIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
  CogIcon,
  CalculatorIcon,
  BuildingOffice2Icon,
  UserIcon
} from '@heroicons/react/24/outline';

const Navbar: React.FC = () => {
  const location = useLocation();
  const { currentUser, logout } = useUser();
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (menuRef.current !== null && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setShowUserMenu(false);
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const isActive = (path: string): boolean => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-screen-2xl mx-auto pl-0.5 pr-0.5">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center ml-0.5">
            <Link to="/" className="text-xl font-bold flex items-center space-x-2">
              <BuildingOffice2Icon className="h-8 w-8" />
              <span>건축 관리 시스템</span>
            </Link>
          </div>

          <div className="hidden md:block">
            <div className="ml-2 md:ml-4 lg:ml-6 flex items-baseline space-x-3 md:space-x-4 lg:space-x-6">
                <Link
                  to="/"
                  className={`px-2 md:px-3 py-2 rounded-md text-xs md:text-sm font-medium flex items-center space-x-2 ${
                    isActive('/')
                      ? 'bg-blue-700 text-white'
                      : 'text-blue-100 hover:bg-blue-500 hover:text-white'
                  }`}
                >
                  <HomeIcon className="h-5 w-5" />
                  <span>대시보드</span>
                </Link>
                <Link
                  to="/estimates"
                  className={`px-2 md:px-3 py-2 rounded-md text-xs md:text-sm font-medium flex items-center space-x-2 ${
                    isActive('/estimates')
                      ? 'bg-blue-700 text-white'
                      : 'text-blue-100 hover:bg-blue-500 hover:text-white'
                  }`}
                >
                  <CalculatorIcon className="h-5 w-5" />
                  <span>견적서 관리</span>
                </Link>
                <Link
                  to="/invoices"
                  className={`px-2 md:px-3 py-2 rounded-md text-xs md:text-sm font-medium flex items-center space-x-2 ${
                    isActive('/invoices')
                      ? 'bg-blue-700 text-white'
                      : 'text-blue-100 hover:bg-blue-500 hover:text-white'
                  }`}
                >
                  <DocumentTextIcon className="h-5 w-5" />
                  <span>청구서 관리</span>
                </Link>
                <Link
                  to="/clients"
                  className={`px-2 md:px-3 py-2 rounded-md text-xs md:text-sm font-medium flex items-center space-x-2 ${
                    isActive('/clients')
                      ? 'bg-blue-700 text-white'
                      : 'text-blue-100 hover:bg-blue-500 hover:text-white'
                  }`}
                >
                  <UsersIcon className="h-5 w-5" />
                  <span>건축주 관리</span>
                </Link>
                <Link
                  to="/work-items"
                  className={`px-2 md:px-3 py-2 rounded-md text-xs md:text-sm font-medium flex items-center space-x-2 ${
                    isActive('/work-items')
                      ? 'bg-blue-700 text-white'
                      : 'text-blue-100 hover:bg-blue-500 hover:text-white'
                  }`}
                >
                  <WrenchScrewdriverIcon className="h-5 w-5" />
                  <span>작업 항목 관리</span>
                </Link>
                <Link
                  to="/company-info"
                className={`px-2 md:px-3 py-2 rounded-md text-xs md:text-sm font-medium flex items-center space-x-2 ${
                  isActive('/company-info')
                    ? 'bg-blue-700 text-white'
                    : 'text-blue-100 hover:bg-blue-500 hover:text-white'
                }`}
                >
                  <CogIcon className="h-5 w-5" />
                  <span>환경설정</span>
                </Link>
              </div>
          </div>

          <div className="relative mr-0.5" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 px-3 py-2 rounded-md text-blue-100 hover:bg-blue-500 hover:text-white"
            >
              <UserIcon className="h-5 w-5" aria-label="사용자" />
              <span>{(currentUser?.name !== undefined && currentUser.name !== '') ? currentUser.name : currentUser?.username}</span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-50 border border-gray-200">
                <div className="py-2">
                  <div className="px-4 pb-2 text-sm text-gray-700 border-b border-gray-100">
                    <p className="font-medium">{currentUser?.name}</p>
                    <p className="text-gray-500">{currentUser?.username}</p>
                    <p className="text-xs text-gray-400 mt-1">역할: {currentUser?.role === 'admin' ? '관리자' : currentUser?.role === 'manager' ? '매니저' : '사용자'}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                  >
                    로그아웃
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;