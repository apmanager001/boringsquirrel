import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Boring Squirrel",
    short_name: "Boring Squirrel",
    description:
      "SEO-first browser games, puzzle prototypes, and blog posts about playful web building.",
    start_url: "/",
    display: "standalone",
    background_color: "#a7de83",
    theme_color: "#a7de83",
    icons: [
      {
        src: "/squirrelglasses.webp",
        sizes: "1024x1024",
        type: "image/webp",
      },
    ],
  };
}
