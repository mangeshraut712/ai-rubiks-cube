# Part 1 - Cube Representation

Python implementation of the 2×2×2 Rubik's Cube state representation.

## File

- `RubiksCube.py` - Core cube class with state representation and moves

## Features

- 24-character state string representation
- Move permutation tables for all 12 moves
- Scramble generation with move pruning
- Random walk solver (basic)

## State Format

```
       0  1
       2  3        (U - Up)
16 17   8  9   4  5  20 21
18 19  10 11   6  7  22 23
       12 13
       14 15       (D - Down)

Solved: "WWWWRRRRGGGGYYYYOOOOBBBB"
```

## Usage

```python
from RubiksCube import Cube, generate_scramble, SOLVED_STATE

# Create cube
cube = Cube()

# Apply moves
cube = cube.apply_move("U")
cube = cube.apply_move("R")

# Generate scramble
scramble = generate_scramble(10)
cube = cube.apply_moves(scramble)

# Check if solved
print(cube.is_solved())
print(cube.display())
```

## Run Demo

```bash
python3 RubiksCube.py
```
