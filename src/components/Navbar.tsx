import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Logo from "../assets/Logo.svg";
import { NAV_LINKS } from "../constants/routes";
import Button from "./Button";
import { useSession } from "../hooks/useSession";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const session = useSession();

  return (
    <nav className="navbar flex items-center justify-between px-4 py-3 md:px-8 relative">
      {/* Logo */}
      <img src={Logo} alt="Logo" className="logo w-[120px]" />

      {/* Desktop Nav Links */}
      <div className="hidden md:flex items-center gap-6 w-full justify-center">
        {NAV_LINKS.map(({ label, path }) => (
          <Link key={label} to={path} className="nav-link">
            {label}
          </Link>
        ))}
      </div>

      {/* CTA Buttons */}
      <div className="hidden md:flex items-center gap-3">
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
        className="md:hidden p-2"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X size={28} /> : <Menu size={28} />}
      </button>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="absolute top-full left-0 w-full bg-white border-t border-gray-200 shadow-lg z-50 flex flex-col items-start p-4 gap-4 md:hidden">
          {NAV_LINKS.map(({ label, path }) => (
            <Link
              key={label}
              to={path}
              className="nav-link w-full py-2 border-b border-gray-100"
              onClick={() => setMobileOpen(false)}
            >
              {label}
            </Link>
          ))}
          <div className="w-full flex flex-col gap-2 mt-2">
            <Button variant="white" type="button" showIcon className="w-full">
              USD
            </Button>
            {session ? (
              <Link to="/dashboard" className="w-full">
                <Button variant="colored" type="button" className="w-full">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <Link to="/login" className="w-full">
                <Button variant="colored" type="button" className="w-full">
                  Log in
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
