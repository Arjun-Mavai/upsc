# 🌿 Zenscroll (formerly Mindful)

**Turn Doomscrolling into Mindful Scrolling.**

Zenscroll is a premium digital sanctuary designed to replace the cheap dopamine of social media with the serotonin of wisdom. Instead of endless feeds of noise, swipe through curated insights from history's greatest minds in Spirituality, Business, Philosophy, and Science.

![UPSC Zen Demo](public/images/project-upscimage.png)
_(Note: Replace with actual screenshot)_

## ✨ Features

- **🧠 Mindful Swiping**: Tinder-style interface designed for focus, not addiction. Swipe right to save wisdom, left to let go.
- **🎨 Zen Mode**: Toggle between a vibrant daylight mode and a deep, ambient "Zen Mode" for night-time reflection.
- **🔒 Premium Categories**: Exclusive access to "Ted Wisdom" and "Scientific Proven" facts (Paywall integrated).
- **👤 Smart Profiling**: Tracks your daily swipes and saved collection.
- **⚡ Performance First**: Built with Next.js Server Components for lightning-fast data fetching.
- **🔍 Deep Filtering**: Filter wisdom not just by Category (e.g., Stoicism), but also by specific Authors (e.g., Marcus Aurelius).

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server Components)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Custom Design System
- **Animation**: Framer Motion (Spring Physics, AnimatePresence)
- **Database**: Supabase (PostgreSQL)
- **State Management**: Zustand
- **Icons**: Lucide React

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Supabase Account

### Installation

1.  **Clone the repository**

    ```bash
    git clone https://github.com/Arjun-Mavai/zenscroll.git
    cd zenscroll
    ```

2.  **Install dependencies**

    ```bash
    npm install
    ```

3.  **Set up Environment Variables**
    Create a `.env.local` file:

    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    SUPABASE_SERVICE_ROLE_KEY=your_service_role_key # Only for seeding
    ```

4.  **Seed the Database**
    Populate your database with the initial curated quotes:

    ```bash
    npx tsx src/scripts/seed.ts
    ```

5.  **Run the App**
    ```bash
    npm run dev
    ```

## 🤝 Contribution

This is an open initiative to make the internet a calmer place. Feel free to open PRs for new features or bug fixes.

## 📄 License

MIT.

---

_Crafted with ❤️ by Arjun Mavai._

Bilkul bhai 😄
Maine **tumhara poora Turso + Local Sync + Drizzle + Migration + Workflow** content ko ekdum **clean professional Markdown (.md)** format me convert kar diya hai.

👉 **Direct copy → README.md / docs.md / Notion / GitHub use kar sakta hai**

---

# 🚀 Turso + Local SQLite + Drizzle Migrations

## Complete Dev Workflow Guide (Zero → Pro Level)

---

# 🧠 Big Picture (Feel First)

Socho:

### 🎨 Original Painting = Cloud DB (Production)

### 🖨️ Photocopy = Local DB

👉 Tum **photocopy pe experiment karte ho**
👉 Original safe rehta hai

Yahi hai:

```
Branching / Sync / Local Dev
```

---

---

# 📦 PART 1 — Turso Local Setup

---

## ✅ Step 1 — SQLite Installed hai ya nahi?

```bash
sqlite3 --version
```

Agar error:

### Mac

```bash
brew install sqlite
```

---

---

## ✅ Step 2 — Cloud se Data Dump lo

👉 Production DB ka **recipe (SQL file)** nikalo

```bash
turso db shell <db-name> .dump > data_backup.sql
```

### Result:

```
data_backup.sql
```

Isme:

- tables
- schema
- data
  sab likha hota hai

---

---

## ✅ Step 3 — Local SQLite file banao

```bash
sqlite3 my_local_db.db < data_backup.sql
```

### Result:

```
my_local_db.db
```

👉 Full local copy ready

---

---

## ✅ Step 4 — Turso ko Local Mode me chalao

```bash
turso dev --db-file my_local_db.db
```

### Output:

```
Listening on http://127.0.0.1:8080
```

⚠️ Terminal band mat karo

---

---

## ✅ Step 5 — TablePlus / Beekeeper Connect

| Setting  | Value                                          |
| -------- | ---------------------------------------------- |
| Driver   | libSQL                                         |
| Host     | [http://127.0.0.1:8080](http://127.0.0.1:8080) |
| User     | (blank)                                        |
| Password | (blank)                                        |

---

---

# 🧠 Quick Summary

| What       | File            |
| ---------- | --------------- |
| Cloud dump | data_backup.sql |
| Local DB   | my_local_db.db  |
| Run server | turso dev       |

---

---

# 🚀 PART 2 — Drizzle Migrations (Most Important 🔥)

---

# 🧠 Feel the Concept First

## Structure vs Data

### Structure (Schema)

- tables
- columns
- relations

### Data

- users
- posts
- records

---

### Migration = Structure Sync only

👉 Data ko touch nahi karta
👉 Sirf design change karta hai

---

---

# 🔥 Drizzle Commands Deep Meaning

---

## 🟢 `generate` (Architect)

```bash
npx drizzle-kit generate
```

### Kya karta hai?

👉 schema.ts compare karta hai
👉 difference detect karta hai
👉 SQL file banata hai

Example:

```
ALTER TABLE users ADD COLUMN age INTEGER;
```

### Output:

```
drizzle/
  0001_add_age.sql
