export default {
  title: "vite-plugin-seo-meta",
  url: "https://nellowtcs.me/vite-plugin-seo-meta/",
  src: "docs",
  out: "site",
  logo: {
    alt: "vite-plugin-seo-meta",
    href: "./",
  },
  favicon: "",
  theme: {
    name: "sky",
    codeHighlight: true,
    copyWidgets: {
      enabled: true,
      raw: true,
      context: true,
    },
    appearance: "system",
  },
  plugins: {
    search: {
      semantic: true,
      showConfidence: true,
    },
    seo: {
      defaultDescription:
        "All-in-one Vite plugin that generates meta tags, canonical, Open Graph, Twitter Cards, JSON-LD, hreflang, robots.txt and sitemap.xml for your app.",
      openGraph: {
        defaultImage: "",
      },
      twitter: {
        cardType: "summary_large_image",
      },
    },
    sitemap: {
      defaultChangefreq: "weekly",
      defaultPriority: 0.8,
    },
    llms: {
      fullContext: true,
    },
    git: {},
  },
  search: true,
  minify: true,
  autoTitleFromH1: true,
  copyCode: true,
  pageNavigation: true,
  navigation: [
    {
      title: "Home",
      path: "/",
      icon: "home",
    },
    {
      title: "Getting Started",
      icon: "rocket",
      collapsible: false,
      children: [
        {
          title: "Installation",
          path: "/getting-started/installation",
          icon: "download",
        },
        {
          title: "Quick Start",
          path: "/getting-started/quickstart",
          icon: "play",
        },
        {
          title: "Configuration",
          path: "/getting-started/configuration",
          icon: "sliders",
        },
      ],
    },
    {
      title: "Guide",
      icon: "book-open",
      collapsible: false,
      children: [
        {
          title: "Meta Tags",
          path: "/guide/meta-tags",
          icon: "tag",
        },
        {
          title: "Open Graph",
          path: "/guide/open-graph",
          icon: "globe",
        },
        {
          title: "Twitter Cards",
          path: "/guide/twitter",
          icon: "bird",
        },
        {
          title: "JSON-LD",
          path: "/guide/json-ld",
          icon: "braces",
        },
        {
          title: "hreflang",
          path: "/guide/hreflang",
          icon: "languages",
        },
        {
          title: "robots.txt",
          path: "/guide/robots",
          icon: "shield",
        },
        {
          title: "Sitemap",
          path: "/guide/sitemap",
          icon: "map",
        },
        {
          title: "SPA Runtime",
          path: "/guide/spa-runtime",
          icon: "refresh-cw",
        },
        {
          title: "Validation",
          path: "/guide/validation",
          icon: "check-circle",
        },
      ],
    },
    {
      title: "API Reference",
      icon: "code",
      collapsible: false,
      children: [
        {
          title: "API",
          path: "/api/",
          icon: "book",
        },
        {
          title: "Config Reference",
          path: "/reference/config",
          icon: "file-text",
        },
      ],
    },
    {
      title: "Live Demo",
      path: "/demo/",
      icon: "monitor",
      external: true,
    },
    {
      title: "GitHub",
      path: "https://github.com/NellowTCS/vite-plugin-seo-meta",
      icon: "github",
      external: true,
    },
  ],
  footer:
    "Built with [docmd](https://docmd.io). [View on GitHub](https://github.com/NellowTCS/vite-plugin-seo-meta).",
  editLink: {
    enabled: true,
    baseUrl: "https://github.com/NellowTCS/vite-plugin-seo-meta/edit/main/",
    text: "Edit this page",
  },
};
