import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Sovereign Object OS Project',
description: '12 open protocols that make agentic AI reliable enough to deploy at enterprise scale. Better control means better software.',
  base: '/',
  cleanUrls: true,
  ignoreDeadLinks: true,
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'og:title', content: 'Sovereign Object OS Project' }],
    ['meta', { name: 'og:url', content: 'https://soosproject.ai' }],
  ],
  themeConfig: {
    siteTitle: 'Sovereign Object OS Project',
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
          text: 'Tier 1 - Identity & Execution',
          items: [
            { text: 'HEM - Human Escalation', link: '/drafts/hem' },
            { text: 'CAP - AI Prohibition', link: '/drafts/cap' },
            { text: 'IDP - Intent Declaration', link: '/drafts/idp' },
          ]
        },
        {
          text: 'Tier 2 - Delegation & Audit',
          items: [
            { text: 'AEP - Agentic Execution', link: '/drafts/aep' },
            { text: 'MAD - Multi-Agent Delegation', link: '/drafts/mad' },
            { text: 'GAR - Governed Action Record', link: '/drafts/gar' },
          ]
        },
        {
          text: 'Tier 3 - Policy, Trust & Privacy',
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
