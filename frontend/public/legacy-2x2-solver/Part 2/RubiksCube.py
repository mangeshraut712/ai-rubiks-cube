#!/usr/bin/env python3
"""
Part 2: Main Entry Point
========================
Command-line interface for the 2×2 Rubik's Cube solver.

Usage:
    python RubiksCube.py bfs "U R F"      # Solve with BFS
    python RubiksCube.py ids "U R F"      # Solve with IDS  
    python RubiksCube.py scramble 10      # Generate scramble
    python RubiksCube.py benchmark        # Compare algorithms
"""

import sys
import time
from Cube import Cube, generate_scramble, SOLVED_STATE
from Solutions import bfs_solve, ids_solve, bidirectional_bfs


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return
    
    command = sys.argv[1].lower()
    
    if command == 'bfs':
        # Solve with BFS
        if len(sys.argv) < 3:
            print("Usage: python RubiksCube.py bfs \"U R F'\"")
            return
        
        moves_str = sys.argv[2]
        moves = moves_str.split()
        
        cube = Cube()
        scrambled = cube.apply_moves(moves)
        
        print(f"Initial scramble: {moves_str}")
        print(f"Scrambled state: {scrambled.state}")
        print(scrambled.display())
        
        print("Solving with BFS...")
        start = time.time()
        solution, nodes = bfs_solve(scrambled.state)
        elapsed = time.time() - start
        
        if solution:
            print(f"\nSolution: {' '.join(solution)}")
            print(f"Moves: {len(solution)}")
            print(f"Nodes explored: {nodes:,}")
            print(f"Time: {elapsed:.3f}s")
            
            # Verify
            solved = scrambled.apply_moves(solution)
            print(f"Verified: {solved.is_solved()}")
        else:
            print("No solution found!")
    
    elif command == 'ids':
        # Solve with IDS
        if len(sys.argv) < 3:
            print("Usage: python RubiksCube.py ids \"U R F'\"")
            return
        
        moves_str = sys.argv[2]
        moves = moves_str.split()
        
        cube = Cube()
        scrambled = cube.apply_moves(moves)
        
        print(f"Initial scramble: {moves_str}")
        print(f"Scrambled state: {scrambled.state}")
        print(scrambled.display())
        
        print("Solving with IDS...")
        start = time.time()
        solution, nodes = ids_solve(scrambled.state)
        elapsed = time.time() - start
        
        if solution:
            print(f"\nSolution: {' '.join(solution)}")
            print(f"Moves: {len(solution)}")
            print(f"Nodes explored: {nodes:,}")
            print(f"Time: {elapsed:.3f}s")
        else:
            print("No solution found!")
    
    elif command == 'scramble':
        # Generate scramble
        length = int(sys.argv[2]) if len(sys.argv) > 2 else 20
        scramble = generate_scramble(length)
        
        cube = Cube()
        scrambled = cube.apply_moves(scramble)
        
        print(f"Scramble ({length} moves): {' '.join(scramble)}")
        print(f"State: {scrambled.state}")
        print(scrambled.display())
    
    elif command == 'benchmark':
        # Benchmark BFS vs IDS
        num_tests = int(sys.argv[2]) if len(sys.argv) > 2 else 5
        
        print(f"\n{'='*60}")
        print(f"Benchmarking BFS vs IDS ({num_tests} tests)")
        print(f"{'='*60}\n")
        
        bfs_results = []
        ids_results = []
        
        for i in range(num_tests):
            scramble = generate_scramble(10)
            cube = Cube()
            scrambled = cube.apply_moves(scramble)
            
            # BFS
            start = time.time()
            bfs_sol, bfs_nodes = bfs_solve(scrambled.state)
            bfs_time = time.time() - start
            
            # IDS
            start = time.time()
            ids_sol, ids_nodes = ids_solve(scrambled.state)
            ids_time = time.time() - start
            
            bfs_results.append((len(bfs_sol) if bfs_sol else 0, bfs_nodes, bfs_time))
            ids_results.append((len(ids_sol) if ids_sol else 0, ids_nodes, ids_time))
            
            print(f"Test {i+1}: BFS={len(bfs_sol) if bfs_sol else 0} moves/{bfs_time:.3f}s, "
                  f"IDS={len(ids_sol) if ids_sol else 0} moves/{ids_time:.3f}s")
        
        print(f"\n{'='*60}")
        avg_bfs_time = sum(r[2] for r in bfs_results) / len(bfs_results)
        avg_ids_time = sum(r[2] for r in ids_results) / len(ids_results)
        print(f"Average BFS time: {avg_bfs_time:.3f}s")
        print(f"Average IDS time: {avg_ids_time:.3f}s")
    
    elif command == 'demo':
        # Quick demo
        print("=== 2×2 Rubik's Cube Solver Demo ===\n")
        
        cube = Cube()
        print("1. Solved cube:")
        print(cube.display())
        
        scramble = generate_scramble(8)
        print(f"2. Scramble: {' '.join(scramble)}")
        
        scrambled = cube.apply_moves(scramble)
        print("3. Scrambled cube:")
        print(scrambled.display())
        
        print("4. Solving with Bidirectional BFS (FAST)...")
        start = time.time()
        solution, nodes = bidirectional_bfs(scrambled.state)
        elapsed = time.time() - start
        
        if solution:
            print(f"   Solution: {' '.join(solution)}")
            print(f"   Optimal moves: {len(solution)}")
            print(f"   Nodes explored: {nodes:,}")
            print(f"   Time: {elapsed:.3f}s")
            
            solved = scrambled.apply_moves(solution)
            print("\n5. Solved cube:")
            print(solved.display())
            print(f"   Verified: {solved.is_solved()}")
    
    else:
        print(f"Unknown command: {command}")
        print(__doc__)


if __name__ == "__main__":
    main()
