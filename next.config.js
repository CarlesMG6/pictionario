module.exports = {
  // Permite compilar sin pisar el `.next` del servidor de desarrollo, que se
  // corrompe si ambos escriben a la vez:
  //   NEXT_DIST_DIR=.next-build npm run build
  distDir: process.env.NEXT_DIST_DIR || '.next',
  eslint: {
    ignoreDuringBuilds: true,
  },
};
