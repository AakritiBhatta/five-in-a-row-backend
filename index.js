const cors = require('cors');
const express = require('express');

const app = express();
app.use(cors());
app.use(express.json());

const CONNECT = 5, ROWS = 6, COLS = 9, PLAYER_1 = 1, PLAYER_2 = 2;
var gamesPlayed = 0;
var games = []; 

class Game {
    constructor(gameID) {
        this.gameID = gameID;
        this.currentPlayer = PLAYER_1;
        this.fiveInARow = Array(10).fill(0);
        this.gameOver = false;
        this.board = Array(6).fill().map(() => Array(9).fill(0));
        this.player1 = "";
        this.player2 = "";
        this.winner = null;
        this.playerLeft = false;
        this.init();
    }

    init() {
        this.numGamesFinished = 0;
        this.p1Wins = 0;
    }

    getBoard() { return this.board; }
    setBoard(b) { this.board = b; }
    getGameOver() { return this.gameOver; }
    setGameOver(t) { this.gameOver = t; }
    getCurrentPlayer() { return this.currentPlayer; }
    setCurrentPlayer(p) { this.currentPlayer = p; }
    getPlayer1Name() { return this.player1; }
    getPlayer2Name() { return this.player2; }
    setPlayer1Name(p1) { this.player1 = p1; }
    setPlayer2Name(p2) { this.player2 = p2; }
    get5InARow() { return this.fiveInARow; }
    set5InARow(f) { this.fiveInARow = f; }

    resetGame(movesFirst) {
        this.currentPlayer = movesFirst;
        this.fiveInARow = Array(10).fill(0);
        this.gameOver = false;
        this.board = Array(6).fill().map(() => Array(9).fill(0));
        this.winner = null;
        this.playerLeft = false;
    }
}

app.get('/getBoardStatus', (req, res) => {
    const gameId = req.query.gameId;
    let playersReady = false
    if(games[gameId]){
        if(games[gameId].getPlayer1Name() && games[gameId].getPlayer2Name()){
            playersReady = true;
        } 
        const game = games[gameId];
        res.json({...game, playersReady});
    }
    res.json({error: true, message: "Game not found"})
});

app.post('/create', (req, res) => {
    ++gamesPlayed;
    games[gamesPlayed] = new Game(gamesPlayed);                                                 
    games[gamesPlayed].setPlayer1Name(req.body.username);
    res.json({username: req.body.username, gameId: gamesPlayed});   
})

app.post('/join', (req, res) => {
    const gameId = req.body.gameId;
    const game = games[gameId];
    if(game){
        games[gameId].setPlayer2Name(req.body.username);                                                    
        games[gameId].setCurrentPlayer(PLAYER_1);       
    }
    res.json({username: req.body.username, gameId: gameId, firstPlayer: games[gameId].getPlayer1Name()})
})

app.post('/play', (req, res) => {
    const column = req.body.column;
    const gameId = req.body.gameId;
    console.log(gameId);
    console.log(games);
    let currentBoard = games[gameId].getBoard();

    if(currentBoard[0][column] !== 0){
        console.log('Column is full')
        res.status(400).json({error: true, message: "Column is full."})
    }else {
        for(let i = ROWS - 1; i >= 0; i--){
            if(currentBoard[i][column] === 0){
                currentBoard[i][column] = games[gameId].getCurrentPlayer();
                break;
            }
        }
        games[gameId].setBoard(currentBoard);
        currentBoard = null;
        checkWin(games[gameId].getCurrentPlayer(), gameId);
        changePlayer(gameId); 
        res.json({
            error: false,
            message: 'Played'
        })
    }
})

app.post('/restart', (req, res) => {
    const gameId = req.body.gameId;
    games[gameId].resetGame(PLAYER_1);  
})

app.post('/leaveGame', (req, res) => {
    const gameId = req.body.gameId;
    const leftPlayer = req.body.player;
    games[gameId].winner = leftPlayer == 1 ? 2 : 1;
    games[gameId].gameOver = true;
    games[gameId].playerLeft = true;
    res.json({
        error: false,
        message: 'Successfully left the game'
    })
})

const changePlayer = (gameId) => {
    games[gameId].setCurrentPlayer((games[gameId].getCurrentPlayer() == PLAYER_1 && !games[gameId].getGameOver()) ? PLAYER_2 : PLAYER_1);
}

const checkWin = (player, gameId) => {
    let win = false;
    let board = games[gameId].getBoard();

    // Check diagnonal win
    for (let row = 0; row <= ROWS - CONNECT; row++) {
        for (let col = CONNECT - 1; col < COLS; col++) {
            if (board[row][col] == player && board[row + 1][col - 1] == player && board[row + 2][col - 2] == player
                && board[row + 3][col - 3] == player && board[row + 4][col - 4] == player) {
                win = true;
                games[gameId].set5InARow([row, col, row + 1, col - 1, row + 2, col - 2, row + 3, col - 3, row + 4, col - 4]); 
                break;
            }
        }

        if (!win) {
            for (let col = 0; col <= COLS - CONNECT; col++) {
                if (board[row][col] == player && board[row + 1][col + 1] == player && board[row + 2][col + 2] == player
                    && board[row + 3][col + 3] == player && board[row + 4][col + 4] == player) {
                    win = true;
                    games[gameId].set5InARow([row, col, row + 1, col + 1, row + 2, col + 2, row + 3, col + 3, row + 4, col + 4]);
                    break;
                }
            }
        } else {
            break;
        }
    }

    // Check win in rows
    for(let row=0; row < ROWS; row++){
        for(let col=0; col <= COLS - CONNECT; col++){
            if(board[row][col] == player && board[row][col+1] == player && board[row][col+2] == player && board[row][col+3] == player && board[row][col+4] == player){
                win = true;
                games[gameId].set5InARow([row, col, row, col + 1, row, col + 2, row, col + 3, row, col + 4]);
                break;
            }
        }
        if(win) break;
    }

    // Check win in columns
    for(let row=0; row <= ROWS - CONNECT; row++){
        for(let col=0; col < COLS; col++){
            if(board[row][col] == player && board[row+1][col] == player && board[row+2][col] == player && board[row+3][col] == player && board[row+4][col] == player){
                win = true;
                games[gameId].set5InARow([row, col, row + 1, col, row + 2, col, row + 3, col, row + 4, col]);
                break;
            }
        }
        if(win) break;
    }

    if(win){
        games[gameId].setGameOver(true);
        games[gameId].numGamesFinished++; 
        games[gameId].winner = player;
        if (player === PLAYER_1) games[gameId].p1Wins++; 
    }
}

app.listen(4001, () =>
  console.log(`Server running on port on port 4001!`),
);