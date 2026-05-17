// @ts-check
const { themes: prismThemes } = require('prism-react-renderer');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Job Search Dashboard',
  tagline: 'Your AI-powered unfair advantage in the job search',
  favicon: 'img/favicon.ico',

  url: 'https://catesandrew.github.io',
  baseUrl: '/job-search/',

  organizationName: 'catesandrew',
  projectName: 'job-search',
  trailingSlash: false,

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/catesandrew/job-search/edit/main/website/',
        },
        blog: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/social-card.png',
      colorMode: {
        defaultMode: 'dark',
        disableSwitch: false,
        respectPrefersColorScheme: true,
      },
      navbar: {
        title: 'Job Search Dashboard',
        logo: {
          alt: 'Job Search Dashboard',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'docs',
            position: 'left',
            label: 'Docs',
          },
          {
            href: 'https://github.com/catesandrew/job-search',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Get Started',
            items: [
              { label: 'Introduction', to: '/docs/intro' },
              { label: 'Installation', to: '/docs/getting-started' },
              { label: 'Configuration', to: '/docs/configuration' },
            ],
          },
          {
            title: 'Features',
            items: [
              { label: 'URL Import', to: '/docs/features/url-import' },
              { label: 'Resume Builder', to: '/docs/features/resume-builder' },
              { label: 'Interview Prep', to: '/docs/features/interview-prep' },
              { label: 'Company Insights', to: '/docs/features/company-insights' },
              { label: 'AI Chat', to: '/docs/features/ai-chat' },
            ],
          },
          {
            title: 'Architecture',
            items: [
              { label: 'System Overview', to: '/docs/architecture/overview' },
              { label: 'MCP Agent Bridge', to: '/docs/architecture/mcp-agent-bridge' },
              { label: 'Deployment', to: '/docs/deployment' },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/catesandrew/job-search',
              },
              {
                label: 'MCP Agent Bridge',
                href: 'https://github.com/catesandrew/mcp-agent-bridge',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Andrew Cates. Built with Docusaurus.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ['bash', 'typescript', 'json', 'yaml'],
      },
      announcementBar: {
        id: 'star_repo',
        content: '⭐ If this dashboard helped your job search, <a href="https://github.com/catesandrew/job-search">star it on GitHub</a>!',
        backgroundColor: '#6366f1',
        textColor: '#ffffff',
        isCloseable: true,
      },
    }),
};

module.exports = config;
