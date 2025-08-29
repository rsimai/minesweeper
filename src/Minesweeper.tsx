import React, { useState, useEffect } from 'react';
import { Button } from '@patternfly/react-core';
import { Dropdown } from '@patternfly/react-core';
import { DropdownItem } from '@patternfly/react-core';
import { DropdownSeparator } from '@patternfly/react-core';
import { MenuToggle } from '@patternfly/react-core';

import { Card, CardBody, CardTitle } from "@patternfly/react-core/dist/esm/components/Card/index.js";

import './minesweeper.scss';
import { Alert } from "@patternfly/react-core";

interface Cell {
    isMine: boolean;
    isRevealed: boolean;
    isFlagged: boolean;
    mineCount: number;
}

const Minesweeper: React.FC = () => {
    const [board, setBoard] = useState<Cell[][]>([]);
    const [gameOver, setGameOver] = useState<boolean>(false);
    const [gameWon, setGameWon] = useState<boolean>(false);
    const [rows, setRows] = useState<number>(10);
    const [cols, setCols] = useState<number>(10);
    const [mines, setMines] = useState<number>(15);
    const [minesRemaining, setMinesRemaining] = useState<number>(mines);
    const [message, setMessage] = useState<string | null>(null);
    const [timeElapsed, setTimeElapsed] = useState<number>(0);

    const [isSizeDropdownOpen, setIsSizeDropdownOpen] = useState<boolean>(false);
    const [isMinesDropdownOpen, setIsMinesDropdownOpen] = useState<boolean>(false);

    useEffect(() => {
        initializeGame();
    }, [rows, cols, mines]);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (!gameOver && !gameWon) {
            timer = setInterval(() => {
                setTimeElapsed(prevTime => prevTime + 1);
            }, 1000);
        } else if (gameOver || gameWon) {
            clearInterval(timer);
        }
        return () => clearInterval(timer);
    }, [gameOver, gameWon]);

    const initializeGame = () => {
        const newBoard: Cell[][] = Array(rows).fill(null).map(() =>
            Array(cols).fill(null).map(() => ({
                isMine: false,
                isRevealed: false,
                isFlagged: false,
                mineCount: 0,
            }))
        );

        let minesPlaced = 0;
        while (minesPlaced < mines) {
            const r = Math.floor(Math.random() * rows);
            const c = Math.floor(Math.random() * cols);
            if (!newBoard[r][c].isMine) {
                newBoard[r][c].isMine = true;
                minesPlaced++;
            }
        }

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (!newBoard[r][c].isMine) {
                    let count = 0;
                    for (let dr = -1; dr <= 1; dr++) {
                        for (let dc = -1; dc <= 1; dc++) {
                            if (dr === 0 && dc === 0) continue;
                            const nr = r + dr;
                            const nc = c + dc;
                            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && newBoard[nr][nc].isMine) {
                                count++;
                            }
                        }
                    }
                    newBoard[r][c].mineCount = count;
                }
            }
        }

        setBoard(newBoard);
        setGameOver(false);
        setGameWon(false);
        setMessage(null);
        setMinesRemaining(mines);
        setTimeElapsed(0);
    };

    const revealCell = (r: number, c: number) => {
        if (gameOver || gameWon || board[r][c].isRevealed || board[r][c].isFlagged) {
            return;
        }

        const newBoard = board.map(row => row.map(cell => ({ ...cell })));

        if (newBoard[r][c].isMine) {
            newBoard[r][c].isRevealed = true;
            setBoard(newBoard);
            setGameOver(true);
            setMessage('Game Over! You hit a mine.');
            return;
        }

        const queue: [number, number][] = [[r, c]];
        while (queue.length > 0) {
            const [currR, currC] = queue.shift()!;
            if (newBoard[currR][currC].isRevealed) continue;

            newBoard[currR][currC].isRevealed = true;

            if (newBoard[currR][currC].mineCount === 0) {
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        if (dr === 0 && dc === 0) continue;
                        const nr = currR + dr;
                        const nc = currC + dc;
                        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !newBoard[nr][nc].isRevealed && !newBoard[nr][nc].isMine) {
                            queue.push([nr, nc]);
                        }
                    }
                }
            }
        }
        setBoard(newBoard);
        checkWin(newBoard);
    };

    const handleRightClick = (event: React.MouseEvent, r: number, c: number) => {
        event.preventDefault();
        if (gameOver || gameWon || board[r][c].isRevealed) {
            return;
        }

        const newBoard = board.map(row => row.map(cell => ({ ...cell })));
        newBoard[r][c].isFlagged = !newBoard[r][c].isFlagged;
        setBoard(newBoard);
        setMinesRemaining(mines - newBoard.flat().filter(cell => cell.isFlagged).length);
    };

    const checkWin = (currentBoard: Cell[][]) => {
        let revealedCount = 0;
        let totalCells = rows * cols;
        let nonMineCells = totalCells - mines;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (currentBoard[r][c].isRevealed && !currentBoard[r][c].isMine) {
                    revealedCount++;
                }
            }
        }

        if (revealedCount === nonMineCells) {
            setGameWon(true);
            setGameOver(true);
            setMessage('Congratulations! You won!');
        }
    };

    const onSizeSelect = (event: React.SyntheticEvent<HTMLDivElement> | undefined) => {
        const selectedSize = (event?.target as HTMLButtonElement)?.innerText;
        if (selectedSize === 'Small (8x8)') {
            setRows(8);
            setCols(8);
        } else if (selectedSize === 'Medium (10x10)') {
            setRows(10);
            setCols(10);
        } else if (selectedSize === 'Large (12x12)') {
            setRows(12);
            setCols(12);
        }
    };

    const onMinesSelect = (event: React.SyntheticEvent<HTMLDivElement> | undefined) => {
        const selectedMines = (event?.target as HTMLButtonElement)?.innerText;
        setIsMinesDropdownOpen(false);
        if (selectedMines === 'Few (10 mines)') {
            setMines(10);
        } else if (selectedMines === 'Normal (15 mines)') {
            setMines(15);
        } else if (selectedMines === 'Many (20 mines)') {
            setMines(20);
        }
    };

    const sizeDropdownItems = [
        <option value="Small (8x8)">Small (8x8)</option>,
        <option value="Medium (10x10)">Medium (10x10)</option>,
        <option value="Large (12x12)">Large (12x12)</option>,
    ];

    const minesDropdownItems = [
        <DropdownItem key="few" component="button">Few (10 mines)</DropdownItem>,
        <DropdownItem key="normal" component="button">Normal (15 mines)</DropdownItem>,
        <DropdownItem key="many" component="button">Many (20 mines)</DropdownItem>,
    ];

    return (
        <Card>
            <CardTitle>Minesweeper</CardTitle>
            <CardBody>
                {message && (
                    <Alert variant={gameWon ? "success" : "danger"} title={message} />
                )}
                <div className="minesweeper-controls">
                    <div className="minesweeper-info-item">Mines: {minesRemaining}</div>
                    <div className="minesweeper-info-item">Time: {timeElapsed}s</div>
                    <select onChange={(e) => onSizeSelect({ target: { innerText: e.target.value } } as any)}>
                        <option value="Small (8x8, 10 mines)">Small (8x8, 10 mines)</option>
                        <option value="Medium (10x10, 15 mines)">Medium (10x10, 15 mines)</option>
                        <option value="Large (12x12, 20 mines)">Large (12x12, 20 mines)</option>
                    </select>
                    <select onChange={(e) => onMinesSelect({ target: { innerText: e.target.value } } as any)}>
                        <option value="Few (10 mines)">Few (10 mines)</option>
                        <option value="Normal (15 mines)">Normal (15 mines)</option>
                        <option value="Many (20 mines)">Many (20 mines)</option>
                    </select>
                                        <Button onClick={initializeGame}>New Game</Button>
                </div>
                <div className="minesweeper-board">
                    {board.map((row, rIdx) => (
                        <div key={rIdx} className="minesweeper-row">
                            {row.map((cell, cIdx) => (
                                <div
                                    key={cIdx}
                                    className={`minesweeper-cell ${cell.isRevealed ? 'revealed' : ''} ${cell.isFlagged ? 'flagged' : ''} ${cell.isMine && gameOver ? 'mine' : ''}`}
                                    onClick={() => revealCell(rIdx, cIdx)}
                                    onContextMenu={(e) => handleRightClick(e, rIdx, cIdx)}
                                    data-mine-count={cell.isRevealed && !cell.isMine && cell.mineCount > 0 ? cell.mineCount : undefined}
                                >
                                    {cell.isRevealed ? (cell.isMine ? '💣' : cell.mineCount > 0 ? cell.mineCount : '') : (cell.isFlagged ? '🚩' : '')}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </CardBody>
        </Card>
    );
};

export default Minesweeper;
