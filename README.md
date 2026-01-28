<p align="center">[IN DEVELOPMENT]<br />Image optimizer website using jSquash WebAssembly similar to squoosh</b></p><p align="center"><img src="https://wsrv.nl/?url=raw.githubusercontent.com/Sethispr/image-compressor/main/assets/IMG_7503.jpeg" alt="img-compress web preview" height="500">
</p>

# [img-compress](https://img-compress.pages.dev/) (LIVE DEMO)

<https://img-compress.pages.dev/>

Img-compress is a fast, privacy-first image compressor that uses WebAssembly (wasm) to give near native compression speeds all in your browser. By using local client side processing, it bypasses traditional upload limits and data privacy concerns while giving you a highly customizable toolkit (img resizing, color reduction, lossless options, batch file renaming, etc).

Website design inspired by [Gleam](https://gleam.run)

## Image Queue

Unlimited image compression queue and can support processing 10+ images all at the same time concurrently

<p align="center"><img src="https://wsrv.nl/?url=raw.githubusercontent.com/Sethispr/image-compressor/main/assets/IMG_7505.jpeg" alt="img-compress web preview" height="500"></p>

## Image Comparison

Mobile friendly image comparison side by side with original and compressed image to check quality changes

<p align="center"><img src="https://wsrv.nl/?url=raw.githubusercontent.com/Sethispr/image-compressor/main/assets/IMG_7517.jpeg" alt="img-compress web preview" height="635"></p>

---

### Prerequisites

This project requires **Node.js** to manage dependencies and run the development server.

1. **Download:** Visit [nodejs.org](https://nodejs.org/) and download the "LTS" version (Recommended for most users).
2. **Install:** Run the installer and follow the setup steps for your OS.
3. **Verify:** Open your terminal or command prompt and type:
`node -v`

*If a version number (v20.x.x etc) appears, you’re good to go!*

---

### Development Setup

This project uses Vite + React and WebAssembly (wasm) provided by [jSquash](https://www.npmjs.com/search?q=jsquash), their codecs are from the [Squoosh](https://github.com/GoogleChromeLabs/squoosh) app.

Follow these steps to get the project running locally:

1. **Clone the Repo**
```bash
git clone https://github.com/Sethispr/image-compressor.git

```


2. **Change Directory**
```bash
cd image-compressor

```


3. **Install Dependencies**
```bash
npm install

```


4. **Run Development Server**
```bash
npm run dev

```

*Once the server starts, click the local link shown in your terminal (usually `http://localhost:5173`) to view the site live.*

More info on contributing is available [here](https://github.com/Sethispr/image-compressor?tab=contributing-ov-file)
