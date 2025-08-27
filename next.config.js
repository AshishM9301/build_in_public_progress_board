/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
    images: {
        remotePatterns: [
            // S3 bucket patterns
            {
                protocol: 'https',
                hostname: '*.s3.amazonaws.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: '*.s3.*.amazonaws.com',
                port: '',
                pathname: '/**',
            },
            // Allow local development images
            {
                protocol: 'http',
                hostname: 'localhost',
                port: '3000',
                pathname: '/**',
            },
            // Allow data URLs for clipboard images (temporary preview)

        ],
    },
};

export default config;
