'use client';

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, X, User, LogOut } from 'lucide-react';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

function Navbar() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const checkAuth = () => {
      if (typeof window !== 'undefined') {
        const userId = localStorage.getItem('userId');
        const storedUsername = localStorage.getItem('username');

        if (userId) {
          setIsLoggedIn(true);
          setUsername(storedUsername || 'User');
        } else {
          setIsLoggedIn(false);
          setUsername('');
        }
      }
    };

    checkAuth();
    window.addEventListener('storage', checkAuth);
    window.addEventListener('authChange', checkAuth);

    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('authChange', checkAuth);
    };
  }, []);

  const navLinks = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Analysis', href: '/analysis' },
    { name: 'AI Insights', href: '/admin' },
    { name: 'Tasks', href: '/tasks' },
    ...(isAdmin ? [{ name: 'Admin', href: '/admin' }] : []),
    { name: 'Leaderboard', href: '/Leaderboard' },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    setUsername('');
    router.push('/');
  };

  return (
    <>
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'glass-nav shadow-sm py-2' : 'bg-transparent py-4'
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">

            <Link href="" className="flex items-center space-x-2 group">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg group-hover:shadow-blue-500/30 transition-all duration-300 group-hover:scale-105">
                FY
              </div>
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300">
                FutureYou
              </span>
            </Link>

            <div className="hidden md:flex md:items-center md:space-x-1">
              {isLoggedIn ? (
                <>
                  {navLinks.map((link) => (
                    <Link
                      key={link.name}
                      href={link.href}
                      className="relative px-4 py-2 text-sm font-medium text-gray-600 transition-all duration-300 hover:text-blue-600 group"
                    >
                      {link.name}
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-500 transition-all duration-300 group-hover:w-full opacity-0 group-hover:opacity-100" />
                    </Link>
                  ))}
                </>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    href="/login"
                    className="px-5 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors duration-300"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 transition-all duration-300"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>

            {isLoggedIn && (
              <div className="hidden md:flex md:items-center md:space-x-4">
                <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
                  <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                    <User className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-semibold text-blue-900">{username}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-300"
                    title="Logout"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={toggleMobileMenu}
              className="rounded-lg p-2 text-gray-600 transition-all duration-300 hover:bg-gray-100 md:hidden"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={toggleMobileMenu}
      />

      {/* Mobile Menu Sidebar */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-out md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-gray-100 px-6">
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            FutureYou
          </span>
          <button
            onClick={toggleMobileMenu}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col p-4 space-y-2">
          {isLoggedIn ? (
            <>
              <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Signed in as</p>
                    <p className="font-semibold text-gray-900">{username}</p>
                  </div>
                </div>
              </div>
              
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={toggleMobileMenu}
                  className="flex items-center px-4 py-3 rounded-xl text-gray-600 font-medium hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
                >
                  {link.name}
                </Link>
              ))}
              
              <div className="mt-auto pt-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    handleLogout();
                    toggleMobileMenu();
                  }}
                  className="flex w-full items-center space-x-2 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-200"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-3 mt-4">
              <Link
                href="/register"
                onClick={toggleMobileMenu}
                className="flex items-center justify-center w-full px-4 py-3 text-white bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl font-semibold shadow-lg shadow-blue-500/30 active:scale-95 transition-all duration-200"
              >
                Get Started
              </Link>
              <Link
                href="/login"
                onClick={toggleMobileMenu}
                className="flex items-center justify-center w-full px-4 py-3 text-gray-700 bg-white border border-gray-200 rounded-xl font-semibold hover:bg-gray-50 active:scale-95 transition-all duration-200"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Navbar />
        <div className="pt-16">
          {children}
        </div>
      </body>
    </html>
  );
}