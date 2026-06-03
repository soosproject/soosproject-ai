import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'SOOS Project',
  description: 'The agentic AI governance stack. 12 IETF drafts specifying the kernel-level protocols for safe autonomous agent deployment.',

  // Canonical domain
  base: '/',

  // Clean URLs — /drafts/hem not /drafts/hem.html
  cleanUrls: true,

  // <head> additions
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'og:title', content: 'SOOS Project — Agentic AI Governance' }],
    ['meta', { name: 'og:description', content: '12 IETF drafts specifying the governance stack for autonomous AI agents.' }],
    ['meta', { name: 'og:url', content: 'https://soosproject.ai' }],
  ],

  themeConfig: {
    // Site logo and title in nav
    logo: '/logo.svg',
    siteTitle: 'SOOS Project',

    // Top navigation bar
    nav: [
      { text: 'Drafts', link: '/drafts' },
      { text: 'Stack', link: '/stack' },
      { text: 'Gap List', link: '/gaps' },
      { text: 'Vienna', link: '/vienna' },
      { text: 'Government', link: '/government' },
      { text: 'Build →', link: 'https://soosproject.com' },
    ],

    // Sidebar — draft pages share a common sidebar
    sidebar: {
      '/drafts/': [
        {
          text: 'Tier 1 — Vienna Critical',
          items: [
            { text: 'HEM — Human Escalation', link: '/drafts/hem' },
            { text: 'CAP — Constitutional Authority', link: '/drafts/cap' },
            { text: 'IDP — Intent Declaration', link: '/drafts/idp' },
          ]
        },
        {
          text: 'Tier 2 — Vienna Important',
          items: [
            { text: 'AEP — Agentic Execution', link: '/drafts/aep' },
            { text: 'MAD — Multi-Agent Delegation', link: '/drafts/mad' },
            { text: 'GAR — Governance Audit', link: '/drafts/gar' },
          ]
        },
        {
          text: 'Tier 3 — Launch Complete',
          items: [
            { text: 'PT — Progressive Trust', link: '/drafts/pt' },
            { text: 'KIA — Kernel Attestation', link: '/drafts/kia' },
            { text: 'CAP-RRS — Regulation Schema', link: '/drafts/cap-rrs' },
            { text: 'MJWT — Mandate JWT', link: '/drafts/mjwt' },
            { text: 'FAIP — Federated Privacy', link: '/drafts/faip' },
            { text: 'SOV — Sovereign Object', link: '/drafts/sov' },
          ]
        },
        {
          text: 'Overview',
          items: [
            { text: 'All Drafts', link: '/drafts' },
            { text: 'SOOS Stack', link: '/stack' },
            { text: 'Gap List', link: '/gaps' },
          ]
        }
      ],
    },

    // Social links
    socialLinks: [
      { icon: 'github', link: 'https://github.com/soosproject' }
    ],

    // Footer
    footer: {
      message: 'Apache 2.0 License',
      copyright: 'Copyright © 2026 MyAuberge K.K. · <a href="https://soosproject.com">Build with SOOS →</a>'
    },

    // Search
    search: {
      provider: 'local'
    },

    // Edit link — points to soos-drafts repo
    editLink: {
      pattern: 'https://github.com/soosproject/soos-drafts/edit/main/:path',
      text: 'Edit this page on GitHub'
    },
  },

  // Sitemap for soosproject.ai
  sitemap: {
    hostname: 'https://soosproject.ai'
  }
})
