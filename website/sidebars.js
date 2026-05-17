/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  docs: [
    {
      type: 'doc',
      id: 'intro',
      label: 'Introduction',
    },
    {
      type: 'doc',
      id: 'getting-started',
      label: 'Getting Started',
    },
    {
      type: 'doc',
      id: 'configuration',
      label: 'Configuration',
    },
    {
      type: 'category',
      label: 'Features',
      collapsed: false,
      items: [
        'features/url-import',
        'features/resume-builder',
        'features/interview-prep',
        'features/company-insights',
        'features/ai-chat',
      ],
    },
    {
      type: 'category',
      label: 'Architecture',
      collapsed: false,
      items: [
        'architecture/overview',
        'architecture/mcp-agent-bridge',
      ],
    },
    {
      type: 'doc',
      id: 'deployment',
      label: 'Deployment',
    },
  ],
};

module.exports = sidebars;
