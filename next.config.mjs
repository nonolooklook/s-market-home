/** @type {import('next').NextConfig} */
const nextConfig = {
  //      output: 'export',
  //   webpack: (config) => {
  //     config.resolve.fallback = { fs: false, net: false, tls: false }
  //     return config
  //   },
  async redirects() {
    return [
      // Basic redirect
      {
        source: '/trade',
        destination: '/trade/1',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
