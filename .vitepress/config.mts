import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'SOOS Project',
  description: 'The agentic AI governance stack. 12 IETF drafts specifying the kernel-level protocols for safe autonomous agent deployment.',
  base: '/',
  cleanUrls: true,
  ignoreDeadLinks: true,
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'og:title', content: 'SOOS Project' }],
    ['meta', { name: 'og:url', content: 'https://soosproject.ai' }],
  ],
  themeConfig: {
    siteTitle: 'SOOS Project',
    nav: [
      { text: 'Drafts', link: '/drafts' },
      { text: 'Stack', link: '/stack' },
      { text: 'Gap List', link: '/gaps' },
      { text: 'Vienna', link: '/vienna' },
      { text: 'Government', link: '/government' },
      { text: 'About', link: '/about' },
      { text: 'Build', link: 'https://soosproject.com' },
    ],
    sidebar: {
      '/drafts/': [
        {
          text: 'Tier 1 - Vienna Critical',
          items: [
            { text: 'HEM - Human Escalation', link: '/drafts/hem' },
            { text: 'CAP - Constitutional Authority', link: '/drafts/cap' },
            { text: 'IDP - Intent Declaration', link: '/drafts/idp' },
          ]
        },
        {
          text: 'Tier 2 - Vienna Important',
          items: [
            { text: 'AEP - Agentic Execution', link: '/drafts/aep' },
            { text: 'MAD - Multi-Agent Delegation', link: '/drafts/mad' },
            { text: 'GAR - Governance Audit', link: '/drafts/gar' },
          ]
        },
        {
          text: 'Tier 3 - Launch Complete',
          items: [
            { text: 'PT - Progressive Trust', link: '/drafts/pt' },
            { text: 'KIA - Kernel Attestation', link: '/drafts/kia' },
            { text: 'CAP-RRS - Regulation Schema', link: '/drafts/cap-rrs' },
            { text: 'MJWT - Mandate JWT', link: '/drafts/mjwt' },
            { text: 'FAIP - Federated Privacy', link: '/drafts/faip' },
            { text: 'SOV - Sovereign Object', link: '/drafts/sov' },
          ]
        },
      ],
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/soosproject' }
    ],
    footer: {
      message: 'Apache 2.0 License',
      copyright: 'Copyright 2026 MyAuberge K.K.'
    },
    search: {
      provider: 'local'
    },
  },
  sitemap: {
    hostname: 'https://soosproject.ai'
  }
})
