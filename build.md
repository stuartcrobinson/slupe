# Publishing Slupe to NPM

https://claude.ai/chat/8e0781ed-345a-4363-a4c4-2a8f1302f502

## One-time Setup

1. **Create npm account** (if you don't have one):
   ```bash
   npm adduser
   ```

2. **Login to npm**:
   ```bash
   npm login
   ```

3. **Make build script executable**:
   ```bash
   chmod +x build.sh
   ```

## Publishing Process

### Option 1: Using npm scripts (Recommended)

```bash
# Full build and local test
npm run local-install

# Test the installed version
slupe --version

# If everything works, publish
npm publish
```

### Option 2: Using the build script

```bash
# Run the build script
./build.sh

# Test locally
npm install -g ./slupe-*.tgz

# Publish to npm
npm publish
```

### Option 3: Quick publish (if you trust your tests)

```bash
# This runs lint, tests, and build automatically
npm publish
```

## Version Management

Before publishing, update the version in `package.json`:

```bash
# Patch version (0.1.0 -> 0.1.1)
npm version patch

# Minor version (0.1.0 -> 0.2.0)
npm version minor

# Major version (0.1.0 -> 1.0.0)
npm version major
```

## Pre-publish Checklist

- [ ] Tests pass: `npm test`
- [ ] Linting passes: `npm run lint`
- [ ] TypeScript compiles: `npm run typecheck`
- [ ] README is up to date
- [ ] CHANGELOG is updated (if you have one)
- [ ] Version number is bumped
- [ ] Try local install: `npm run local-install`

## Troubleshooting

### Shebang Issues
The build process now automatically adds the shebang. If you still have issues:
```bash
npm run add-shebang
```

### Permission Errors
Make sure the built file is executable:
```bash
chmod +x dist/src/index.js
```

### Package Name Taken
If "slupe" is taken on npm, update the name in package.json to something like:
- `@yourusername/slupe`
- `slupe-cli`
- `slupe-tool`

## Continuous Deployment

For future automation, consider:
1. GitHub Actions for automated publishing on tagged releases
2. Semantic release for automatic versioning
3. Commitizen for standardized commit messages