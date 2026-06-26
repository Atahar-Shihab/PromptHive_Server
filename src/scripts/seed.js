import { connectDatabase } from "../config/mongo.js";
import { env } from "../env.js";
import { Prompt } from "../models/Prompt.js";
import { Review } from "../models/Review.js";
import { updateUserRole, getUserByEmail } from "../services/user.service.js";

await connectDatabase();
const { auth } = await import("../auth.js");

try {
  await auth.api.signUpEmail({
    body: {
      name: env.DEFAULT_ADMIN_NAME,
      email: env.DEFAULT_ADMIN_EMAIL,
      password: env.DEFAULT_ADMIN_PASSWORD,
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80"
    }
  });
} catch (error) {
  const message = String(error?.message ?? "");
  const alreadyExists = message.toLowerCase().includes("already") || message.toLowerCase().includes("exist");
  if (!alreadyExists) {
    console.error("Admin signup failed:", message);
  }
}

const admin = await getUserByEmail(env.DEFAULT_ADMIN_EMAIL);
if (!admin) {
  console.error(`Admin user was not created: ${env.DEFAULT_ADMIN_EMAIL}`);
  process.exit(1);
}
await updateUserRole(admin.id, "admin");

const creator = {
  id: admin.id,
  name: env.DEFAULT_ADMIN_NAME,
  email: env.DEFAULT_ADMIN_EMAIL,
  image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80"
};

const seedCreators = [
  creator,
  {
    id: "seed-creator-growth",
    name: "Nadia Rahman",
    email: "nadia.creator@prompthive.local",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80"
  },
  {
    id: "seed-creator-ops",
    name: "Omar Siddique",
    email: "omar.ops@prompthive.local",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80"
  },
  {
    id: "seed-creator-design",
    name: "Maya Chen",
    email: "maya.design@prompthive.local",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=80"
  }
];

