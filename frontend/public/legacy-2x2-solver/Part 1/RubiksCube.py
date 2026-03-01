#!/usr/bin/env python3
"""
Part 1: Optimized 2×2 Rubik's Cube Representation
================================================
This module provides optimized cube state representation and manipulation.

Key Improvements:
- Added type hints for better code clarity
- Optimized move application using tuple lookup
- Added double moves (U2, R2, etc.)
- Improved random scramble generation with move pruning
"""

import random
from typing import List, Tuple, Dict, Optional

# Optimized move permutation tables (immutable tuples for performance)
MOVES: Dict[str, Tuple[int, ...]] = {
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

# Inverse move mapping
INVERSE_MOVES: Dict[str, str] = {
    "U": "U'", "U'": "U", "U2": "U2",
    "R": "R'", "R'": "R", "R2": "R2",
    "F": "F'", "F'": "F", "F2": "F2",
    "D": "D'", "D'": "D", "D2": "D2",
    "L": "L'", "L'": "L", "L2": "L2",
    "B": "B'", "B'": "B", "B2": "B2",
}

# Opposite faces (for pruning)
OPPOSITE_FACES: Dict[str, str] = {
    "U": "D", "D": "U",
    "R": "L", "L": "R",
    "F": "B", "B": "F",
}

SOLVED_STATE = "WWWWRRRRGGGGYYYYOOOOBBBB"
ALL_MOVES = ["U", "U'", "R", "R'", "F", "F'", "D", "D'", "L", "L'", "B", "B'"]


class Cube:
    """Optimized 2×2 Rubik's Cube class."""
    
    def __init__(self, state: str = SOLVED_STATE):
        """Initialize cube with given state (default: solved)."""
        self.state = state.replace(" ", "")
        if len(self.state) != 24:
            raise ValueError("State must be 24 characters")
    
    def apply_move(self, move: str) -> 'Cube':
        """Apply a move and return new Cube (immutable pattern)."""
        # Handle double moves
        if move.endswith("2"):
            base_move = move[0]
            perm = MOVES.get(base_move)
            if perm:
                state = self._permute(self._permute(self.state, perm), perm)
                return Cube(state)
        
        perm = MOVES.get(move)
        if perm:
            return Cube(self._permute(self.state, perm))
        return self
    
    def apply_moves(self, moves: List[str]) -> 'Cube':
        """Apply sequence of moves."""
        cube = self
        for move in moves:
            cube = cube.apply_move(move)
        return cube
    
    def _permute(self, state: str, perm: Tuple[int, ...]) -> str:
        """Apply permutation to state string."""
        return ''.join(state[i] for i in perm)
    
    def is_solved(self) -> bool:
        """Check if cube is in solved state."""
        return self.state == SOLVED_STATE
    
    def __eq__(self, other) -> bool:
        return isinstance(other, Cube) and self.state == other.state
    
    def __hash__(self) -> int:
        return hash(self.state)
    
    def __str__(self) -> str:
        return self.state
    
    def __repr__(self) -> str:
        return f"Cube('{self.state}')"
    
    def display(self) -> str:
        """Return ASCII art representation of cube."""
        s = self.state
        return f"""
       {s[0]} {s[1]}
       {s[2]} {s[3]}
{s[16]} {s[17]}  {s[8]} {s[9]}  {s[4]} {s[5]}  {s[20]} {s[21]}
{s[18]} {s[19]}  {s[10]} {s[11]}  {s[6]} {s[7]}  {s[22]} {s[23]}
       {s[12]} {s[13]}
       {s[14]} {s[15]}
"""


def generate_scramble(length: int = 20, avoid_redundant: bool = True) -> List[str]:
    """
    Generate random scramble with optional move pruning.
    
    Args:
        length: Number of moves in scramble
        avoid_redundant: If True, avoids inverse and same-face consecutive moves
    
    Returns:
        List of move strings
    """
    scramble = []
    last_face = ""
    
    for _ in range(length):
        while True:
            move = random.choice(ALL_MOVES)
            face = move[0]
            
            if not avoid_redundant:
                break
            
            # Avoid same face twice in a row
            if face == last_face:
                continue
            
            # Avoid inverse moves (U followed by U' is useless)
            if scramble and INVERSE_MOVES.get(move) == scramble[-1]:
                continue
            
            break
        
        scramble.append(move)
        last_face = face
    
    return scramble


def random_walk_solve(initial_state: str, max_length: int = 15, max_attempts: int = 1000) -> Optional[List[str]]:
    """
    Attempt to solve cube using random walk.
    
    Args:
        initial_state: Starting cube state
        max_length: Maximum moves per attempt
        max_attempts: Maximum number of attempts
    
    Returns:
        Solution moves if found, None otherwise
    """
    for attempt in range(max_attempts):
        cube = Cube(initial_state)
        moves = []
        last_move = ""
        
        for _ in range(max_length):
            # Choose random move (avoiding inverse of last)
            while True:
                move = random.choice(ALL_MOVES)
                if not last_move or INVERSE_MOVES.get(move) != last_move:
                    break
            
            cube = cube.apply_move(move)
            moves.append(move)
            last_move = move
            
            if cube.is_solved():
                return moves
    
    return None


# Example usage
if __name__ == "__main__":
    import sys
    
    # Create solved cube
    cube = Cube()
    print("Solved cube:")
    print(cube.display())
    
    # Generate and apply scramble
    scramble = generate_scramble(10)
    print(f"Scramble: {' '.join(scramble)}")
    
    scrambled_cube = cube.apply_moves(scramble)
    print("Scrambled cube:")
    print(scrambled_cube.display())
    
    # Check if solved
    print(f"Is solved: {scrambled_cube.is_solved()}")
