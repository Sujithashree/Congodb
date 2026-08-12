# Deployment Notes

This project is ready for a GitHub repository handoff and a free-tier deployment flow.

## GitHub

Create a new empty repository on GitHub and push the current local repository:

```bash
git remote add origin <your-github-repo-url>
git branch -M main
git push -u origin main
```

## Backend hosting

Recommended free hosting targets:
- Render (FastAPI web service)
- Railway
- Fly.io
- Hugging Face Spaces (for lightweight Python API hosting where supported)

The API must receive the runtime values below as environment variables:

```bash
COGNODB_URI=bolt+s://<your-instance>.databases.cognodb.com
COGNODB_USERNAME=cognodb
COGNODB_PASSWORD=<your-password>
```

## Frontend hosting

The React build output can be hosted as a static site on:
- Netlify
- Vercel
- Cloudflare Pages

Set the API endpoint in the frontend build environment:

```bash
VITE_API_URL=https://<your-api-host>
```

## Demo recording

Record a short screen capture that shows the landing page, candidate recommendation flow, and skill-to-candidate flow.
