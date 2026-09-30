#!/usr/bin/env bash
set -e

REPO_NAME="schwenck-e/ordem-servico-app"
WIKI_REMOTE="https://$(gh auth token)@github.com/${REPO_NAME}.wiki.git"
TEMP_DIR=$(mktemp -d)

echo "==> Clonando repositório da Wiki do GitHub..."
if ! git clone "$WIKI_REMOTE" "$TEMP_DIR" 2>/dev/null; then
    echo "Aviso: O repositório da Wiki precisa ser inicializado uma única vez no GitHub."
    echo "Acesse https://github.com/${REPO_NAME}/wiki no navegador e clique em 'Create the first page' para ativar o repositório."
    rm -rf "$TEMP_DIR"
    exit 1
fi

echo "==> Copiando documentação arquitetural de docs/wiki/..."
cp docs/wiki/*.md "$TEMP_DIR/"

cd "$TEMP_DIR"
git config user.name "$(git config --global user.name || echo 'Developer')"
git config user.email "$(git config --global user.email || echo 'dev@example.com')"

git add .
if git diff-index --quiet HEAD --; then
    echo "==> A Wiki já está sincronizada e atualizada."
else
    git commit -m "docs: atualizar documentacao arquitetural e diagramas"
    git push origin HEAD
    echo "==> Wiki atualizada com sucesso no GitHub!"
fi

rm -rf "$TEMP_DIR"
