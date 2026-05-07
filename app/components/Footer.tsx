import Link from 'next/link';
import { Phone, Mail, MapPin, Facebook, Instagram, Youtube } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    catalog: [
      { label: 'Prayer Books', href: '/catalog?category=prayer-books' },
      { label: 'Liturgical Books', href: '/catalog?category=liturgical' },
      { label: 'Lives of Saints', href: '/catalog?category=saints' },
      { label: 'Theology', href: '/catalog?category=theology' },
      { label: 'Children\'s Books', href: '/catalog?category=children' },
    ],
    info: [
      { label: 'About Us', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'Shipping Info', href: '/shipping' },
      { label: 'Returns', href: '/returns' },
      { label: 'FAQ', href: '/faq' },
    ],
  };

  return (
    <footer className="bg-burgundy text-parchment border-t-2 border-gold/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Logo & Description */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 relative">
                <img
                  src="/images/church_logo.jpg"
                  alt="Church Bookstore"
                  className="w-full h-full object-contain rounded"
                />
              </div>
              <span className="text-lg font-bold font-display">Orthodox Bookstore</span>
            </div>
            <p className="text-parchment/70 text-sm leading-relaxed">
              Providing Orthodox Christians with quality books, icons, and religious 
              items to support their spiritual journey and growth in faith.
            </p>
          </div>

          {/* Catalog Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Catalog</h3>
            <ul className="space-y-2">
              {footerLinks.catalog.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-parchment/70 hover:text-gold transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Information Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Information</h3>
            <ul className="space-y-2">
              {footerLinks.info.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-parchment/70 hover:text-gold transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                <span className="text-parchment/70 text-sm">+1 (555) 123-4567</span>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                <span className="text-parchment/70 text-sm">info@orthodoxbooks.org</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                <span className="text-parchment/70 text-sm">
                  123 Church Street<br />
                  Holy City, HC 12345
                </span>
              </li>
            </ul>

            {/* Social Links */}
            <div className="flex gap-3 mt-6">
              <a
                href="#"
                className="w-10 h-10 bg-parchment/10 rounded-full flex items-center justify-center hover:bg-gold hover:text-burgundy transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-parchment/10 rounded-full flex items-center justify-center hover:bg-gold hover:text-burgundy transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-parchment/10 rounded-full flex items-center justify-center hover:bg-gold hover:text-burgundy transition-colors"
              >
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-parchment/10 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-parchment/50 text-sm">
              © {currentYear} Orthodox Church Bookstore. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link href="/privacy" className="text-parchment/50 hover:text-gold text-sm transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-parchment/50 hover:text-gold text-sm transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
