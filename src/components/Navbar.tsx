import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Logo from "../assets/Logo.svg";
import { NAV_LINKS } from "../constants/routes";
import Button from "./Button";
import { useSession } from "../hooks/useSession";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const session = useSession();

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (mobileOpen && !target.closest('.mobile-menu-container')) {
        setMobileOpen(false);
      }
    };

    if (mobileOpen) {
      document.addEventListener('click', handleClickOutside);
      document.body.style.overflow = 'hidden'; // Prevent scroll when menu is open
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const handleLinkClick = () => {
    setMobileOpen(false);
  };

  return (
    <>
      <nav 
        className={`navbar fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled 
            ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100' 
            : 'bg-white'
        } flex items-center justify-between px-4 py-3 md:px-8`}
      >
        {/* Logo */}
        <Link to="/" className="flex-shrink-0">
          <img 
            src={Logo} 
            alt="Logo" 
            className="logo w-[100px] sm:w-[120px] transition-all duration-200 hover:scale-105" 
          />
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden lg:flex items-center gap-8 absolute left-1/2 transform -translate-x-1/2">
          {NAV_LINKS.map(({ label, path }) => (
            <Link 
              key={label} 
              to={path} 
              className="nav-link relative py-2 transition-all duration-200 hover:scale-105 font-medium text-gray-700 hover:text-gray-900"
            >
              {label}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-current transition-all duration-300 group-hover:w-full"></span>
            </Link>
          ))}
        </div>

        {/* Desktop CTA Buttons */}
        <div className="hidden lg:flex items-center gap-3">
          <Button variant="white" type="button" showIcon>
            USD
          </Button>
          {session ? (
            <Link to="/dashboard">
              <Button variant="colored" type="button">
                Dashboard
              </Button>
            </Link>
          ) : (
            <Link to="/login">
              <Button variant="colored" type="button">
                Log in
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden p-2 rounded-lg transition-all duration-200 hover:bg-gray-100 active:scale-95 mobile-menu-container"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          <div className="relative w-6 h-6">
            <Menu 
              size={24} 
              className={`absolute inset-0 transition-all duration-300 ${
                mobileOpen ? 'rotate-90 opacity-0' : 'rotate-0 opacity-100'
              }`}
            />
            <X 
              size={24} 
              className={`absolute inset-0 transition-all duration-300 ${
                mobileOpen ? 'rotate-0 opacity-100' : 'rotate-90 opacity-0'
              }`}
            />
          </div>
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      <div 
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-50 lg:hidden transition-all duration-300 ${
          mobileOpen 
            ? 'opacity-100 pointer-events-auto' 
            : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Mobile App-Style Navigation */}
      <div 
        className={`mobile-menu-container fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-50 lg:hidden transform transition-all duration-300 ease-out ${
          mobileOpen 
            ? 'translate-x-0' 
            : 'translate-x-full'
        }`}
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <img src={Logo} alt="Logo" className="w-[100px]" />
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        {/* Mobile Navigation Links */}
        <div className="flex flex-col px-6 py-4">
          <div className="space-y-1">
            {NAV_LINKS.map(({ label, path }) => (
              <Link
                key={label}
                to={path}
                className="nav-link block px-4 py-3 rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200 font-medium"
                onClick={handleLinkClick}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Mobile Actions */}
          <div className="mt-8 space-y-3">
            <Button 
              variant="white" 
              type="button" 
              showIcon 
              className="w-full justify-center"
            >
              USD
            </Button>
            
            {session ? (
              <Link to="/dashboard" className="block" onClick={handleLinkClick}>
                <Button 
                  variant="colored" 
                  type="button" 
                  className="w-full justify-center"
                >
                  Dashboard
                </Button>
              </Link>
            ) : (
              <Link to="/login" className="block" onClick={handleLinkClick}>
                <Button 
                  variant="colored" 
                  type="button" 
                  className="w-full justify-center"
                >
                  Log in
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Footer (Optional) */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-100 bg-gray-50">
          <p className="text-sm text-gray-500 text-center">
            © 2024 Your Company
          </p>
        </div>
      </div>

      {/* Spacer to prevent content overlap */}
      <div className="h-16 sm:h-20"></div>
    </>
  );
};

export default Navbar;