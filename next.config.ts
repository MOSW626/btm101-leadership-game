import type { NextConfig } from "next";

// cacheComponents is off on purpose: it keeps visited pages alive with their old
// state, so an edited answer set was shown but never re-saved.
const nextConfig: NextConfig = {};

export default nextConfig;