```

---

---

## 🔵 `migrate` (Worker)

```bash
npx drizzle-kit migrate
```

### Kya karta hai?

👉 sab pending SQL files run karta hai
👉 DB update karta hai

---

### Internal Magic

Drizzle ek table banata hai:

```
drizzle_migrations
```

Isme track hota hai:

```
0001 ✓ done
0002 ✓ done
0003 pending
```

👉 duplicate run nahi hota

---

---

# 🔥 Real Cases (Feel karo)

---

## Add Column

```ts
age: integer();
```

Migration:

```sql
ALTER TABLE users ADD COLUMN age;
```

Result:

```
data safe
new column NULL
```

---

---

## Delete Column ⚠️

```sql
ALTER TABLE users DROP COLUMN age;
```

Result:

```
age ka sara data gaya permanently
```

---

---

## Add Table

```sql
CREATE TABLE orders;
```

Safe ✅

---

---

## Drop Table ⚠️

```sql
DROP TABLE users;
```

Sab data gaya ❌

---

---

# 🚀 PART 3 — Vercel Deployment Flow

---

## Normal Dev Flow

### Step 1

Edit schema.ts

### Step 2

```bash
npx drizzle-kit generate
```

### Step 3

```bash
git push
```

---

---

# Production me migration kaise chalegi?

## Best Practice

### package.json

```json
{
  "build": "drizzle-kit migrate && next build"
}
```

---

## Vercel Flow

```
Deploy start
   ↓
drizzle-kit migrate
   ↓
DB updated
   ↓
Next build
   ↓
Site live
```

---

👉 Sirf pending migrations run hoti hain
👉 order me run hoti hain

---

---

# 🧠 Super Important Rule

```
generate → create instruction
migrate → execute instruction
```

---

---

# 🚀 PART 4 — Turso Sync Scripts (Automation)

---

## 🔥 db-sync (Cloud → Local)

```bash
db-sync() {
SOURCE_DB="mppsc-test-series"

TS=$(date +%m%d%H%M)
BACKUP_NAME="bkp-mppsc-${TS}"

echo "☁️ Backup creating..."
turso db create "$BACKUP_NAME" --from-db "$SOURCE_DB"

echo "📥 Dumping..."
turso db shell "$SOURCE_DB" .dump > temp_dump.sql

echo "💻 Refreshing local..."
rm -f local_test.db
sqlite3 local_test.db < temp_dump.sql
rm temp_dump.sql

echo "✅ Done!"
}
```

---

---

## 🔥 db-sync-all (Pro version)

```bash
db-sync-all() {
SOURCE_DB="mppsc-test-series-arjun-gurjar"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

echo "☁️ Creating backup..."
turso db create "backup-${SOURCE_DB}-${TIMESTAMP}" --from-db $SOURCE_DB

echo "📥 Dumping..."
turso db shell $SOURCE_DB .dump > temp_dump.sql

echo "💻 Refreshing local..."
rm -f local_test.db
sqlite3 local_test.db < temp_dump.sql
rm temp_dump.sql

echo "✅ Local ready!"
}
```

---

---

# 🔥 Cloud overwrite (Use carefully)

```bash
db-push-to-cloud() {
SOURCE_DB="mppsc-test-series-arjun-gurjar"

echo "⚠️ Overwriting cloud..."
turso db shell $SOURCE_DB < local_test.db

echo "🚀 Done!"
}
```

---

---

# 🚀 PART 5 — Drizzle Config

```ts
import { defineConfig } from 'drizzle-kit';

