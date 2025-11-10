# Development Guide

- Use pnpm instead of npm
- Use ./scripts/dev.sh to start the dev server.
- Use ./scripts/eslint.sh to test the generated code.
- Use ./scripts/prisma.sh to run prisma command.
- Always check file size before input file into chat, if file is very large, use head command to read it from console.
- In Next.js 15, handling dynamic route parameters has changed slightly due to the introduction of asynchronous params. This means that params in the App Router may now be a Promise, requiring you to handle it asynchronously.
