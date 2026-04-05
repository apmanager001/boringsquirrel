import type {
  AnchorHTMLAttributes,
  HTMLAttributes,
  ImgHTMLAttributes,
} from "react";
import Link from "next/link";
import type { MDXComponents } from "mdx/types";
import { Callout } from "@/components/mdx/callout";
import { HoverTips } from "@/components/mdx/hoverTips";

function MdxLink({
  href = "",
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  if (href.startsWith("/")) {
    return (
      <Link href={href} className="font-semibold text-primary" {...props}>
        {children}
      </Link>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="font-semibold text-primary"
      {...props}
    >
      {children}
    </a>
  );
}

function MdxImage({ alt = "", ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img alt={alt} loading="lazy" {...props} />;
}

function MdxBlockquote({
  children,
  ...props
}: HTMLAttributes<HTMLQuoteElement>) {
  return <blockquote {...props}>{children}</blockquote>;
}

const components: MDXComponents = {
  a: MdxLink,
  img: MdxImage,
  blockquote: MdxBlockquote,
  Callout,
  HoverTips,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
