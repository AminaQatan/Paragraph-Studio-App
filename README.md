# Paragraph Studio

Created by: Ms. Amina Qatan

A colourful paragraph-writing app for students. This package includes the latest purple Introduction, yellow Body, and pink Conclusion highlights.

## Publish on GitHub Pages

1. Extract this ZIP.
2. Go to https://github.com/new and create a public repository named Paragraph-Studio. You can enable Add README to initialise the main branch.
3. Open the repository, choose Add file > Upload files, and upload the extracted files AND the assets folder. Keep index.html directly at the repository root. Upload the contents, not the ZIP or an enclosing folder. Commit the files to main.
4. Open Settings > Pages. Under Source, choose Deploy from a branch. Select main and /(root), then Save.
5. Wait for the deployment to finish. Settings > Pages will show your published website link.

Official instructions: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

Tip: If uploading on a phone is difficult, use a computer so you can upload the assets folder while preserving its structure.

## Features

- Three fixed main tabs: Introduction, Body, Conclusion.
- One sentence per box. + Add sentence adds a box below within the current section; it does not create another main tab.
- Remove extra boxes with the minus button. Up to 10 sentences per section.
- All sentences form one continuous paragraph with purple, yellow, and pink section highlights.
- Red wavy underlines and clues help students review common spelling, grammar, punctuation, and capital-letter issues.
- Cartoon stationery characters, responsive colours, and soft click sounds with a mute button.
- Drafts save in the current browser on the current device.
- Copy, download plain text, or print a completed paragraph. Plain text has no background colours; printing can retain them when background graphics are enabled.

## Run locally

No build step, dependencies, API key, or backend is needed. From the extracted folder, run:

    python3 -m http.server 8000

Then open http://localhost:8000. Use an HTTP server: opening index.html directly as a file will not load the JavaScript modules and dictionary reliably.

## Edit the app

- index.html: structure and labels.
- app.js: interface, drafts, paragraph assembly, and exports.
- styles.css: base layout.
- cartoon.css: cartoon theme.
- sections.css: section tabs, sentence cards, and paragraph highlight colours.
- sentences.js: sentence ordering and section controls.
- checker.js: local spelling and common grammar checks.
- sounds.js: generated click sounds; no audio downloads needed.
- assets/: dictionary, licence, and SVG illustrations. Keep this folder intact.

## Checks and privacy

The checker is a local, rule-based learning aid. It cannot detect every error or judge meaning; it may flag valid names and specialist words. Students can keep those words and review their writing with a teacher.

Student writing is stored in the current browser, not in GitHub or a shared student database. On shared devices, use New paragraph when finished. Clearing browser storage removes the saved draft.

The dictionary licence is included in assets/DICTIONARY-LICENSE.txt.
