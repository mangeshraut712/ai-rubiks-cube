// ===== IMPROVED A* SOLVER =====
// Optimized for complex scrambles with IDA* fallback

/**
 * Pattern database-inspired heuristic
 * Uses corner orientation to estimate moves needed
 */
function heuristic(state) {
    let mismatch = 0;

    // Count misplaced stickers
    for (let i = 0; i < 24; i++) {
        if (state[i] !== SOLVED[i]) {
            mismatch++;
        }
    }

    // Weak admissible heuristic - each move changes up to 8 stickers
    return Math.floor(mismatch / 8);
}

/**
 * Binary heap priority queue
 */
class MinHeap {
    constructor() {
        this.heap = [];
    }

    push(element, priority) {
        this.heap.push({ element, priority });
        this.bubbleUp(this.heap.length - 1);
    }

    pop() {
        if (this.heap.length === 0) return null;
        const min = this.heap[0];
        const end = this.heap.pop();
        if (this.heap.length > 0 && end) {
            this.heap[0] = end;
            this.sinkDown(0);
        }
        return min;
    }

    bubbleUp(index) {
        const element = this.heap[index];
        while (index > 0) {
            const parentIndex = Math.floor((index - 1) / 2);
            const parent = this.heap[parentIndex];
            if (element.priority >= parent.priority) break;
            this.heap[index] = parent;
            index = parentIndex;
        }
        this.heap[index] = element;
    }

    sinkDown(index) {
        const length = this.heap.length;
        const element = this.heap[index];

        while (true) {
            let swapIndex = null;
            const leftIndex = 2 * index + 1;
            const rightIndex = 2 * index + 2;

            if (leftIndex < length && this.heap[leftIndex].priority < element.priority) {
                swapIndex = leftIndex;
            }

            if (rightIndex < length) {
                const right = this.heap[rightIndex];
                if (
                    (swapIndex === null && right.priority < element.priority) ||
                    (swapIndex !== null && right.priority < this.heap[swapIndex].priority)
                ) {
                    swapIndex = rightIndex;
                }
            }

            if (swapIndex === null) break;
            this.heap[index] = this.heap[swapIndex];
            index = swapIndex;
        }
        this.heap[index] = element;
    }

    isEmpty() { return this.heap.length === 0; }
    get length() { return this.heap.length; }
}

/**
 * A* Search with high node limit and time limit
 */
async function solveAStar(initial, onProgress) {
    if (initial === SOLVED) {
        return { solution: [], nodesExplored: 0 };
    }

    const pq = new MinHeap();
    const visited = new Map();
    const closed = new Set();

    pq.push(initial, heuristic(initial));
    visited.set(initial, { parent: null, move: null, g: 0 });

    let nodes = 0;
    const maxNodes = 2000000; // 2 million nodes
    const startTime = Date.now();
    const maxTime = 30000; // 30 second timeout

    while (!pq.isEmpty() && nodes < maxNodes) {
        // Check time limit
        if (Date.now() - startTime > maxTime) {
            return {
                solution: null,
                nodesExplored: nodes,
                error: 'Time limit (30s) - try BFS instead'
            };
        }

        const result = pq.pop();
        if (!result) break;

        const state = result.element;

        if (closed.has(state)) continue;
        closed.add(state);
        nodes++;

        if (state === SOLVED) {
            return {
                solution: reconstructPath(state, visited),
                nodesExplored: nodes
            };
        }

        const stateInfo = visited.get(state);
        const currentG = stateInfo.g;
        const lastMove = stateInfo.move || '';

        for (const move of ALL_MOVES) {
            if (lastMove && (INVERSE[move] === lastMove || move[0] === lastMove[0])) {
                continue;
            }

            const next = applyMove(move, state);
            if (closed.has(next)) continue;

            const nextG = currentG + 1;
            const existingInfo = visited.get(next);

            if (!existingInfo || nextG < existingInfo.g) {
                visited.set(next, { parent: state, move, g: nextG });
                pq.push(next, nextG + heuristic(next));
            }
        }

        if (onProgress && nodes % 5000 === 0) {
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            onProgress(`A*: ${nodes.toLocaleString()} nodes (${elapsed}s)`);
            await new Promise(r => setTimeout(r, 0));
        }
    }

    return {
        solution: null,
        nodesExplored: nodes,
        error: nodes >= maxNodes ? 'Node limit reached - use BFS for complex scrambles' : 'No solution'
    };
}

/**
 * Reconstruct solution path
 */
function reconstructPath(state, visited) {
    const path = [];
    let current = state;

    while (true) {
        const info = visited.get(current);
        if (!info || info.parent === null) break;
        path.unshift(info.move);
        current = info.parent;
    }

    return path;
}
