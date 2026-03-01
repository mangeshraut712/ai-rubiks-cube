#!/usr/bin/env python3
"""
Part 2: OPTIMIZED Search Algorithms for 2×2 Rubik's Cube
=========================================================
Fast BFS, Bidirectional BFS, and IDS implementations.
"""

from collections import deque
from typing import List, Optional, Tuple, Dict
import time

# Move permutation tables (tuples for faster hashing)
MOVES = {
    "U":  (2,0,3,1, 20,21,6,7, 4,5,10,11, 12,13,14,15, 8,9,18,19, 16,17,22,23),
    "U'": (1,3,0,2, 8,9,6,7, 16,17,10,11, 12,13,14,15, 20,21,18,19, 4,5,22,23),
    "R":  (0,9,2,11, 6,4,7,5, 8,13,10,15, 12,22,14,20, 16,17,18,19, 3,21,1,23),
    "R'": (0,22,2,20, 5,7,4,6, 8,1,10,3, 12,9,14,11, 16,17,18,19, 15,21,13,23),
    "F":  (0,1,19,17, 2,5,3,7, 10,8,11,9, 6,4,14,15, 16,12,18,13, 20,21,22,23),
    "F'": (0,1,4,6, 13,5,12,7, 9,11,8,10, 17,19,14,15, 16,3,18,2, 20,21,22,23),
    "D":  (0,1,2,3, 4,5,10,11, 8,9,18,19, 14,12,15,13, 16,17,22,23, 20,21,6,7),
    "D'": (0,1,2,3, 4,5,22,23, 8,9,6,7, 13,15,12,14, 16,17,10,11, 20,21,18,19),
    "L":  (23,1,21,3, 4,5,6,7, 0,9,2,11, 8,13,10,15, 18,16,19,17, 20,14,22,12),
    "L'": (8,1,10,3, 4,5,6,7, 12,9,14,11, 23,13,21,15, 17,19,16,18, 20,2,22,0),
    "B":  (5,7,2,3, 4,15,6,14, 8,9,10,11, 12,13,16,18, 1,17,0,19, 22,20,23,21),
    "B'": (18,16,2,3, 4,0,6,1, 8,9,10,11, 12,13,7,5, 14,17,15,19, 21,23,20,22),
}

INVERSE = {"U": "U'", "U'": "U", "R": "R'", "R'": "R", "F": "F'", "F'": "F",
           "D": "D'", "D'": "D", "L": "L'", "L'": "L", "B": "B'", "B'": "B"}

ALL_MOVES = tuple(MOVES.keys())
SOLVED = "WWWWRRRRGGGGYYYYOOOOBBBB"


def apply_move(state: str, move: str) -> str:
    """Apply move - optimized with tuple lookup."""
    perm = MOVES[move]
    return ''.join(state[i] for i in perm)


def bidirectional_bfs(initial: str) -> Tuple[Optional[List[str]], int]:
    """
    Bidirectional BFS - searches from BOTH start and goal simultaneously.
    Meets in the middle for exponential speedup!
    
    Time: O(b^(d/2)) instead of O(b^d)
    """
    if initial == SOLVED:
        return [], 0
    
    # Forward search from initial state
    forward_queue = deque([initial])
    forward_visited = {initial: (None, None)}  # state -> (parent, move)
    
    # Backward search from goal state
    backward_queue = deque([SOLVED])
    backward_visited = {SOLVED: (None, None)}
    
    nodes = 0
    
    while forward_queue and backward_queue:
        # Expand forward
        if forward_queue:
            meeting = _expand_level(forward_queue, forward_visited, backward_visited, False)
            nodes += len(forward_queue) + 1
            if meeting:
                return _reconstruct_bidir(meeting, forward_visited, backward_visited), nodes
        
        # Expand backward  
        if backward_queue:
            meeting = _expand_level(backward_queue, backward_visited, forward_visited, True)
            nodes += len(backward_queue) + 1
            if meeting:
                return _reconstruct_bidir(meeting, forward_visited, backward_visited), nodes
    
    return None, nodes


def _expand_level(queue: deque, visited: dict, other_visited: dict, is_backward: bool):
    """Expand one level of BFS, check for meeting point."""
    size = len(queue)
    
    for _ in range(size):
        state = queue.popleft()
        parent_info = visited[state]
        last_move = parent_info[1] if parent_info[1] else ""
        
        for move in ALL_MOVES:
            # Pruning
            if last_move and (INVERSE[move] == last_move or move[0] == last_move[0]):
                continue
            
            new_state = apply_move(state, move)
            
            if new_state not in visited:
                visited[new_state] = (state, move)
                queue.append(new_state)
                
                # Check if we met the other search
                if new_state in other_visited:
                    return new_state
    
    return None


def _reconstruct_bidir(meeting: str, forward: dict, backward: dict) -> List[str]:
    """Reconstruct path from bidirectional search."""
    # Forward path (start -> meeting)
    path = []
    state = meeting
    while forward[state][0] is not None:
        parent, move = forward[state]
        path.append(move)
        state = parent
    path.reverse()
    
    # Backward path (meeting -> goal) - reverse the moves!
    state = meeting
    while backward[state][0] is not None:
        parent, move = backward[state]
        # When going backward, we apply inverse
        path.append(INVERSE[move])
        state = parent
    
    return path


def bfs_solve(initial: str) -> Tuple[Optional[List[str]], int]:
    """Standard BFS with optimizations."""
    if initial == SOLVED:
        return [], 0
    
    queue = deque([initial])
    visited = {initial: (None, None)}
    nodes = 0
    
    while queue:
        state = queue.popleft()
        nodes += 1
        parent_info = visited[state]
        last_move = parent_info[1] if parent_info[1] else ""
        
        for move in ALL_MOVES:
            if last_move and (INVERSE[move] == last_move or move[0] == last_move[0]):
                continue
            
            new_state = apply_move(state, move)
            
            if new_state == SOLVED:
                # Reconstruct path
                path = [move]
                s = state
                while visited[s][0] is not None:
                    path.append(visited[s][1])
                    s = visited[s][0]
                path.reverse()
                return path, nodes
            
            if new_state not in visited:
                visited[new_state] = (state, move)
                queue.append(new_state)
    
    return None, nodes


def ids_solve(initial: str, max_depth: int = 14) -> Tuple[Optional[List[str]], int]:
    """Iterative Deepening Search."""
    if initial == SOLVED:
        return [], 0
    
    total_nodes = 0
    
    for depth in range(1, max_depth + 1):
        result, nodes = _dls(initial, depth)
        total_nodes += nodes
        if result is not None:
            return result, total_nodes
    
    return None, total_nodes


def _dls(initial: str, max_depth: int) -> Tuple[Optional[List[str]], int]:
    """Depth-limited search."""
    stack = [(initial, [], "")]
    nodes = 0
    
    while stack:
        state, path, last_move = stack.pop()
        nodes += 1
        
        if state == SOLVED:
            return path, nodes
        
        if len(path) >= max_depth:
            continue
        
        for move in ALL_MOVES:
            if last_move and (INVERSE[move] == last_move or move[0] == last_move[0]):
                continue
            new_state = apply_move(state, move)
            stack.append((new_state, path + [move], move))
    
    return None, nodes


# For compatibility with existing code
INVERSE_MOVES = INVERSE
SOLVED_STATE = SOLVED
