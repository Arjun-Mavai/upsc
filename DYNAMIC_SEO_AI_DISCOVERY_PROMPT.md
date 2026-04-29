# Dynamic SEO + AI Discovery Prompt (for any repo)

Use this prompt in each target repository separately (Repo 1, Repo 2).  
This is intentionally **analysis-first**, so output is repo-specific, not copy-paste.

---

## Master Prompt

```text
You are working inside this repository. Do a repo-specific SEO + AI discovery upgrade.

Primary goal:
Make this product clearly understandable to search engines and AI crawlers (LLMs), with accurate intent, key pages, and structured meaning.

Rules:
1) First analyze this repo deeply (routes, metadata, product domain, nav structure, docs, existing schema/robots/sitemap).
2) Do NOT use generic copy-paste text from another project.
3) All output must be generated from this repo's actual purpose, features, and URLs.
4) Keep changes minimal, high-signal, and production-safe.

What to implement:

A) Structured Data (JSON-LD)
- Audit existing JSON-LD in layout/pages.
- Add or improve schema.org objects based on the real product type:
  - Use only relevant types (examples: WebSite, Organization, SoftwareApplication, EducationalOrganization, Course, FAQPage, Article, BreadcrumbList, ItemList, Product, etc.).
- Add page-level JSON-LD on high-intent pages (home + top conversion pages + key content pages).
- Ensure:
  - clear product intent
  - audience/use-case clarity
  - meaningful feature/entity mapping
  - canonical URLs and consistent naming

B) llms.txt
- Create/update `/public/llms.txt` (or repo-equivalent public path).
- Include:
  - site identity
  - product intention
  - target users
  - core routes
  - important entities/features
  - discovery endpoints (`sitemap.xml`, `robots.txt`)
  - concise explanation of what this app is and is not
- Keep it factual and crawl-friendly.

C) robots + sitemap alignment
- Check robots rules and sitemap routes.
- Ensure key pages are crawlable, private/internal pages are protected.
- Align with the intent in structured data + llms.txt.

D) Navigation discoverability
- Ensure top nav reflects high-intent routes important for SEO/AI discovery.
- If asked to hide a menu item, do it in shared nav source so desktop/mobile both stay consistent.

E) Quality gates
- No TypeScript errors.
- No broken imports or invalid schema JSON.
- Keep existing behavior intact.

Execution workflow:
1) Analyze repo and produce a short "repo understanding" summary.
2) Propose exact files to update and why.
3) Apply edits.
4) Run type check/build/lint commands that already exist.
5) Commit with clear message.
6) Return:
   - changed files
   - key SEO/AI improvements
   - any assumptions made

Output constraints:
- Be concise and implementation-focused.
- Prefer deterministic edits over speculative text.
- If information is missing, infer from repository content (not from external assumptions).
```

---

## Fast usage for 2 repositories

1. Open Repo 1, run the **Master Prompt**, complete commit/push.  
2. Open Repo 2, run the same **Master Prompt** again (fresh analysis for that repo).  

Do not reuse llms.txt/schema text directly between repos unless both repos truly represent the same product intent.

