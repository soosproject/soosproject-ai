---
layout: home
hero:
name: "SOOS Project"
text: "12 open protocols that make agentic AI reliable enough to deploy at enterprise scale."
tagline: "More control over what your agents do. More confidence in what they produce. More capability to deploy them where it counts."
actions:
- theme: brand
text: Browse Drafts
link: /drafts
- theme: alt
text: Gap Analysis
link: /gaps
- theme: alt
text: SOOS Stack
link: /stack
features:
title: "The IETF foundation is solid. Agentic AI moved faster than anyone expected."
details: "SCITT, WIMSE, CAEP, SSF, VDAF — excellent standards for a world of services and APIs. Nobody designed them for autonomous agents acting on consequential objects: contracts, financial instructions, bookings, medical records. That is not a criticism. It is simply where the technology went next, faster than anyone anticipated. We wrote the narrowest possible specifications to fill those gaps, building on existing IETF work wherever it fits."
title: "Intent Declaration — IDP"
details: "No common format exists for what an agent was authorized to do, by whom, with what scope, and for how long. Without verifiable scope, agents cannot safely be given wider authorization."
link: /drafts/idp
title: "Delegation Chains — MAD + MJWT"
details: "Multi-agent pipelines pass authority without attenuation, revocation, or propagation guarantees. A compromised sub-agent has no standard containment path."
link: /drafts/mad
title: "Hard Behavioral Limits — CAP + CAP-RRS"
details: "No machine-readable standard exists for what an agent must never do, regardless of instruction. Jurisdiction-specific law as a package import, not a Cedar authoring problem."
link: /drafts/cap
title: "Human Escalation — HEM"
details: "When an agent reaches the edge of its authorization, there is no standard protocol for pausing and transferring control to a human principal."
link: /drafts/hem
title: "Full Session Audit — GAR + AEP"
details: "Existing audit standards do not cover the complete agent session lifecycle — partial completion, revocation state, recovery gates, and achievability. Debugging agent failures should not be reconstruction work."
link: /drafts/gar
---
Better control means better software.
Today, every team building with AI agents solves the same problems from scratch — how to keep agents on task, how to stop them when something goes wrong, how to know what they actually did. SOOS solves those problems once, at the right layer, as open standards anyone can use.
An agent with a signed intent declaration can safely be given wider scope. An agent with progressive trust accumulation earns authorization based on its actual track record. An agent with a complete execution record is debuggable in minutes, not days. The engineering properties and the operational properties are the same properties.
Apache 2.0. No commercial version. Standards only work if anyone can implement them.
---
The SOOS draft suite is a human-AI collaboration. The protocol architecture, standards strategy, gap analysis, and governing design decisions are the work of the human authors. The drafting, iteration, and text production were done in close partnership with AI. We say this plainly because transparency about how this work was made is part of what the work argues for.
