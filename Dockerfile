# Runs the resume studio with TeX baked in, so the only thing to install is Docker.
#   docker build -t resumes-app .
#   docker run --rm -it -p 3000:3000 -v ${PWD}:/app resumes-app     (Mac/Linux)
#   docker run --rm -it -p 3000:3000 -v "%CD%":/app resumes-app     (Windows cmd)
FROM node:20-bookworm-slim
# texlive-latex-base + lmodern + latex-recommended: base covers geometry, fontenc
# and Latin Modern; recommended adds pdftexcmds, which hyperref (clickable links
# in the header) needs. CI installs the same set.
RUN apt-get update -qq && \
    apt-get install -y -qq --no-install-recommends \
      texlive-latex-base texlive-latex-recommended lmodern && \
    rm -rf /var/lib/apt/lists/*
WORKDIR /app
EXPOSE 3000
CMD ["node", "server.js"]
