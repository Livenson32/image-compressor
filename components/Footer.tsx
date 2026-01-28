import React, {memo} from 'react';

/**
 * FOOTER (not really)
 *
 * Contains the credit links and the decorative wave dividers at the bottom of the page.
 * We use `memo` here because the footer never changes, so React can skip re-rendering it.
 */
export const Footer = memo(() => {
  return (
    <div className="relative mt-auto">
      <div className="absolute bottom-full left-0 w-full overflow-hidden leading-none translate-y-1 z-0 pointer-events-none">
        <svg
          className="relative block w-[calc(100%+1.3px)] h-[80px] md:h-[150px] opacity-40 text-gleam-pink"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V95.8C1132.19,118.92,1055.71,111.31,985.66,92.83Z"
            fill="currentColor"
          ></path>
        </svg>
      </div>

      <div className="absolute bottom-full left-0 w-full overflow-hidden leading-none translate-y-[2px] z-0 pointer-events-none">
        <svg
          className="relative block w-[calc(100%+1.3px)] h-[60px] md:h-[120px] text-gleam-dark"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
            fill="currentColor"
          ></path>
        </svg>
      </div>

      {/* Links */}
      <footer className="bg-gleam-dark text-gleam-cream pt-8 pb-12 relative z-20">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="text-xs md:text-sm font-medium uppercase tracking-widest leading-loose text-white/40 cursor-default">
            <span className="block mb-4 text-[10px] md:text-xs opacity-60">
              Powered by Open Source
            </span>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              <a
                href="https://github.com/shssoichiro/oxipng"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gleam-pink transition-colors"
              >
                OxiPNG
              </a>
              <a
                href="https://github.com/mozilla/mozjpeg"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gleam-pink transition-colors"
              >
                MozJPEG
              </a>
              <a
                href="https://developers.google.com/speed/webp"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gleam-pink transition-colors"
              >
                WebP
              </a>
              <a
                href="https://github.com/AOMediaCodec/libavif"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gleam-pink transition-colors"
              >
                AVIF
              </a>
              <a
                href="https://github.com/libjxl/libjxl"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gleam-pink transition-colors"
              >
                JPEG XL
              </a>
              <a
                href="https://github.com/phoboslab/qoi"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gleam-pink transition-colors"
              >
                QOI
              </a>
              <a
                href="https://github.com/nodeca/pica"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gleam-pink transition-colors"
              >
                Pica
              </a>
              <a
                href="https://github.com/ibezkrovnyi/image-quantization"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gleam-pink transition-colors"
              >
                Image-Q
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
});