const isDev = process.env.NODE_ENV === 'development';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: isDev ? 'sqlite' : 'turso',
  dbCredentials: {
    url: isDev ? 'file:local_test.db' : process.env.TURSO_DATABASE_URL,
    authToken: isDev ? undefined : process.env.TURSO_AUTH_TOKEN,
  },
});
```

---

---

# 🔥 Final Dev Workflow (Golden Process)

## Daily Routine

### Start

```bash
db-sync-all
npm run dev
```

## to handle the nextjs cache issues locally

# Full cleanup

- rm -rf .next node_modules/.cache
  rm -rf .next node_modules/.cache .turbo

why .turbo ?

Bhai, ye same Turbopack cache corruption issue hai! Tumne bahut saare files edit kiye hain (10+ files), toh cache completely corrupt ho gaya hai.

Quick Fix:

bash
rm -rf .next node_modules/.cache
npm run dev
Ye error code me koi problem nahi hai — sirf Next.js ka internal Turbopack database corrupt ho gaya hai.

Kya hua:

Tumne bahut saare files ek saath edit kiye (navbar, analytics, error pages, etc.)
Turbopack ka cache database (.next folder) confused ho gaya
SST files (sorted string table) missing ho gayi
Solution:

Dev server stop karo (Ctrl+C)
.next folder delete karo
Dev server restart karo
Tumhare saare changes safe hain! Sirf cache issue hai. 🚀

Agar phir bhi problem ho toh full cleanup:

bash
rm -rf .next node_modules/.cache .turbo
npm run dev

- npm run dev

### Work

- change schema
- generate
- migrate

## 🚨 Production Safety Rule (Must Follow)

- Never run `db:push` on production DB.
- Use only migration flow:

```bash
npm run db:generate
npm run db:migrate
```

Why:

- `drizzle-kit push` can try to drop tables that exist in DB but are not represented in `schema.ts` (for example FTS virtual tables like `questions_fts*`).
- `migrate` only runs explicit SQL migration files, so unmanaged tables are not dropped unless you intentionally write a drop statement.

## ✅ Simple Safe Process (Basics)

### 1) Daily Development (Local)

```bash
# 1. schema.ts change karo
npm run db:generate

# 2. local ya target DB par apply karo
npm run db:migrate
```

### 2) Production Deployment

```bash
# code + migration file commit karo
git push

# deploy environment par
npm run db:migrate
npm run build
```

### 3) Never Do This on Production

```bash
npm run db:push
```

`db:push` drift detect karke unknown tables (jaise `questions_fts*`) drop suggest kar sakta hai.

## 🧠 Migration Kya Hai?

Migration ek SQL instruction file hoti hai jo batati hai:

- kaunsa table/column add hua
- kaunsa index/constraint change hua

Simple words:

- `db:generate` = instruction banana
- `db:migrate` = instruction chalana

## 🎁 Migration ke Benefits

- Safe and predictable DB changes
- Team sync (sab same order me same changes chalate hain)
- Audit trail (kab kya change hua clear rehta hai)
- Deploy friendly (pending migrations hi run hoti hain)
- Data-loss risk kam (push ke accidental drops avoid hote hain)

## 🔒 Current Project Guard

Project me `db:push` par guard laga hua hai.

- Cloud/prod target par by default block hota hai.
- Sirf intentional override se chalega:

```bash
ALLOW_DB_PUSH=true npm run db:push
```

Use this only for special/manual maintenance, normal workflow ke liye nahi.

### Deploy

```bash
git push
```

Vercel:

```
auto migrate → build → live
```

---

---

# 🎯 Final Feel (Remember this forever)

```
Schema change = Migration
Data change = Manual

generate = instruction file
migrate = run instruction

