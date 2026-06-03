import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'SOOS Project',
  description: 'The agentic AI governance stack. 12 IETF drafts specifying the kernel-level protocols for safe autonomous agent deployment.',

  // Canonical domain
  base: '/',

  // Clean URLs  E/drafts/hem not /drafts/hem.html
  cleanUrls: true,
  ignoreDeadLinks: true,

  // <head> additions
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'og:title', content: 'SOOS Project  EAgentic AI Governance' }],
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
      { text: 'Build ↁE, link: 'https://soosproject.com' },
    ],

    // Sidebar  Edraft pages share a common sidebar
    sidebar: {
      '/drafts/': [
        {
          text: 'Tier 1  EVienna Critical',
          items: [
            { text: 'HEM  EHuman Escalation', link: '/drafts/hem' },
            { text: 'CAP  EConstitutional Authority', link: '/drafts/cap' },
            { text: 'IDP  EIntent Declaration', link: '/drafts/idp' },
          ]
        },
        {
          text: 'Tier 2  EVienna Important',
          items: [
            { text: 'AEP  EAgentic Execution', link: '/drafts/aep' },
            { text: 'MAD  EMulti-Agent Delegation', link: '/drafts/mad' },
            { text: 'GAR  EGovernance Audit', link: '/drafts/gar' },
          ]
        },
        {
          text: 'Tier 3  ELaunch Complete',
          items: [
            { text: 'PT  EProgressive Trust', link: '/drafts/pt' },
            { text: 'KIA  EKernel Attestation', link: '/drafts/kia' },
            { text: 'CAP-RRS  ERegulation Schema', link: '/drafts/cap-rrs' },
            { text: 'MJWT  EMandate JWT', link: '/drafts/mjwt' },
            { text: 'FAIP  EFederated Privacy', link: '/drafts/faip' },
            { text: 'SOV  ESovereign Object', link: '/drafts/sov' },
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
      copyright: 'Copyright © 2026 MyAuberge K.K. · <a href="https://soosproject.com">Build with SOOS ↁE/a>'
    },

    // Search
    search: {
      provider: 'local'
    },

    // Edit link  Epoints to soos-drafts repo
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

