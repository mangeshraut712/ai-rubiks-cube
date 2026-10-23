/**
 * Play a move list on a timer. The returned function cancels any pending steps.
 * Completion runs on the tick after the last move, matching the tutor auto-solve cadence.
 * @param {{ moves: string[], intervalMs: number, isStopped?: () => boolean, onMove: (move: string, index: number, total: number) => void, onComplete?: (total: number) => void }} options
 * @returns {() => void}
 */
export function startMovePlayback({ moves, intervalMs, isStopped = () => false, onMove, onComplete }) {
  let index = 0;
  let stopped = false;

  const timer = setInterval(() => {
    if (stopped || isStopped()) {
      clearInterval(timer);
      return;
    }

    if (index >= moves.length) {
      clearInterval(timer);
      onComplete?.(moves.length);
      return;
    }

    const step = index;
    const move = moves[index];
    index += 1;
    onMove(move, step, moves.length);
  }, intervalMs);

  return function stopPlayback() {
    stopped = true;
    clearInterval(timer);
  };
}
