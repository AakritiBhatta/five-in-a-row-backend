const cors = require('cors');
const express = require('express');

const app = express();
app.use(cors());
app.use(express.json());

var board = Array(6).fill().map(()=>Array(9).fill('N/A'));
var player1 = {
    name: '',
    value: 1
};
var gameID = '';
var player2 = {
    name: '',
    value: 2
};
var winSequence = []
var gameOver = false;
var winner = null;
var turn = player1;

app.get('/getBoardStatus', (req, res) => {
    let playersReady = false
    if(player1.name && player2.name){
        playersReady = true;
    } 
    res.json({board, playersReady, turn, gameOver, winner, winSequence});
});

app.post('/join', (req, res) => {
    if(player1.name && player2.name){
        return res.status(400).send({message: "Player is full."})
    }
    if(!player1.name){
        player1.name = req.body.playerName;
        gameID = new Date().valueOf();
        turn = player1
        return res.json({message: "Joined Successfully.", player: player1})
    } else if(!player2.name){
        player2.name = req.body.playerName
        return res.json({message: "Joined Successfully.", player: player2})
    }
})

app.post('/play', (req, res) => {
    const index = req.body.index;
    const currentPlayer = req.body.player

    for(let i = 5; i>=0; i--){
        if(board[i][index] === 'N/A'){
            board[i][index] = currentPlayer.value
            break;
        }
    }
    checkWin(currentPlayer);
    turn = turn.value == 1 ? player2 : player1;
    res.json({
        board: board,
        win: null,
        turn
    })
})

const checkWin = (playerDetail) => {
    let win = false;
    player = playerDetail.value;
    // Check win in rows
    for(let row=0; row<6; row++){
        for(let col=0; col<=4; col++){
            if(board[row][col] == player && board[row][col+1] == player && board[row][col+2] == player && board[row][col+3] == player && board[row][col+4] == player){
                win = true;
                winSequence = [row, col, row, col+1, row, col+2, row, col+3, row, col+4];
                break;
            }
        }
        if(win) break;
    }

    // Check win in columns
    for(let row=0; row<=1; row++){
        for(let col=0; col<9; col++){
            if(board[row][col] == player && board[row+1][col] == player && board[row+2][col] == player && board[row+3][col] == player && board[row+4][col] == player){
                win = true;
                winSequence = [row, col, row+1, col, row+2, col, row+3, col, row+4, col];
                break;
            }
        }
        if(win) break;
    }

    if(win){
        gameOver = true;
        winner = playerDetail;
    }
}

app.listen(4001, () =>
  console.log(`Server running on port on port 4001!`),
);