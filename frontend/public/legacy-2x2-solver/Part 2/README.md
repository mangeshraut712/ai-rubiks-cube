# Part 2 - Search Algorithms

Python implementation of BFS and IDS solving algorithms for the 2×2×2 Rubik's Cube.

## Files

| File | Description |
|------|-------------|
| `Cube.py` | Cube state utilities |
| `Solutions.py` | BFS and IDS algorithms |
| `RubiksCube.py` | CLI interface |

## Algorithms

### BFS (Breadth-First Search)
- Finds **optimal** (shortest) solution
- Explores states level by level
- Higher memory usage

### IDS (Iterative Deepening Search)
- Finds **optimal** solution
- Memory efficient
- Slightly slower than BFS

## Usage

### Command Line

```bash
# Demo
python3 RubiksCube.py demo

# Solve with BFS
python3 RubiksCube.py bfs "U R F"

# Solve with IDS
python3 RubiksCube.py ids "R U R' U'"

# Benchmark
python3 RubiksCube.py benchmark 5

# Generate scramble
python3 RubiksCube.py scramble 10
```

### As Module

```python
from Solutions import bfs_solve, ids_solve
from Cube import Cube, generate_scramble

# Create scrambled cube
cube = Cube()
scramble = generate_scramble(10)
scrambled = cube.apply_moves(scramble)

# Solve with BFS
solution, nodes = bfs_solve(scrambled.state)
print(f"Solution: {' '.join(solution)}")
print(f"Nodes explored: {nodes}")
```

## Example Output

```
=== 2×2 Rubik's Cube Solver Demo ===

Scramble: F' D F' D' R D B D
Solving with BFS...
Solution: U D R' F' D L F R'
Optimal moves: 8
Verified: True ✅
```
