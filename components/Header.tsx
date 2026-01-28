import React from 'react';

export const Header: React.FC = () => {
  return (
    <div className="relative text-gleam-dark dark:text-white overflow-hidden">
      {/* Main Content */}
      <div className="bg-gleam-pink pt-6 pb-12 text-center relative z-10 px-4">
        <div className="relative z-10 flex flex-col items-center">
          {/* Title Container */}
          <div className="relative z-20 select-none flex flex-col items-center w-full">
            <h1 className="font-display font-black tracking-tighter leading-none flex flex-row flex-wrap justify-center items-center gap-2 sm:gap-4 w-full max-w-[100vw]">
              <span
                className="relative inline-block text-5xl min-[400px]:text-6xl sm:text-7xl md:text-8xl lg:text-9xl text-gleam-dark"
                style={{
                  textShadow: '0 2px 10px rgba(0,0,0,0.05)',
                }}
              >
                Img
              </span>

              <span
                className="relative inline-flex items-center justify-center h-fit px-3 py-1.5 sm:px-6 sm:py-3 md:px-8 md:py-4 bg-gleam-dark text-white rounded-[1rem] sm:rounded-[2rem] -rotate-3 shadow-[3px_3px_0px_#fff] sm:shadow-[6px_6px_0px_#fff] border-[3px] sm:border-[5px] border-white transform hover:rotate-0 transition-transform duration-300"
                style={{textShadow: 'none'}}
              >
                <span className="text-2xl min-[400px]:text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black lowercase tracking-tighter leading-none block mb-0.5 sm:mb-1">
                  Compress
                </span>
              </span>
            </h1>

            <div className="mt-6 max-w-3xl mx-auto space-y-2 px-2">
              <h2 className="text-xl md:text-2xl font-black text-gleam-dark tracking-tight">
                The Ultimate Universal Image Tool.
              </h2>
              <p className="text-base md:text-lg font-bold text-gleam-dark/70 leading-relaxed tracking-tight">
                Free, unlimited, privacy-first. Batch compress & convert images
                offline on your device.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 -mt-[1px] w-full overflow-hidden leading-none">
        <svg
          className="block w-[calc(100%+1.3px)] h-[50px] md:h-[100px] text-gleam-pink fill-current"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
        </svg>
      </div>
    </div>
  );
};
