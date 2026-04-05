import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [
      "remark-frontmatter",
      "remark-mdx-frontmatter",
      "remark-gfm",
    ],
    rehypePlugins: [],
  },
});

const nextConfig: NextConfig = {
  output: "standalone",
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  serverExternalPackages: ["nodemailer"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
    ],
  },
};

export default withMDX(nextConfig);