Local = playground
Cloud = original painting
```

---

---

# ✅ Done

Bhai ab:

- Turso branching
- dump restore
- drizzle migrations
- vercel flow
- full sync system

sab crystal clear ho gaya hona chahiye 😄

Agar bole toh next:
👉 Docker setup
👉 seed scripts
👉 prod/staging/local pipeline diagram
👉 ya live demo style walkthrough

bol de 🔥

// mysql postgresql branching ka kya matlab hai

https://share.google/aimode/IhUIU2VLPWBrRVC61

Bilkul bhai 👍
Maine tumhara pura content **clean + structured + professional Markdown (.md)** format me convert kar diya hai.
Direct GitHub README / docs / Notion / Obsidian / VSCode me paste kar sakte ho.

---

# 🚀 Database Branching & Debugging Guide

### (Turso vs MySQL vs Postgres — Practical Dev Workflow)

---

## 🧠 Big Picture

**Turso (SQLite)** me branching **built-in** hoti hai (Copy-on-Write).
**MySQL / Postgres** me branching **manual copy (Dump & Restore)** se karni padti hai.

👉 Matlab:

| DB             | Branching      |
| -------------- | -------------- |
| Turso          | ⚡ Instant     |
| MySQL/Postgres | 🐢 Manual copy |

---

# 🟢 1️⃣ Turso (SQLite) – Instant Branching

## How it works?

- Copy-on-Write technology
- Sirf changed pages copy hoti hain
- Full DB copy nahi hoti

## Result

```
1 second me branch ready
```

## Command

```bash
turso db create debug-branch --from prod
```

## Benefits

✅ Super fast
✅ Zero config
✅ No server
✅ Perfect for Next.js apps

---

# 🔵 2️⃣ MySQL / Postgres – Manual "Branching"

Yaha **true branching nahi hoti**,
hum **Database Copy** banate hain.

---

## 🟡 Postgres Method (Professional way)

Postgres me **TEMPLATE** aur **Dump/Restore** hota hai.

### Option A – Template clone (same server)

```sql
CREATE DATABASE debug_db TEMPLATE prod_db;
```

⚡ Very fast (same machine only)

---

### Option B – Dump & Restore (standard)

```bash
pg_dump → backup
pg_restore → copy
```

---

## 🔴 MySQL Method

MySQL me **direct clone feature nahi** hota.

Steps:

1. Dump lo
2. New DB banao
3. Restore karo

---

---

# 🧪 3️⃣ Live Debugging Workflow (Real Use-Case)

### Scenario:

👉 Production me bug aaya

### Steps:

```
1. Production DB ka snapshot lo
2. Local DB create karo
3. Snapshot restore karo
4. .env change karo
5. Debug safely
```

### Benefit

✅ Live site disturb nahi hoti
✅ Exact same data milta hai
✅ Safe testing

---

---

# 🛠️ 4️⃣ MySQL Sync Script (Alias)

```bash
# MySQL Sync Alias
mysql-sync() {
    USER="root"
    PASS="password"
    LIVE_DB="mppsc_prod"
    LOCAL_DB="mppsc_local"

    echo "📥 Dumping production..."

    mysqldump -u $USER -p$PASS $LIVE_DB > temp_prod.sql

    echo "💻 Refreshing local DB..."

    mysql -u $USER -p$PASS -e "DROP DATABASE IF EXISTS $LOCAL_DB; CREATE DATABASE $LOCAL_DB;"
    mysql -u $USER -p$PASS $LOCAL_DB < temp_prod.sql

    rm temp_prod.sql
    echo "✅ MySQL Local Sync Done!"
}
```

---

---

# 🛠️ 5️⃣ Postgres Sync Script (Fast & Pro)

```bash
# Postgres Sync Alias
pg-sync() {
    LIVE_URL="postgres://user:pass@host:port/dbname"
    LOCAL_DB="mppsc_local"

    echo "📥 Dumping production..."

    pg_dump -d $LIVE_URL -Fc -f prod_backup.dump

    echo "💻 Refreshing local DB..."

    dropdb --if-exists $LOCAL_DB
    createdb $LOCAL_DB
    pg_restore -d $LOCAL_DB prod_backup.dump

    rm prod_backup.dump
    echo "✅ Postgres Local Sync Done!"
}
```

---

---

# ⚖️ 6️⃣ Deep Comparison

| Feature    | Turso (SQLite) | MySQL/Postgres |
| ---------- | -------------- | -------------- |
| Speed      | ⚡ Instant     | 🐢 Slow        |
| Branching  | Built-in       | Manual         |
| Setup      | Zero           | Server install |
| Complexity | Very Low       | Medium/High    |
| Cost       | Storage based  | Server CPU/RAM |
| Dev UX     | Super smooth   | Heavy          |

---

---

# 🎯 Final Summary

## ✅ Turso use karo if:

- Small/medium apps
- Next.js projects
- Fast dev cycle chahiye
- Zero infra

## ✅ Postgres/MySQL use karo if:

- Huge traffic
- Complex joins
- Enterprise scale
- Heavy analytics

---

---

# 💡 Bhai ki Advice

👉 Agar lakhon users nahi hain
👉 Next.js app hai
👉 Fast debugging chahiye

### 👉 Turso = ❤️

---

---

# 🐳 Bonus Tip (Important)

MySQL/Postgres local manage karna ho?

### Use Docker 👇

```bash
docker-compose up -d
```

Benefits:
✅ No local install mess
✅ Clean setup
✅ Same environment everywhere

---

---

# 🔥 Quick Commands Cheat Sheet

## Turso

```bash
turso db create debug --from prod
```

## MySQL

```bash
mysql-sync
```

## Postgres

```bash
pg-sync
```

---

---

# ✅ Done

Ye markdown:

- README ready
- Docs ready
- GitHub ready
- Team sharing ready

---

Agar chaho bhai:
👉 main iska **Docker Compose file** bhi bana du
👉 ya **Turso vs Postgres decision flowchart**
👉 ya **prod → staging → local pipeline**

bol de, bana dete hain 🔥

## revalidation guide

Bhai, Next.js Cache Revalidation seekhne ke liye ye lo poora guide.

Kaise kaam karta hai: Next.js pages ko "Static" bana ke cache kar leta hai taaki website fast chale. Jab database me kuch change hota hai (jaise new blog), to purana cache hatana padta hai. Isko bolte hain Revalidation.

Humare paas ek Magic API Route hai: src/app/api/revalidate/route.ts

Manual Revalidate Karne Ka Tareeka (Script): Terminal me ye command run karo to poora Blog Cache clear ho jayega:

bash
curl -X POST https://mppsc.zenscroll.app/api/revalidate \
 -H "Content-Type: application/json" \
 -d '{"secret": "YOUR_ADMIN_SECRET", "tag": "blogs-list"}'
(Note: YOUR_ADMIN_SECRET wo hai jo .env me ADMIN_SECRET ke naam se hai)

Code me kaise hota hai? Agar future me khud code me karna ho (jaise Admin Panel me "Save" button dabane par), to ye function use karte hain:

typescript
import { revalidateTag } from 'next/cache';
// Jab bhi naya blog save ho, ye call kar do
revalidateTag('blogs-list');
revalidateTag('blog-my-slug');
Example Script (clear-cache.ts) bana doon taaki bas command run karke clear ho jaye?

jaccardy similarity

'use server';

import { db } from '@/db';
import { tests, questions, pyqQuestionTopics, pyqTopics } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { getScopedStateServiceYear, PYQ_SCOPE_START_YEAR, PYQ_SCOPE_END_YEAR } from '@/features/tests/utils/pyq-scope';

export interface RepeatedQuestion {
questionId: string;
text: string;
textEn?: string | null;
occurrences: { year: number; qNo: number }[];
count: number;
topics: { id: string; name: string; nameEn?: string | null }[];
}

export async function getRepeatedQuestions(): Promise<RepeatedQuestion[]> {
try {
// 1. Fetch all PYQ tests and extract years
const pyqTests = await db.select({
id: tests.id,
title: tests.title,
type: tests.type,
totalQuestions: tests.totalQuestions,
}).from(tests).where(eq(tests.type, 'PYQ'));

    const testYearMap = new Map<string, number>();

    // Group tests by year to pick canonical one
    const testsByYear = new Map<number, typeof pyqTests>();

    for (const t of pyqTests) {
      // Use the utility function for robust year extraction
      const year = getScopedStateServiceYear(t.title);

      if (year && year >= PYQ_SCOPE_START_YEAR && year <= PYQ_SCOPE_END_YEAR) {
        if (!testsByYear.has(year)) testsByYear.set(year, []);
        testsByYear.get(year)!.push(t);
      }
    }

    // Select best test for each year (Prefer Hindi 'MPPSC राज्य सेवा' and most questions)
    const selectedTestIds = new Set<string>();

    for (const [year, candidates] of testsByYear.entries()) {
        // Sort candidates:
        // 1. Prefer Hindi titles containing "MPPSC राज्य सेवा"
        // 2. Prefer higher question count (to avoid partial tests)
        candidates.sort((a, b) => {
            const isHindiA = a.title.includes('MPPSC राज्य सेवा');
            const isHindiB = b.title.includes('MPPSC राज्य सेवा');

            if (isHindiA && !isHindiB) return -1;
            if (!isHindiA && isHindiB) return 1;

            // If both same language preference, pick larger test
            return (b.totalQuestions || 0) - (a.totalQuestions || 0);
        });

        // Pick the first one (Canonical)
        if (candidates.length > 0) {
            const bestTest = candidates[0];
            testYearMap.set(bestTest.id, year);
            selectedTestIds.add(bestTest.id);
        }
    }

    // Safety check
    if (selectedTestIds.size === 0) return [];

    // 2. Fetch all questions for these tests
    const relevantTestIds = Array.from(selectedTestIds);

    if (relevantTestIds.length === 0) return [];

    const allQuestions = await db.select({
      id: questions.id,
      testId: questions.testId,
      text: questions.questionText,
      textEn: questions.questionTextEn,
      order: questions.order,
    }).from(questions).where(inArray(questions.testId, relevantTestIds));

    // 3. Group by Semantic Similarity (Jaccard Token Overlap)
    // We'll treat questions as nodes in a graph, edges are similarity > threshold
    // Then find connected components (clusters)

    const STOP_WORDS = new Set([
      'the', 'is', 'at', 'of', 'on', 'and', 'a', 'an', 'in', 'to', 'for', 'with', 'by', 'from', 'up', 'about', 'into', 'over', 'after',
      'ka', 'ki', 'ke', 'hai', 'tha', 'thi', 'the', 'ko', 'se', 'me', 'mein', 'par', 'aur', 'evam', 'tatha', 'kya', 'kaun', 'kis',
      'nimn', 'likhit', 'nimnalikhit', 'kathan', 'sahi', 'galat', 'hai', 'h', 'question', 'answer', 'option', 'match', 'following',
      'consider', 'statements', 'regarding', 'which', 'correct', 'incorrect', 'saty', 'asatya', 'nahi', 'not', 'true', 'false',
      'what', 'when', 'where', 'why', 'how', 'does', 'do', 'did', 'was', 'were', 'are', 'none', 'above', 'all', 'both', 'only'
    ]);

    const getTokens = (text: string) => {
        if (!text) return new Set<string>();
        // Extract 2-4 digit numbers (years, articles) to preserve them
        const numbers = text.match(/\b\d{2,4}\b/g) || [];

        const words = text.toLowerCase()
            .replace(/[^\w\u0900-\u097F\s]/g, '')
            .split(/\s+/)
            .filter(t => t.length > 2 && !STOP_WORDS.has(t));

        return new Set([...words, ...numbers]);
    };

    const calculateSimilarity = (t1: Set<string>, t2: Set<string>) => {
        if (t1.size === 0 || t2.size === 0) return 0;
        let intersection = 0;

        for (const token of t1) {
            if (t2.has(token)) intersection++;
        }

        const union = new Set([...t1, ...t2]).size;
        let score = intersection / union; // Base Jaccard

        // --- INTELLIGENT BOOSTING ---

        // 1. Significant Word Boost: If they share 3+ complex words (len > 4)
        let significantMatches = 0;
        for (const token of t1) {
            if (t2.has(token) && token.length > 4 && !/^\d+$/.test(token)) significantMatches++;
        }
        if (significantMatches >= 3) score += 0.25;

        // 2. Numeric/Data Boost: Years, Article numbers often indicate same topic
        let numericMatches = 0;
        for (const token of t1) {
             if (t2.has(token) && /^\d+$/.test(token)) numericMatches++;
        }
        if (numericMatches >= 1) score += 0.15 * numericMatches;

        return Math.min(score, 1.0);
    };

    // 4. Clustering (Semantic Grouping)
    const processedQuestions = allQuestions.map(q => ({
        ...q,
        tokens: getTokens((q.text || '') + ' ' + (q.textEn || '')),
        year: testYearMap.get(q.testId)!,
        visited: false
    }));

    const result: RepeatedQuestion[] = [];

    // Iterate through all questions to find clusters
    for (let i = 0; i < processedQuestions.length; i++) {
        if (processedQuestions[i].visited) continue;

        // Start a new cluster with current question
        const cluster = [processedQuestions[i]];
        processedQuestions[i].visited = true;

        // Grow the cluster by finding similar questions
        // Use a queue-like approach (though simple iteration over remaining works for small N)
        // We only look forward to avoid double processing
        for (let j = i + 1; j < processedQuestions.length; j++) {
            if (!processedQuestions[j].visited) {
                // Similarity Check
                const sim = calculateSimilarity(processedQuestions[i].tokens, processedQuestions[j].tokens);

                // Aggressive Threshold: 0.45 (was 0.6)
                // This allows ~45% overlap, but with boosts it catches "Conceptual" repeats
                if (sim >= 0.45) {
                    processedQuestions[j].visited = true;
                    cluster.push(processedQuestions[j]);
                }
            }
        }

        // Only keep if cluster spans multiple years
        const years = new Set(cluster.map(c => c.year));
        if (years.size > 1) {
            // Sort cluster by year desc to pick representative
            cluster.sort((a, b) => b.year - a.year);
            const representative = cluster[0];

            // Build occurrences list
            const occurrences = cluster.map(c => ({
                year: c.year,
                qNo: c.order
            })).sort((a, b) => b.year - a.year);

            // Collect all IDs for topic lookup
            const ids = cluster.map(c => c.id);

            result.push({
                questionId: representative.id,
                text: representative.text || '',
                textEn: representative.textEn,
                occurrences: occurrences,
                count: years.size, // Count of UNIQUE years
                topics: [],
                // We need to pass ids to the next step, so add it to the object
                // But RepeatedQuestion interface doesn't have ids, we'll use it just for logic
                // Actually, I should update the interface or just use a temporary object
            });
            // Attach ids temporarily to result item for topic lookup
            (result[result.length - 1] as any).ids = ids;
        }
    }

    // Sort by count desc
    result.sort((a, b) => b.count - a.count);

    // 5. Fetch topics for top 100 repeated questions
    // 'result' already contains the processed repeated questions with 'ids' attached as any
    const topRepeated = result.slice(0, 100);

    // Flatten all question IDs from clusters to fetch topics
    const questionIds = topRepeated.flatMap(r => (r as any).ids as string[]);

    // We do NOT need to redefine result, we just modify topRepeated in place or filter result
    // But topRepeated is a slice, so modifying it won't affect the original 'result' array if we return 'result'
    // But we probably want to return topRepeated only? The function returns RepeatedQuestion[]

    // Let's use topRepeated as the base for return

    if (questionIds.length > 0) {
        const topics = await db.select({
            questionId: pyqQuestionTopics.questionId,
            topicId: pyqTopics.id,
            topicTitle: pyqTopics.topicTitle,
            topicTitleEn: pyqTopics.topicTitleEn
        })
        .from(pyqQuestionTopics)
        .innerJoin(pyqTopics, eq(pyqQuestionTopics.topicId, pyqTopics.id))
        .where(inArray(pyqQuestionTopics.questionId, questionIds));

        // Map questionId -> topics
        const topicMap = new Map<string, {id: string, name: string, nameEn?: string | null}[]>();
        for (const t of topics) {
            if (!topicMap.has(t.questionId)) topicMap.set(t.questionId, []);
            topicMap.get(t.questionId)!.push({
                id: t.topicId,
                name: t.topicTitle,
                nameEn: t.topicTitleEn
            });
        }

        // Assign topics to result (aggregating from all questions in cluster)
        for (const r of topRepeated) {
            const clusterIds = (r as any).ids as string[];
            const clusterTopics = new Map<string, {id: string, name: string, nameEn?: string | null}>();

            for (const id of clusterIds) {
                const ts = topicMap.get(id);
                if (ts) {
                    ts.forEach(t => clusterTopics.set(t.id, t));
                }
            }

            r.topics = Array.from(clusterTopics.values());
            // Clean up temporary property
            delete (r as any).ids;
        }
    }

    return topRepeated;

} catch (error) {
console.error('Error fetching repeated questions:', error);
return [];
}
}

rm src/actions/pyq-analytics.ts

● Todo added Refactor PYQ Intelligence

● ✅ Refactoring Complete!

Before vs After

┌─────────────┬────────────────┬───────────────────────────────┐
│ Metric │ Before │ After │
├─────────────┼────────────────┼───────────────────────────────┤
│ Main file │ 1008 lines │ 80 lines │
├─────────────┼────────────────┼───────────────────────────────┤
│ Components │ 1 monolith │ 10 focused components │
├─────────────┼────────────────┼───────────────────────────────┤
│ Reusability │ None │ High (shared across sections) │
└─────────────┴────────────────┴───────────────────────────────┘

New Component Structure

components/
├── PYQHeader.tsx (47 lines) - Sticky header
├── PYQMenu.tsx (154 lines) - Navigation menu  
 ├── OverallWeightage.tsx (101 lines) - Combined stats
├── PaperAnalysis.tsx (140 lines) - Year-wise view
├── MostRepeatedTopics.tsx (198 lines) - Topic patterns
├── UnitCard.tsx (123 lines) - Reusable unit card
├── QuestionItem.tsx (276 lines) - Inline question display
└── shared/
├── ExpandableCard.tsx (84 lines) - Generic accordion
├── UnitBadge.tsx (78 lines) - Color badges
└── constants.ts (23 lines) - Colors config

Key Improvements

1.  DRY: UnitCard reused in 3 sections (Overall, Paper, Topics)
2.  KISS: Each component does one thing well
3.  Inline Questions: Click expands question with options - no navigation away
4.  Grouped by Year: Questions inside units show year headers
5.  Better UX: User stays on page, can browse all 30 questions easily

Build verified ✅

important pyq data and their ids

● Now I have verified the exact 6 canonical tests from PROD DB:

- 2020: 5KRVTgTIw07bWNxu20YNl (100 Qs, Q1-Q100)
- 2021: ix0FnJV496Rgvw0YHOEFj (100 Qs, Q1-Q100)
- 2022: o_rO3J1tSEACKENOLT9QI (100 Qs, Q1-Q100)
- 2023: mQ1a9hZoTdfSRfkz40K5C (100 Qs, Q1-Q100)
- 2024: 3XmZ0l700BJV3j2FLd0XZ (100 Qs, Q1-Q100)
- 2025: D0gf6bklgl3RT-sTnue2n (100 Qs, Q1-Q100)

## pdf feature

PDF Downloads Feature Architecture
This document outlines how the MPPSC PDF Downloads feature is architected in your codebase.

1. Directory Structure
   The feature spans across the client frontend, server API routes, and backend PDF generation logic:

plaintext
src/
├── app/
│ ├── pdf-downloads/
│ │ ├── page.tsx # Server Component: Renders the download page and fetches metadata
│ │ └── PDFDownloadClient.tsx # Client Component: Renders the UI buttons and handles the fetch() call to download the PDF
│ └── api/
│ └── pdf/
│ ├── demo/download/route.ts # API Route: Handles GET requests for the Demo PDF
│ └── full/download/route.ts # API Route: Handles GET requests for the Full PDF
├── lib/
│ └── pdf/
│ ├── generator.ts # Core PDF Generation Logic: Uses @react-pdf/renderer to create the buffer
│ ├── data/
│ │ └── pdf-questions.ts # Data Access Layer: Uses Drizzle ORM to fetch formatting questions from DB
│ └── components/ # PDF UI Components (React-PDF)
│ ├── MPPSCPDFDocument.tsx # Main PDF Layout
│ ├── PDFCoverPage.tsx # Cover Page Template
│ ├── PDFQuestion.tsx # Question Layout Template
│ └── PDFAnswerKey.tsx # Answer Key Layout 2. Execution Flow
Here is the step-by-step flow from the moment the user clicks the "Download" button to the moment the PDF starts downloading in their browser:

User Interaction: The user clicks the download button in
PDFDownloadClient.tsx
.
Client Fetch: The React component makes a request: fetch('/api/pdf/demo/download?lang=en').
API Route Hit: Next.js routes the request to
src/app/api/pdf/demo/download/route.ts
.
Validation: The route controller validates the request (checks for valid language and type).
Generation Triggered: The route calls
generateDemoPDF('en')
from
generator.ts
.
Data Fetching:
generator.ts
calls
getDemoPYQQuestions()
from
pdf-questions.ts
.
Under the hood, this uses Drizzle ORM (db.select().from(questions)) to pull raw data from the questions table in your SQLite database.
Document Assembly:
generator.ts
passes the retrieved question data into
MPPSCPDFDocument
, returning a React-PDF component tree.
Buffer Stream: pdf(pdfDoc).toBuffer() compiles the React tree into a raw binary PDF buffer.
Response: The API route returns the buffer using a NextResponse with the Content-Type: application/pdf heading and a Content-Disposition attachment heading.
Browser Download:
PDFDownloadClient.tsx
takes the blob response, creates an ephemeral object URL (window.URL.createObjectURL(blob)), simulates an invisible <a> click, and the file saves to the user's local disk. 3. The Underlying Bug (Resolved) 🐛
The reason you were receiving a 500 Internal Server error output in the browser—despite the page superficially rendering 200 OKs—boiled down to a silent crash during Step 6 (Data Fetching).

The Root Cause
Inside
src/lib/pdf/data/pdf-questions.ts
, there was a broken module import pointing to the wrong directory:

typescript
// ❌ BROKEN (Module Not Found)
import { CANONICAL_TEST_IDS } from "../pyq-constants";
Because Next.js Turbopack failed to resolve the module silently across the boundary, CANONICAL_TEST_IDS was evaluated dynamically as undefined.

When the execution reached:

typescript
const testIds = Object.values(CANONICAL_TEST_IDS);
JavaScript fundamentally blocks you from calling Object.values on undefined, which immediately threw a TypeError. This error crashed the Drizzle operation internally resulting in the cryptic Cannot convert undefined or null to object logs that popped up.

The Fix
It was a simple fix of re-routing the import using your root alias!

typescript
// ✅ FIXED
import { CANONICAL_TEST_IDS } from "@/lib/pyq-constants";

1. Don’t assume. Don’t hide confusion. Surface tradeoffs.

2. Minimum code that solves the problem. Nothing speculative..

3. Touch only what you must. Clean up only your own mess.

4. Define success criteria. Loop until verified.

---

## 🔐 Local Admin Credentials

These credentials are used to access the admin dashboard in the **Local Environment** (`mppsc_local_dev.db`).

- **Email**: `admin@zenscroll.app`
- **Password**: `ZenAdmin@123`
- **Role**: `admin`
- **Access**: `Combo` (Full Access)
