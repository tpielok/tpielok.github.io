# tpielok.github.io

GitHub Pages Jekyll site for `https://tpielok.github.io`.

## Deployment

### Deploy on GitHub

For a user site (`<username>.github.io`), GitHub Pages builds from the repository root by default.
Push to the default branch and it will be published automatically.

## Local development

Use these commands on your own machine only.

1. Install Ruby + Bundler.
2. Install dependencies:
   - `bundle install`
3. Run locally on alternate port (default):
   - `.\start-local.ps1`
4. Open:
   - `http://127.0.0.1:4001`

Optional custom ports:
- `.\start-local.ps1 -Port 4002 -LiveReloadPort 35731`