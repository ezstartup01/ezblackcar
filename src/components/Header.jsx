import { Menu } from "lucide-react";
import { navItems, assets } from "../data/siteContent.js";

export default function Header() {
  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label="EZ Black Car home">
        <img src={assets.logo} alt="EZ Black Car" />
      </a>
      <nav className="desktop-nav" aria-label="Primary navigation">
        {navItems.map((item, index) => (
          <a className={index === 0 ? "active" : ""} key={item.label} href={item.href}>
            {item.label}
          </a>
        ))}
      </nav>
      <a className="header-book" href="#quote-form">
        Book a Ride
      </a>
      <button className="icon-button mobile-menu" aria-label="Open navigation menu">
        <Menu size={22} aria-hidden="true" />
      </button>
    </header>
  );
}
