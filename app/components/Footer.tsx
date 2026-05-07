import { Phone, Mail, MapPin, Download } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-burgundy text-parchment border-t-2 border-gold/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 md:py-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-5 lg:gap-8">
          {/* Contact Info — phone & email on row 1, address on row 2 */}
          <div className="flex flex-col gap-1.5 text-sm">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-gold flex-shrink-0" />
                <span className="text-white/90">+852 3585 8767</span>
              </span>
              <span className="hidden sm:inline text-parchment/30">·</span>
              <a href="mailto:bookshop@orthodoxbookshop.asia" className="flex items-center gap-1.5 hover:text-gold transition-colors">
                <Mail className="w-3.5 h-3.5 text-gold flex-shrink-0" />
                <span className="text-white/90">bookshop@orthodoxbookshop.asia</span>
              </a>
            </div>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-gold flex-shrink-0" />
              <span className="text-white/90">12/F, Lee Fung Commercial Building, 32-36 Des Voeux Rd W, Sheung Wan, Hong Kong</span>
            </span>
          </div>

          {/* Spacer pushes app buttons to the right on desktop */}
          <div className="hidden lg:block flex-1" />

          {/* App Store buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* App Store */}
            <a
              href="https://itunes.apple.com/us/app/orthodox-christian-library/id1105252815?ls=1&mt=8"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-black/30 border border-parchment/20 rounded-md hover:border-gold/60 hover:bg-black/40 transition-colors whitespace-nowrap"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current flex-shrink-0" aria-hidden="true">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              <span className="text-left leading-tight">
                <small className="font-light block text-[9px] text-parchment/60">Available on the</small>
                <span className="text-xs font-medium">App Store</span>
              </span>
            </a>

            {/* Google Play */}
            <a
              href="https://play.google.com/store/apps/details?id=com.rlc.bookshop"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-black/30 border border-parchment/20 rounded-md hover:border-gold/60 hover:bg-black/40 transition-colors whitespace-nowrap"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" aria-hidden="true">
                <path d="M3.18 23.49c-.34-.17-.54-.49-.54-.87V1.38c0-.38.2-.7.54-.87l11.83 11.49L3.18 23.49z" fill="#4CAF50" />
                <path d="M15.01 12L3.18 23.49c.09-.05.18-.09.27-.12L15.8 13.25 15.01 12z" fill="#F44336" />
                <path d="M20.16 10.81l-2.86-1.65-2.29 2.84 2.29 2.84 2.86-1.65c.54-.31.54-1.07 0-1.38z" fill="#FFC107" />
                <path d="M3.45.51c.12-.02.24-.01.36.04l12.35 7.13L15.01 12 3.18.51c.09-.03.18-.03.27 0z" fill="#2196F3" />
                <path d="M3.45 23.49l12.35-7.13L15.01 12 3.18 23.49c.09.03.18.03.27 0z" fill="#F44336" />
              </svg>
              <span className="text-left leading-tight">
                <small className="font-light block text-[9px] text-parchment/60">Get it on</small>
                <span className="text-xs font-medium">Google Play</span>
              </span>
            </a>

            {/* Direct APK Download */}
            <a
              href="https://filedn.com/lUdNcEH0czFSe8uSnCeo29F/apks/bookshop-3.1.2.apk"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-black/30 border border-parchment/20 rounded-md hover:border-gold/60 hover:bg-black/40 transition-colors whitespace-nowrap"
            >
              <Download className="w-4 h-4 text-parchment/70 flex-shrink-0" />
              <span className="text-left leading-tight">
                <small className="font-light block text-[9px] text-parchment/60">Download</small>
                <span className="text-xs font-medium">APK for Android</span>
              </span>
            </a>

          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-parchment/10 mt-4 pt-3">
          <p className="text-parchment/40 text-xs text-center">
            © {currentYear} Orthodox Brotherhood of Apostles Saints Peter and Paul
          </p>
        </div>
      </div>
    </footer>
  );
}
