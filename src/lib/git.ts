import simpleGit from 'simple-git';

export async function latestCommitInfo() {
  const git = simpleGit();
  const log = await git.log({ maxCount: 1 });
  const diff = await git.diff(['--cached']);
  return {
    message: log.latest?.message ?? '',
    hash: log.latest?.hash ?? '',
    diff
  };
}
