#!/bin/bash

# create_worktree.sh - Create a new worktree for development work
# Usage: ./hack/create_worktree.sh [worktree_name/ticket] [branch_name] [base_branch]

set -e  # Exit on any error

# Parse arguments
WORKTREE_NAME=${1:-"worktree_$(date +%s)"}
BRANCH_NAME=${2:-"$WORKTREE_NAME"}
BASE_BRANCH=${3:-$(git branch --show-current)}
[ -z "$BASE_BRANCH" ] && BASE_BRANCH="main"

REPO_ROOT="$(pwd)"
REPO_BASE_NAME=$(basename "$REPO_ROOT")

if [ -n "$HUMANLAYER_WORKTREE_OVERRIDE_BASE" ]; then
    WORKTREES_BASE="${HUMANLAYER_WORKTREE_OVERRIDE_BASE}/${REPO_BASE_NAME}"
else
    WORKTREES_BASE="$HOME/wt/${REPO_BASE_NAME}"
fi

WORKTREE_PATH="${WORKTREES_BASE}/${WORKTREE_NAME}"

echo "🌳 Creating worktree: ${WORKTREE_NAME}"
echo "📁 Location: ${WORKTREE_PATH}"
echo "🔀 Branch: ${BRANCH_NAME} (from ${BASE_BRANCH})"

# Ensure worktrees base directory exists
mkdir -p "$WORKTREES_BASE"

# Check if worktree directory already exists
if [ -d "$WORKTREE_PATH" ]; then
    echo "❌ Error: Worktree directory already exists: $WORKTREE_PATH"
    exit 1
fi

# Create worktree
if git show-ref --verify --quiet "refs/heads/${BRANCH_NAME}"; then
    echo "📋 Using existing branch: ${BRANCH_NAME}"
    git worktree add "$WORKTREE_PATH" "$BRANCH_NAME"
else
    echo "🆕 Creating new branch: ${BRANCH_NAME}"
    git worktree add -b "$BRANCH_NAME" "$WORKTREE_PATH" "$BASE_BRANCH"
fi

# Copy .antigravity or .claude directory if they exist
if [ -d "$REPO_ROOT/.antigravity" ]; then
    echo "📋 Copying .antigravity directory..."
    cp -r "$REPO_ROOT/.antigravity" "$WORKTREE_PATH/"
fi

if [ -d "$REPO_ROOT/.claude" ]; then
    echo "📋 Copying .claude directory..."
    cp -r "$REPO_ROOT/.claude" "$WORKTREE_PATH/"
fi

# Link thoughts directory so it stays synced
if [ -d "$REPO_ROOT/thoughts" ]; then
    echo "🧠 Linking thoughts directory..."
    ln -sf "$REPO_ROOT/thoughts" "$WORKTREE_PATH/thoughts"
fi

echo "✅ Worktree created successfully!"
echo "📁 Path: ${WORKTREE_PATH}"
echo "🔀 Branch: ${BRANCH_NAME}"
echo ""
echo "To work in this worktree:"
echo "  cd ${WORKTREE_PATH}"
echo ""
echo "To remove this worktree later:"
echo "  git worktree remove ${WORKTREE_PATH}"
echo "  git branch -D ${BRANCH_NAME}"
