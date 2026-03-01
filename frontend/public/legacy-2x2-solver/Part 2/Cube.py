#!/usr/bin/env python3
"""
Part 2: Complete Cube Representation and Utilities
==================================================
Self-contained module with all cube operations needed for solving.
"""

import random
from typing import List, Dict, Tuple, Optional

# Move permutation tables (immutable tuples for performance)
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

INVERSE_MOVES: Dict[str, str] = {
    "U": "U'", "U'": "U",
    "R": "R'", "R'": "R",
    "F": "F'", "F'": "F",
    "D": "D'", "D'": "D",
    "L": "L'", "L'": "L",
    "B": "B'", "B'": "B",
}

SOLVED_STATE = "WWWWRRRRGGGGYYYYOOOOBBBB"
ALL_MOVES = ["U", "U'", "R", "R'", "F", "F'", "D", "D'", "L", "L'", "B", "B'"]


class Cube:
    """Optimized 2×2 Rubik's Cube representation."""
    
    def __init__(self, state: str = SOLVED_STATE):
        self.state = state.replace(" ", "")
        if len(self.state) != 24:
            raise ValueError("State must be 24 characters")
    
    def apply_move(self, move: str) -> 'Cube':
        """Apply a move and return new Cube."""
        perm = MOVES.get(move)
        if perm:
            new_state = ''.join(self.state[i] for i in perm)
            return Cube(new_state)
        return self
    
    def apply_moves(self, moves: List[str]) -> 'Cube':
        """Apply sequence of moves."""
        cube = self
        for move in moves:
            cube = cube.apply_move(move)
        return cube
    
    def is_solved(self) -> bool:
        """Check if cube is solved."""
        return self.state == SOLVED_STATE
    
    def __eq__(self, other) -> bool:
        return isinstance(other, Cube) and self.state == other.state
    
    def __hash__(self) -> int:
        return hash(self.state)
    
    def __str__(self) -> str:
        return self.state
    
    def display(self) -> str:
        """ASCII art display of cube."""
        s = self.state
        return f"""
       {s[0]} {s[1]}
       {s[2]} {s[3]}
{s[16]} {s[17]}  {s[8]} {s[9]}  {s[4]} {s[5]}  {s[20]} {s[21]}
{s[18]} {s[19]}  {s[10]} {s[11]}  {s[6]} {s[7]}  {s[22]} {s[23]}
       {s[12]} {s[13]}
       {s[14]} {s[15]}
"""


def generate_scramble(length: int = 20) -> List[str]:
    """Generate random scramble with move pruning."""
    scramble = []
    last_face = ""
    
    for _ in range(length):
        while True:
            move = random.choice(ALL_MOVES)
            face = move[0]
            
            if face != last_face:
                if not scramble or INVERSE_MOVES.get(move) != scramble[-1]:
                    break
        
        scramble.append(move)
        last_face = face
    
    return scramble
