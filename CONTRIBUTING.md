# Contributing

Thanks for taking the time to contribute. Here's how to get set up and what to expect.

---

## Local setup

```bash
git clone https://github.com/Nyiko-Shabangu/lean-stack.git
cd lean-stack
npm install
cp .env.local.example .env.local
# Fill in the required env vars, then:
npm run dev
```

---

## Submitting a change

1. Fork the repo
2. Create a branch: `git checkout -b feat/your-feature-name`
3. Make your changes
4. Run the checks: `npm run lint && npm run type-check`
5. Commit using [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat: add document chunking helper`
   - `fix: resolve rate limit race condition`
   - `docs: update Pinecone setup steps`
6. Push and open a pull request against `main`

---

## What makes a good PR

- Keeps scope tight — one concern per PR
- Includes a clear description of what changed and why
- Doesn't break existing types or linting
- Updates the README if the change affects setup or usage

---

## Reporting a bug

Open an issue using the **Bug Report** template. Include:
- What you expected to happen
- What actually happened
- Steps to reproduce
- Node.js version and OS

---

## Questions

Open a Discussion — not an Issue — for general questions.
