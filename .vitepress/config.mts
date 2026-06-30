import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Sovereign Object OS Project',
  description: '19 open protocols that make agentic AI reliable enough to deploy at enterprise scale. Better control means better software.',
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
      { text: 'Agent Identity', link: '/identity' },
      { text: 'Gap List', link: '/gaps' },
      { text: 'Vienna', link: '/vienna' },
      { text: 'Government', link: '/government' },
      { text: 'About', link: '/about' },
      { text: 'Build', link: 'https://soosproject.com' },
    ],
    sidebar: {
      '/drafts/': [
        {
          text: 'Layer 0 — Execution Infrastructure',
          items: [
            { text: 'KEE-1 - Kernel Execution Environment', link: '/drafts/kee' },
            { text: 'KEE-2/DIST - Distributed Runtime (Class B)', link: '/drafts/kee2' },
          ]
        },
        {
          text: 'Layer 1 — Identity & Execution',
          items: [
            { text: 'KIA - Kernel Attestation', link: '/drafts/kia' },
            { text: 'SOV - Sovereign Object', link: '/drafts/sov' },
            { text: 'MJWT - Mandate JWT', link: '/drafts/mjwt' },
            { text: 'IDP - Intent Declaration', link: '/drafts/idp' },
            { text: 'HEM - Human Escalation', link: '/drafts/hem' },
            { text: 'AEP - Agentic Execution', link: '/drafts/aep' },
          ]
        },
        {
          text: 'Layer 2 — Delegation & Audit',
          items: [
            { text: 'MAD - Multi-Agent Delegation', link: '/drafts/mad' },
            { text: 'GAR - Governed Action Record', link: '/drafts/gar' },
          ]
        },
        {
          text: 'Layer 3 — Policy, Trust & Privacy',
          items: [
            { text: 'CAP - AI Prohibition', link: '/drafts/cap' },
            { text: 'CAP-RRS - Regulation Schema', link: '/drafts/cap-rrs' },
            { text: 'CAP-RRS-JP - Japan LRI Profile (Class B)', link: '/drafts/cap-rrs-jp' },
            { text: 'PT - Progressive Trust', link: '/drafts/pt' },
            { text: 'FAIP - Federated Privacy', link: '/drafts/faip' },
          ]
        },
        {
          text: 'Layer 4 — Governance Protocols',
          items: [
            { text: 'ACD - Agent Compliance Disclosure', link: '/drafts/acd' },
            { text: 'PEER - Cross-Principal Communication', link: '/drafts/peer' },
            { text: 'RGP - Resource Governance', link: '/drafts/rgp' },
            { text: 'GRP - Governed Remediation', link: '/drafts/grp' },
            { text: 'AOP - Agent Orchestration', link: '/drafts/aop' },
            { text: 'DAM - Data Artifact Management', link: '/drafts/dam' },
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