const prompts = [
  {
    title: "SaaS Launch Messaging Architect",
    description: "Turn messy product notes into positioning, homepage messaging, and launch copy for a SaaS release.",
    content:
      "You are a senior SaaS positioning strategist. Build a launch messaging system for PromptHive Teams, a workspace where marketing teams discover, save, and test premium AI prompts before using them in campaigns. Return an ICP pain map, a one-line positioning statement, five homepage hero headline options, a feature-to-benefit table, objection handling copy, a seven-day launch content plan, and a final quality checklist.",
    category: "Marketing",
    aiTool: "ChatGPT",
    tags: ["saas", "launch", "positioning"],
    difficulty: "Intermediate",
    thumbnailUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80",
    visibility: "public",
    copyCount: 326,
    featured: true,
    creator: seedCreators[1]
  },
  {
    title: "Premium Investor Research Sprint",
    description: "Create an investor-grade research brief with evidence gaps, competitor signals, and decision criteria.",
    content:
      "Act as a venture research lead. Investigate the market for AI prompt marketplaces serving freelancers, agencies, and internal growth teams. Build a research sprint for a seed-stage investor that includes a hypothesis tree, source plan, market sizing assumptions, competitor map, risk register, evidence gaps, founder questions, and a final investment memo with confidence levels.",
    category: "Research",
    aiTool: "Gemini",
    tags: ["research", "memo", "strategy"],
    difficulty: "Pro",
    thumbnailUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=80",
    visibility: "private",
    copyCount: 188,
    featured: true,
    creator: seedCreators[1]
  },
  {
    title: "Midjourney Premium Product Studio",
    description: "Generate polished product photography prompts with camera, lens, lighting, set design, and ad composition.",
    content:
      "Create twelve Midjourney prompts for a matte black wireless desk lamp with a soft cyan status light, designed for premium remote work setups. For each prompt include scene concept, camera lens, lighting direction, material styling, background, color palette, composition, negative prompt, and commercial use case. Make the results premium, realistic, and brand-safe.",
    category: "Design",
    aiTool: "Midjourney",
    tags: ["product", "image", "advertising"],
    difficulty: "Beginner",
    thumbnailUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
    visibility: "public",
    copyCount: 514,
    featured: true,
    creator: seedCreators[3]
  },
  {
    title: "Claude Policy Brief Simplifier",
    description: "Translate dense policy, contract, or compliance text into a clear brief with risks and next actions.",
    content:
      "You are a careful policy operations assistant. Summarize a vendor data processing agreement for a small SaaS company preparing for enterprise customers. Return an executive summary, obligations, risks, missing facts, stakeholder impact, questions for counsel, and an action checklist. Do not provide legal advice. Flag uncertainty clearly.",
    category: "Operations",
    aiTool: "Claude",
    tags: ["policy", "summary", "risk"],
    difficulty: "Intermediate",
    thumbnailUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=900&q=80",
    visibility: "public",
    copyCount: 142,
    featured: false,
    creator: seedCreators[2]
  },
  {
    title: "Automation Workflow Blueprint",
    description: "Convert a repeated business task into a build-ready automation plan with triggers, tools, and failure cases.",
    content:
      "Map the workflow for collecting website leads, enriching company data, assigning the right sales owner, sending a personalized first email, and creating a follow-up task if no reply arrives after three days. Identify trigger events, inputs, outputs, owners, tools, approval steps, edge cases, failure handling, security concerns, and a three-phase implementation plan. Return the plan as a table plus a short executive summary.",
    category: "Automation",
    aiTool: "ChatGPT",
    tags: ["automation", "workflow", "ops"],
    difficulty: "Pro",
    thumbnailUrl: "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=900&q=80",
    visibility: "public",
    copyCount: 271,
    featured: true,
    creator: seedCreators[2]
  },
  {
    title: "Creator Newsletter Engine",
    description: "Plan a high-signal newsletter issue with hooks, segments, useful examples, and reusable sections.",
    content:
      "Create a newsletter issue for indie AI tool builders who want practical growth ideas without hype. Include five subject lines, an opening hook, three useful sections, one personal insight, one curated resource, a soft call to action, and a reusable issue template for next week.",
    category: "Writing",
    aiTool: "ChatGPT",
    tags: ["newsletter", "writing", "creator"],
    difficulty: "Beginner",
    thumbnailUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=900&q=80",
    visibility: "public",
    copyCount: 249,
    featured: true,
    creator: seedCreators[1]
  },
  {
    title: "Premium Customer Interview Miner",
    description: "Extract pain points, jobs-to-be-done, objections, and landing page copy from raw interview notes.",
    content:
      "You are a product marketing researcher. Analyze customer interview notes from five freelance designers who use AI image tools but struggle to create consistent client-ready prompts. Return top pain patterns, exact voice-of-customer quotes, jobs-to-be-done, objections, buying triggers, landing page copy blocks, and five follow-up interview questions.",
    category: "Research",
    aiTool: "Claude",
    tags: ["customer", "research", "copy"],
    difficulty: "Pro",
    thumbnailUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80",
    visibility: "private",
    copyCount: 202,
    featured: true,
    creator: seedCreators[1]
  },
  {
    title: "Support SOP Generator",
    description: "Turn support tickets into a clean standard operating procedure for customer success teams.",
    content:
      "Act as a customer success operations lead. Create a support SOP for recurring tickets about login problems, failed premium payments, missing bookmarks, and confusion around locked private prompts. Include categories, response macros, escalation rules, quality checklist, customer tone guide, and metrics to track after rollout.",
    category: "Operations",
    aiTool: "Gemini",
    tags: ["support", "sop", "customer-success"],
    difficulty: "Intermediate",
    thumbnailUrl: "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=900&q=80",
    visibility: "public",
    copyCount: 134,
    featured: false,
    creator: seedCreators[2]
  },
  {
    title: "AI App Feature Spec Writer",
    description: "Create a developer-ready feature specification from a rough product idea.",
    content:
      "You are a senior product manager. Convert the idea of a prompt forking feature into a developer-ready feature spec for PromptHive. Include problem statement, user stories, acceptance criteria, data model notes, API expectations, edge cases, analytics events, and launch checklist.",
    category: "Writing",
    aiTool: "ChatGPT",
    tags: ["product", "spec", "development"],
    difficulty: "Intermediate",
    thumbnailUrl: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=900&q=80",
    visibility: "public",
    copyCount: 221,
    featured: false,
    creator: seedCreators[0]
  },
  {
    title: "Private Executive Strategy Memo",
    description: "Build a concise executive memo with options, tradeoffs, risks, and recommendation logic.",
    content:
      "Act as a chief of staff. Build an executive strategy memo for deciding whether PromptHive should introduce a one-time premium unlock or a monthly creator subscription. Include context, options, tradeoff table, risk register, financial impact, operational impact, recommendation, and a leadership meeting agenda.",
    category: "Operations",
    aiTool: "Claude",
    tags: ["memo", "strategy", "leadership"],
    difficulty: "Pro",
    thumbnailUrl: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=80",
    visibility: "private",
    copyCount: 176,
    featured: true,
    creator: seedCreators[0]
  },
  {
    title: "DALL-E Editorial Campaign Pack",
    description: "Generate campaign image prompts for ads, blog headers, and social visuals with consistent art direction.",
    content:
      "Create an editorial image campaign for a premium AI prompt marketplace called PromptHive. Return ten DALL-E prompts with scene, art direction, color system, composition, aspect ratio, typography guidance, and usage channel. Keep visual consistency across all prompts.",
    category: "Design",
    aiTool: "DALL-E",
    tags: ["campaign", "image", "brand"],
    difficulty: "Beginner",
    thumbnailUrl: "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=900&q=80",
    visibility: "public",
    copyCount: 184,
    featured: false,
    creator: seedCreators[3]
  },
  {
    title: "Premium Competitor Teardown System",
    description: "Analyze competitor websites, offers, positioning, and conversion gaps in a reusable format.",
    content:
      "You are a competitive intelligence analyst. Compare PromptBase, FlowGPT, and curated Notion prompt libraries against PromptHive. Return a positioning map, offer table, homepage teardown, pricing insight, messaging gaps, acquisition angles, and ten experiments ranked by expected impact.",
    category: "Marketing",
    aiTool: "Gemini",
    tags: ["competitor", "conversion", "strategy"],
    difficulty: "Pro",
    thumbnailUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80",
    visibility: "private",
    copyCount: 238,
    featured: true,
    creator: seedCreators[1]
  }
];

await Prompt.deleteMany({ "creator.email": { $in: seedCreators.map((item) => item.email) } });
const created = await Prompt.insertMany(
  prompts.map((prompt) => ({
    ...prompt,
    status: "approved",
    creator: prompt.creator ?? creator
  }))
);

await Review.deleteMany({ "user.email": env.DEFAULT_ADMIN_EMAIL });
await Review.insertMany(
  created.slice(0, 4).map((prompt, index) => ({
    promptId: prompt._id,
    rating: [5, 5, 4, 5][index],
    comment: "Practical, polished, and easy to adapt for real client work.",
    user: creator
  }))
);

console.log("Seed complete");
console.log(`Admin email: ${env.DEFAULT_ADMIN_EMAIL}`);
console.log(`Admin password: ${env.DEFAULT_ADMIN_PASSWORD}`);
process.exit(0);
