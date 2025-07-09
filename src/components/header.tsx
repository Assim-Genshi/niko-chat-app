//src/components/header.tsx
import { Link } from '@heroui/react';
import Logo from './Logo';
import {
  XMarkIcon,
  Bars2Icon
} from "@heroicons/react/24/solid";
import { Button } from '@heroui/react';
import { ThemeToggle } from './ThemeSwitcher';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import User from './user';


const menuItems = [
  { name: 'Features', href: '#features' },
  { name: 'Solution', href: '#solution' },
  { name: 'Pricing', href: '#pricing' },
  { name: 'About', href: '#about' },
];

export const HeroHeader = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => setMenuOpen(prev => !prev);

  return (
    <header>
      <nav className="fixed z-20 w-full px-2">
        <div className={cn('mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12', isScrolled && 'bg-background/50 rounded-2xl border backdrop-blur-lg')}>
          <div className="relative flex flex-wrap items-center justify-between py-3 lg:py-4">
            
            {/* Logo + Mobile menu toggle */}
            <div className="flex w-full justify-between items-center lg:w-auto">
              <Link href="/" aria-label="home" className="flex items-center space-x-2">
                <Logo className='text-brand-500' />
              </Link>

              <Button
                onPress={toggleMenu}
                isIconOnly
                aria-label={menuOpen ? 'Close Menu' : 'Open Menu'}
                className="relative z-20 block lg:hidden bg-transparent"
              >
                {!menuOpen ? (
                  <Bars2Icon className="" />
                ) : (
                  <XMarkIcon className="" />
                )}
              </Button>
            </div>

            {/* Desktop menu */}
            <div className="hidden lg:block">
              <ul className="flex gap-8 text-sm">
                {menuItems.map((item, index) => (
                  <li key={index}>
                    <Link
                      href={item.href}
                      className="text-muted-foreground hover:text-accent-foreground duration-150"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right controls */}
            <div className={cn(
              'bg-background border shadow-2xl dark:shadow-none lg:shadow-none lg:border-transparent lg:bg-transparent p-6 rounded-3xl space-y-6 lg:space-y-0 lg:p-0 lg:flex-row lg:flex lg:items-center lg:gap-6',
              menuOpen ? 'block w-full mt-6 lg:w-fit' : 'hidden lg:flex'
            )}>
              {/* Mobile menu */}
              <div className="lg:hidden">
                <ul className="space-y-6 text-base">
                  {menuItems.map((item, index) => (
                    <li key={index}>
                      <Link
                        href={item.href}
                        className="text-muted-foreground hover:text-accent-foreground duration-150"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Auth Controls */}
              <div className="flex flex-col w-full gap-3 sm:flex-row sm:w-fit">
                <ThemeToggle />
                {!session ? (
                  <>
                    <Button  variant="bordered" className="border-brand-500 text-brand-500" size="md" onPress={() => navigate('/login')}>
                      Login
                    </Button>
                    <Button  className='bg-brand-500 text-base-100' variant="solid" size="md" onPress={() => navigate('/signup')}>
                      Sign up
                    </Button>
                  </>
                ) : (
                  <>
                    {/* Replace with your actual User component */}
                    <div className="flex items-center gap-2"> 
                      <User />
                    </div>
                    
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};
