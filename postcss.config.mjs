/** @type {import('postcss-load-config').Config} */
const config = {
  plugins:
    process.cwd().includes('psycho')
      ? {}
      : { tailwindcss: {} },
};

export default config;
