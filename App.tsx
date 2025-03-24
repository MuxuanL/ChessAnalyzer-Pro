import React, { useState, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import Stockfish from 'stockfish';
import { Analytics } from '@vercel/analytics/react';

const stockfish = new Stockfish();

function App() {
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState(game.fen());
  const [bestMove, setBestMove] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [depth, setDepth] = useState(20);

  useEffect(() => {
    stockfish.onmessage = (event: MessageEvent) => {
      const message = event.data;
      
      if (message.startsWith('bestmove')) {
        const move = message.split(' ')[1];
        setBestMove(move);
        setIsAnalyzing(false);
      }
    };

    return () => {
      stockfish.terminate();
    };
  }, []);

  const startAnalysis = () => {
    setIsAnalyzing(true);
    setBestMove(null);
    stockfish.postMessage(`position fen ${fen}`);
    stockfish.postMessage(`go depth ${depth}`);
  };

  const stopAnalysis = () => {
    setIsAnalyzing(false);
    stockfish.postMessage('stop');
  };

  const handleFenInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFen = e.target.value;
    try {
      const newGame = new Chess();
      newGame.load(newFen);
      setGame(newGame);
      setFen(newFen);
    } catch (error) {
      console.error('Invalid FEN string');
    }
  };

  const onDrop = (sourceSquare: string, targetSquare: string) => {
    try {
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q'
      });

      if (move) {
        setGame(new Chess(game.fen()));
        setFen(game.fen());
        return true;
      }
    } catch (error) {
      console.error('Invalid move');
    }
    return false;
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">ChessAnalyzer Pro</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              FEN String
            </label>
            <input
              type="text"
              value={fen}
              onChange={handleFenInput}
              className="w-full p-2 border rounded-md"
              placeholder="Enter FEN string"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Analysis Depth
            </label>
            <input
              type="number"
              value={depth}
              onChange={(e) => setDepth(Number(e.target.value))}
              min="1"
              max="30"
              className="w-full p-2 border rounded-md"
            />
          </div>

          <div className="flex gap-4 mb-6">
            <button
              onClick={startAnalysis}
              disabled={isAnalyzing}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
            >
              Start Analysis
            </button>
            <button
              onClick={stopAnalysis}
              disabled={!isAnalyzing}
              className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 disabled:bg-gray-400"
            >
              Stop Analysis
            </button>
          </div>

          {bestMove && (
            <div className="bg-green-100 p-4 rounded-md">
              <h3 className="font-semibold">Best Move:</h3>
              <p>{bestMove}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <Chessboard
            position={fen}
            onPieceDrop={onDrop}
            boardOrientation="white"
            customBoardStyle={{
              borderRadius: '4px',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
            }}
          />
        </div>
      </div>
      <Analytics />
    </div>
  );
}

export default App; 