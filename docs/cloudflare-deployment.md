# Cloudflare Pages Deployment

This document explains how to set up automatic deployment of Storybook to Cloudflare Pages.

## Prerequisites

1. A Cloudflare account
2. A GitHub repository with Storybook

## Setup Steps

### 1. Create Cloudflare Pages Project

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Pages** > **Create a project**
3. Choose **Connect to Git**
4. Select your GitHub repository
5. Configure the build settings:
   - **Framework preset**: None
   - **Build command**: `cd packages/storybook && pnpm run build`
   - **Build output directory**: `packages/storybook/storybook-static`
   - **Root directory**: `/` (leave empty)
6. **Project name**: `gridsheet-storybook` (this is the internal project name, not the domain)

### 2. Configure Custom Domain

1. After creating the project, go to **Custom domains**
2. Add your custom domain: `gridsheet-demo.walkframe.com`
3. Configure DNS settings as instructed by Cloudflare
4. The project will be accessible at your custom domain

### 3. Get Cloudflare API Token

1. Go to [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click **Create Token**
3. Use **Custom token** template
4. Set permissions:
   - **Zone**: Include > All zones
   - **Account**: Include > All accounts
   - **User**: Include > All users
5. Set **Zone Resources** to **Include > All zones**
6. Create the token and copy it

### 4. Get Account ID

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Look at the URL or check the right sidebar
3. Copy your Account ID (32-character hex string)

### 5. Configure GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** > **Secrets and variables** > **Actions**
3. Add the following secrets:
   - `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token
   - `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare Account ID

### 6. Configure Environment Variables (Optional)

In Cloudflare Pages project settings, you can add environment variables:

- `NODE_VERSION`: `18`
- `NPM_FLAGS`: `--legacy-peer-deps` (if needed)

## Project Structure

- **Project Name**: `gridsheet-storybook` (internal Cloudflare Pages project name)
- **Custom Domain**: `gridsheet-demo.walkframe.com` (public URL)
- **Default Domain**: `gridsheet-storybook.pages.dev` (fallback URL)

## Workflow Details

The GitHub Actions workflow (`deploy-storybook.yaml`) will:

1. **Trigger**: On push to master/main branch or pull requests
2. **Build**: Install dependencies and build Storybook
3. **Deploy**: Upload the built files to Cloudflare Pages
4. **Preview**: Create preview deployments for pull requests

## Custom Domain Configuration

### DNS Settings

If you're using Cloudflare for DNS:

1. Add a CNAME record:
   - **Name**: `gridsheet-demo`
   - **Target**: `gridsheet-storybook.pages.dev`
   - **Proxy status**: Proxied (orange cloud)

### SSL/TLS Settings

1. Go to **SSL/TLS** settings in Cloudflare
2. Set **Encryption mode** to **Full (strict)**
3. Enable **Always Use HTTPS**

## Troubleshooting

### Build Failures

- Check the build logs in GitHub Actions
- Verify all dependencies are installed
- Ensure Storybook builds successfully locally

### Deployment Issues

- Verify API token has correct permissions
- Check Account ID is correct
- Ensure project name matches in workflow (`gridsheet-storybook`)

### Domain Issues

- Verify DNS settings are correct
- Check SSL/TLS configuration
- Ensure custom domain is properly configured in Cloudflare Pages

### Performance Issues

- Enable Cloudflare's CDN features
- Configure caching headers in `_headers` file
- Optimize Storybook bundle size

## Security

The deployment includes security headers:

- Content Security Policy (CSP)
- X-Frame-Options
- X-Content-Type-Options
- Referrer Policy
- Permissions Policy

## Monitoring

- Check deployment status in GitHub Actions
- Monitor Cloudflare Pages analytics
- Set up notifications for deployment failures
- Monitor custom domain performance 