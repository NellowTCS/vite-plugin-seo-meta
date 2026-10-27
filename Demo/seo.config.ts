import { defineSeoConfig } from "vite-plugin-seo-meta";

export default defineSeoConfig({
  /**
   * Site Configuration
   *
   * Site-wide defaults. Everything here can be overridden per-page.
   * url is required.
   */
  site: {
    /**
     * Canonical (aka absolute) origin
     *  - Must be http/https
     *  - Trailing slash is stripped.
     *  - Paths are resolved against this URL
     */
    url: "https://nellowtcs.me/vite-plugin-seo-meta/demo",

    /**
     * Site name. Feeds og:site_name, <meta name="application-name">, and WebSite JSON-LD! We redefine them to show that you can.
     */
    name: "vite-plugin-seo-meta config generator",

    /**
     * Default document title for pages without their own title.
     */
    title: "vite-plugin-seo-meta config generator",

    /**
     * Title template applied to page titles. %s is replaced with the page title.
     * Can also be a function in general usage, but string is shown here for ease of demonstration
     */
    titleTemplate: "%s | vite-plugin-seo-meta config generator",

    /**
     * Default meta description.
     */
    description:
      "Config generator for vite-plugin-seo-meta. Generate a typed SEO config from a form covering meta tags, Open Graph, Twitter Cards, JSON-LD, favicon icons, robots.txt and sitemap.xml.",

    /**
     * Default social share image. Paths resolved to absolute URLs.
     */
    image: "https://nellowtcs.me/vite-plugin-seo-meta/demo/og-image.png",
    imageAlt: "vite-plugin-seo-meta: All-in-one Vite SEO plugin",

    /**
     * Twitter values. Can be a bare @handle string (shorthand for twitter:site)
     * or a full TwitterInfo object.
     */
    twitter: {
      /**
       * Card layout. Options: summary, summary_large_image, app, player
       */
      card: "summary_large_image",
      /**
       * Site's @handle (twitter:site)
       */
      site: "@NellowTCS",
      /**
       * Site's numeric Twitter ID (alternative to site)
       */
      siteId: "1234567890",
      /**
       * Content author's @handle (twitter:creator)
       */
      creator: "@NellowTCS",
      /**
       * Creator's numeric Twitter ID (alternative to creator)
       */
      creatorId: "0987654321",
      /**
       * Image for Twitter card (falls back to site.image)
       */
      image: "https://nellowtcs.me/vite-plugin-seo-meta/demo/twitter-image.png",
      /**
       * Alt text for the card image (max 420 chars)
       */
      imageAlt: "vite-plugin-seo-meta Twitter Card image",
      /**
       * Card image dimensions
       */
      imageWidth: 1200,
      imageHeight: 630,
      /**
       * Summary Card labels/values (opt-in)
       */
      label1: "Category",
      data1: "Developer Tool",
      label2: "Works with",
      data2: "Vite",
      /**
       * Player Card configuration (HTTPS iframe URL + pixel dimensions)
       */
      player: {
        url: "https://nellowtcs.me/vite-plugin-seo-meta/demo/player",
        width: 1280,
        height: 720,
        /**
         * Optional URL to raw video/audio stream
         */
        stream:
          "https://nellowtcs.me/vite-plugin-seo-meta/demo/media/stream.mp4",
      },
      /**
       * App Card configuration, which is per platform app store entries
       */
      apps: {
        iphone: {
          name: "vite-plugin-seo-meta config generator",
          id: "123456789",
          url: "myapp://page",
        },
        ipad: {
          name: "vite-plugin-seo-meta config generator",
          id: "123456789",
          url: "myapp://page",
        },
        googleplay: {
          name: "vite-plugin-seo-meta config generator",
          id: "com.example.seoapp",
          url: "myapp://page",
        },
        /**
         * Two-letter ISO country code for the App Store holding the app
         */
        country: "US",
      },
    },

    /**
     * og:locale, defaults to en_US
     */
    locale: "en_US",

    /**
     * BCP 47 language tag for the site
     */
    lang: "en-US",

    /**
     * <meta name="author"> default
     */
    author: "NellowTCS",

    /**
     * Keywords: string or string array
     */
    keywords: [
      "vite",
      "seo",
      "plugin",
      "meta-tags",
      "open-graph",
      "twitter-cards",
      "json-ld",
      "sitemap",
      "robots",
    ],

    /**
     * Site-wide per-user-agent robots metas
     */
    robotsByUserAgent: {
      googlebot: {
        indexifembedded: true,
        maxSnippet: -1,
        maxImagePreview: "large",
        maxVideoPreview: -1,
      },
      bingbot: {
        noarchive: false,
        maxSnippet: 150,
        maxImagePreview: "standard",
      },
      gptbot: {
        noindex: true,
      },
      chatgpt: {
        noindex: true,
      },
      claudebot: {
        noindex: true,
      },
    },

    /**
     * Favicon and related icon links
     */
    favicon: {
      /**
       * Standard <link rel="icon">
       */
      icon: "/favicon.ico",
      /**
       * <link rel="apple-touch-icon">
       */
      appleTouchIcon: "/apple-touch-icon.png",
      /**
       * <link rel="apple-touch-icon-precomposed">
       */
      appleTouchIconPrecomposed: "/apple-touch-icon-precomposed.png",
      /**
       * <link rel="manifest"> web app manifest
       */
      manifest: "/site.webmanifest",
      /**
       * <link rel="mask-icon"> SVG for Safari pinned tabs
       */
      maskIcon: "/safari-pinned-tab.svg",
      /**
       * <meta name="theme-color">, which is a bare color or array per media query
       */
      themeColor: [
        {
          color: "#1e88e5",
          media: "(prefers-color-scheme: light)",
        },
        {
          color: "#1565c0",
          media: "(prefers-color-scheme: dark)",
        },
      ],
      /**
       * Apple mobile web app meta tags
       */
      mobileWebApp: {
        /**
         * <meta name="apple-mobile-web-app-title">: shown under icon on home screen
         */
        title: "vite-plugin-seo-meta config generator",
        /**
         * Run the site full-screen
         */
        capable: true,
        /**
         * Status bar style: default | black | black-translucent | transparent
         */
        statusBarStyle: "black-translucent",
      },
      /**
       * Microsoft IE/Edge tile tags
       */
      msapplication: {
        /**
         * <meta name="msapplication-TileColor">
         */
        tileColor: "#1565c0",
        /**
         * <meta name="msapplication-TileImage">
         */
        tileImage: "/mstile-144x144.png",
        /**
         * <link rel="msapplication-config"> pointing at browserconfig.xml
         */
        config: "/browserconfig.xml",
      },
    },

    /**
     * Site-wide Open Graph defaults
     */
    openGraph: {
      /**
       * og:title (falls back to page title)
       */
      title: "vite-plugin-seo-meta config generator",
      /**
       * og:description
       */
      description:
        "Config generator for vite-plugin-seo-meta: all-in-one Vite SEO plugin for meta tags, Open Graph, Twitter Cards, JSON-LD, hreflang, robots.txt and sitemap.xml",
      /**
       * og:type defaults to website. Can be article, book, profile, music.*, video.*, payment.link etc.
       */
      type: "website",
      /**
       * og:url (defaults to page canonical)
       */
      url: "https://nellowtcs.me/vite-plugin-seo-meta/demo/",
      /**
       * og:site_name
       */
      siteName: "vite-plugin-seo-meta config generator",
      /**
       * og:locale
       */
      locale: "en_US",
      /**
       * og:locale:alternate
       */
      localeAlternate: ["es_ES", "fr_FR", "de_DE", "ja_JP"],
      /**
       * og:image (fallback)
       */
      image: "https://nellowtcs.me/vite-plugin-seo-meta/demo/og-image.png",
      /**
       * og:image:alt
       */
      imageAlt: "vite-plugin-seo-meta Open Graph image",
      /**
       * og:image dimensions
       */
      imageWidth: 1200,
      imageHeight: 630,
      /**
       * og:determiner: a | an | the | "" | auto
       */
      determiner: "auto",
      /**
       * Structured og:image entries (override image when present)
       */
      images: [
        {
          src: "https://nellowtcs.me/vite-plugin-seo-meta/demo/og-image.png",
          alt: "Primary Open Graph image",
          width: 1200,
          height: 630,
          type: "image/png",
        },
        {
          url: "https://nellowtcs.me/vite-plugin-seo-meta/demo/og-image-2.png",
          alt: "Secondary Open Graph image",
          width: 1800,
          height: 945,
          type: "image/png",
        },
      ],
      /**
       * Structured og:video entries
       */
      videos: [
        {
          src: "https://nellowtcs.me/vite-plugin-seo-meta/demo/video.mp4",
          width: 1920,
          height: 1080,
          type: "video/mp4",
        },
      ],
      /**
       * Structured og:audio entries
       */
      audios: [
        {
          src: "https://nellowtcs.me/vite-plugin-seo-meta/demo/audio.mp3",
          type: "audio/mpeg",
        },
      ],
      /**
       * article:* properties
       */
      article: {
        publishedTime: "2024-01-01T00:00:00.000Z",
        modifiedTime: new Date("2024-06-01T00:00:00.000Z"),
        expirationTime: "2099-12-31T23:59:59.000Z",
        author: [
          "https://example.com/author/alice",
          "https://example.com/author/bob",
        ],
        section: "Technology",
        tag: ["vite", "seo", "plugin", "web-development"],
      },
      /**
       * book:* properties
       */
      book: {
        author: ["https://example.com/author/author1"],
        isbn: "978-3-16-148410-0",
        releaseDate: "2024-01-01",
        tag: ["web", "tools", "seo"],
      },
      /**
       * profile:* properties
       */
      profile: {
        firstName: "Nellow",
        lastName: "TCS",
        username: "NellowTCS",
        gender: "male",
      },
      /**
       * music:* properties
       */
      music: {
        duration: 240,
        album: [
          { url: "https://example.com/album/1", disc: 1, track: 1 },
          { url: "https://example.com/album/1", disc: 1, track: 2 },
        ],
        musician: ["https://example.com/artist/musician1"],
        song: [{ url: "https://example.com/song/1", disc: 1, track: 1 }],
        releaseDate: "2024-01-01",
        creator: ["https://example.com/artist/creator1"],
      },
      /**
       * video:* properties
       */
      video: {
        actor: [
          { url: "https://example.com/actor/1", role: "Protagonist" },
          { url: "https://example.com/actor/2", role: "Supporting" },
        ],
        director: ["https://example.com/director/1"],
        writer: ["https://example.com/writer/1"],
        duration: 3600,
        releaseDate: "2024-01-01",
        tag: ["tutorial", "webdev"],
        series: "https://example.com/series/1",
      },
      /**
       * payment:* properties (ogp.me payment.link)
       */
      payment: {
        description: "Premium SEO configuration package",
        currency: "USD",
        amount: 9.99,
        expiresAt: new Date("2025-12-31"),
        status: "PENDING",
        id: "payment-12345",
        successUrl: "https://nellowtcs.me/vite-plugin-seo-meta/demo/success",
      },
    },

    /**
     * JSON-LD structured data configuration
     */
    jsonLd: {
      /**
       * Organization block: true uses site name/url, or pass full object
       */
      organization: {
        name: "NellowTCS",
        url: "https://nellowtcs.me",
        logo: "https://nellowtcs.me/vite-plugin-seo-meta/demo/logo.png",
        sameAs: [
          "https://github.com/NellowTCS",
          "https://twitter.com/NellowTCS",
        ],
      },
      /**
       * WebSite block: true or full object with searchAction
       */
      website: {
        name: "vite-plugin-seo-meta config generator",
        url: "https://nellowtcs.me/vite-plugin-seo-meta/demo/",
        description:
          "Config generator for vite-plugin-seo-meta: all-in-one Vite SEO plugin",
        /**
         * Search action URL template
         */
        searchUrl:
          "https://nellowtcs.me/vite-plugin-seo-meta/demo/search?q={search_term_string}",
      },
    },
  },

  /**
   * PAGE METADATA
   * Route to metadata map, by pathname. Demo has only the root page.
   * Per-page values override site defaults.
   */
  pages: {
    "/": {
      /**
       * Page title (wrapped by titleTemplate)
       */
      title: "Config generator",
      /**
       * Page description (overrides site.description)
       */
      description:
        "Generate a typed vite-plugin-seo-meta config from a form. Covers site defaults, Open Graph, Twitter Cards, JSON-LD, favicon icons, robots.txt and sitemap.xml.",
      /**
       * Canonical path or absolute URL. Defaults to site.url + route
       */
      canonical: "https://nellowtcs.me/vite-plugin-seo-meta/demo/",
      /**
       * BCP 47 language tag for the page
       */
      lang: "en",
      /**
       * Page-specific image
       */
      image: "https://nellowtcs.me/vite-plugin-seo-meta/demo/og-image.png",
      imageAlt: "vite-plugin-seo-meta config generator",
      /**
       * Keywords: string or array
       */
      keywords: [
        "vite seo config generator",
        "meta tags generator",
        "open graph generator",
      ],
      /**
       * Author override
       */
      author: "NellowTCS",
      /**
       * Exclude from sitemap.xml and emit noindex directive
       * Set to false here to explicitly be included
       */
      noindex: false,
      /**
       * Robots directive: raw string or structured RobotsDirectives
       * Overrides noindex
       */
      robots: {
        maxSnippet: -1,
        maxImagePreview: "large",
        maxVideoPreview: -1,
      },
      /**
       * Per-page per-user-agent robots metas
       */
      robotsByUserAgent: {
        googlebot: {
          indexifembedded: true,
        },
      },
      /**
       * Open Graph overrides for this page
       */
      openGraph: {
        title: "vite-plugin-seo-meta • Config generator",
        description:
          "Generate a typed vite-plugin-seo-meta config from a form. Covers site defaults, Open Graph, Twitter Cards, JSON-LD, favicon icons, robots.txt and sitemap.xml.",
        type: "website",
        url: "https://nellowtcs.me/vite-plugin-seo-meta/demo/",
        image: "https://nellowtcs.me/vite-plugin-seo-meta/demo/og-image.png",
        imageAlt: "vite-plugin-seo-meta config generator",
        locale: "en_US",
      },
      /**
       * Twitter overrides for this page
       */
      twitter: {
        card: "summary_large_image",
        site: "@NellowTCS",
        creator: "@NellowTCS",
        title: "vite-plugin-seo-meta • Config generator",
        description:
          "Generate a typed vite-plugin-seo-meta config from a form. Covers all SEO features.",
        image:
          "https://nellowtcs.me/vite-plugin-seo-meta/demo/twitter-image.png",
        imageAlt: "vite-plugin-seo-meta config generator",
      },
      /**
       * JSON-LD per-page only (article, product). Also can use site jsonLd.
       */
      jsonLd: {
        /**
         * Article structured data: per-page only
         */
        article: {
          headline: "vite-plugin-seo-meta Config Generator",
          description:
            "All-in-one Vite SEO plugin with meta tags, Open Graph, Twitter Cards, JSON-LD, hreflang, robots.txt and sitemap.xml",
          image: "https://nellowtcs.me/vite-plugin-seo-meta/demo/og-image.png",
          datePublished: "2024-01-01T00:00:00.000Z",
          dateModified: "2024-06-01T00:00:00.000Z",
          author: { name: "NellowTCS", url: "https://nellowtcs.me" },
          type: "Article",
        },
        /**
         * Extra JSON-LD nodes appended as written. Can be any valid JSON-LD object. '
         * For example, a SoftwareApplication node:
         */
        extra: [
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "vite-plugin-seo-meta config generator",
            applicationCategory: "DeveloperApplication",
            operatingSystem: "Any",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
          },
        ],
      },
      /**
       * hreflang alternates for this page
       */
      alternates: [
        {
          hreflang: "en",
          href: "https://nellowtcs.me/vite-plugin-seo-meta/demo/",
        },
        {
          hreflang: "es",
          href: "https://nellowtcs.me/vite-plugin-seo-meta/demo/es/",
        },
        {
          hreflang: "fr",
          href: "https://nellowtcs.me/vite-plugin-seo-meta/demo/fr/",
        },
        {
          hreflang: "de",
          href: "https://nellowtcs.me/vite-plugin-seo-meta/demo/de/",
        },
        {
          hreflang: "ja",
          href: "https://nellowtcs.me/vite-plugin-seo-meta/demo/ja/",
        },
        {
          hreflang: "x-default",
          href: "https://nellowtcs.me/vite-plugin-seo-meta/demo/",
        },
      ],
      /**
       * Include in sitemap.xml. Defaults to !noindex
       */
      sitemap: true,
      /**
       * Sitemap priority (0.0 to 1.0)
       */
      priority: 1.0,
      /**
       * Sitemap changefreq
       */
      changefreq: "weekly",
      /**
       * Last modification date
       */
      lastmod: new Date("2024-06-01"),
      /**
       * Extra <meta name=... content=...> entries
       */
      meta: {
        "google-site-verification": "your-verification-code-here",
        "msvalidate.01": "your-bing-verification-code-here",
        "yandex-verification": "your-yandex-verification-code-here",
      },
      /**
       * Extra <link> entries. rel and href are required.
       * If a link collides with an auto-generated tag (same dedupe key), the duplicate is silently dropped.
       *
       * So a `rel="canonical"` here would be a no-op since the plugin already emits one from page.canonical.
       */
      links: [
        {
          rel: "alternate",
          href: "https://nellowtcs.me/vite-plugin-seo-meta/demo/rss.xml",
          type: "application/rss+xml",
          title: "RSS Feed",
        },
        {
          rel: "search",
          href: "https://nellowtcs.me/vite-plugin-seo-meta/demo/opensearch.xml",
          type: "application/opensearchdescription+xml",
          title: "vite-plugin-seo-meta config generator",
        },
        {
          rel: "canonical",
          href: "https://nellowtcs.me/vite-plugin-seo-meta/demo/",
        },
      ],
    },
  },

  /**
   * ROBOTS.TXT GENERATION
   * Options for the generated robots.txt. RFC 9309.
   * robots: "auto" (default) | boolean | RobotsFileOptions
   */
  robots: {
    /**
     * User agents the rules apply to. Default *
     */
    userAgent: "*",
    /**
     * Paths to disallow
     */
    disallow: ["/api", "/admin", "*.gif$"],
    /**
     * Paths to explicitly allow
     */
    allow: ["/public", "/assets"],
    /**
     * Additional user-agent groups with their own rules
     */
    groups: [
      {
        userAgent: "Googlebot",
        allow: ["/"],
        disallow: ["/private"],
        crawlDelay: 1,
      },
      {
        userAgent: ["Bingbot", "Slurp"],
        disallow: ["/no-bing"],
        crawlDelay: 2,
        cleanParam: ["sessionid", "utm_source"],
      },
    ],
    /**
     * Raw lines appended as-is after generated rules
     */
    rules: ["# Custom robots rules", "# Generated by vite-plugin-seo-meta"],
    /**
     * Sitemap URL to advertise, or false to omit. Defaults to site.url + /sitemap.xml
     */
    sitemap: "https://nellowtcs.me/vite-plugin-seo-meta/demo/sitemap.xml",
    /**
     * Merge with existing robots.txt in output dir instead of overwriting. Default true
     */
    merge: true,
    /**
     * When true, automatically add Disallow for pages with noindex: true
     */
    disallowNoindex: true,
    /**
     * Host: record (standalone, not part of any group)
     */
    host: "nellowtcs.me",
    /**
     * Crawl-delay in seconds for default group
     */
    crawlDelay: 5,
    /**
     * Clean-param rules for default group
     */
    cleanParam: ["ref", "source"],
  },

  /**
   * SITEMAP.XML GENERATION
   * Options for generated sitemap.xml. sitemaps.org protocol.
   * sitemap: "auto" (default) | boolean | SitemapOptions
   */
  sitemap: {
    /**
     * Output filename within build.outDir. Default sitemap.xml
     */
    filename: "sitemap.xml",
    /**
     * Routes to exclude from sitemap
     */
    exclude: ["/admin", "/private", "/api"],
    /**
     * Fallback changefreq for pages without one
     */
    defaultChangefreq: "weekly",
    /**
     * Fallback priority for pages without one
     */
    defaultPriority: 0.8,
    /**
     * Site origin used to enforce single-host sitemap
     */
    siteUrl: "https://nellowtcs.me/vite-plugin-seo-meta/demo",
    /**
     * Maximum URLs per sitemap file. Default 50000
     */
    maxUrls: 50000,
  },

  /**
   * Validation mode
   *
   * warn (default) | error (throws, fails build) | false (disabled)
   * Using error mode here to validate our config
   */
  validate: "error",

  /**
   * Config file path
   *
   * Path to config file relative to root, or false to skip auto-detection
   * We are the config file being auto-loaded lolll, but showing the option
   */
  configFile: "./seo.config.ts",
});
