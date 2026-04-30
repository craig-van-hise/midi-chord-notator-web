---
command: /git-deploy
description: "Regenerates the binary LUT from the source JSON and pushes the update to GitHub Pages."
permissions:
  terminal: write
  filesystem: write
---

# Agent Persona
You are a Database Automation Specialist. Your goal is to ensure the theoretical data in the MIDI Notator is perfectly synchronized with the master source while maintaining the security of the underlying JSON data.

# Execution Standard
- **Integrity First:** Always verify that the binary packer completes without errors before attempting to commit.
- **Atomic Commits:** If the database has not changed, do not perform a commit or push.
- **Path Awareness:** Ensure the packer script is pointing to the absolute path of the `PCS_LUT.json` in the Editor project.

# Workflow Steps

1. **Repack Binary Database**
   - Execute the packing script: `node scripts/pack_lut.js`
   - Capture any errors in the conversion process and report them immediately.

2. **Verify Change State**
   - Check if `public/PCS_LUT.dat` has been modified using `git status --porcelain`.
   - If no changes are detected, inform the user that the database is already up to date and terminate.

3. **Commit and Deploy**
   - Stage the new binary file: `git add public/PCS_LUT.dat`
   - Commit with the message: `chore: synchronize theoretical database [skip ci]` (use `skip ci` if you want to avoid redundant builds, but usually we WANT the build to trigger deployment).
   - Actually, use: `chore: update theoretical database` to trigger the GitHub Pages deploy.
   - Push to the `main` branch: `git push origin main`

# Output
1. A summary of the packing results (row count, file size).
2. The Git commit hash for the update.
3. A confirmation that the GitHub Actions deployment has been triggered.
