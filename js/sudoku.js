var SUDOKU = (function($) {
	"use strict";
			
	function unique(arr) {
		var result = [];
		$.each(arr, function (idx, elem) {
			if ($.inArray(elem, result) === -1) {
				result.push(elem);
			}
		});
		return result;
	}
	
	function calcCellIndexFromBoardPosition(row, col) {
		return (row - 1) * 9 + (col - 1);
	}
	
	function calcBoardPositionFromIndex(idx) {
		var row = Math.floor(idx / 9) + 1;
		var col = idx % 9 + 1;
		return {
			row: row,
			column: col
		};
	}

	/**
	 * Creates a sudoku board cell.
	 * 
	 * @class Represents a cell on a sudoku board.
	 * @constructor
	 * @param {number} col The cell column, in the interval [1, 9].
	 * @param {number} row The cell row, in the interval [1, 9].
	 * @param {number} val The value of the cell, in the interval [0, 9]. 0 means no value.
	 * @param {bool} fixed Whether the value has a fixed value, i.e. whether it is an initial
	 *                     non-zero value.
	 */
	function Cell(row, col, val, fixed) {
		/** The cell row. */
		this.row = row;
		/** The cell column. */
		this.column = col;
		/** The cell value. 0 means it has no value.*/
		this.value = val;
		/** Whether the value is fixed. */
		this.isFixed = fixed;
	}
	
	/**
	 * Copies the given cell.
	 * 
	 * @param {Cell} cell The cell to copy.
	 * @return {Cell} A copy of the cell.
	 * */
	Cell.fromCell = function(cell) {
		return new Cell(cell.row, cell.column, cell.value, cell.isFixed);
	};
	
	/**
	 * Creates a sudoku board.
	 * 
	 * @class Represents a sudoku board, with methods for manipulating it.
	 * @constructor
	 * @param {string} boardDef The initial board configuration; a string of 81 numbers.
	 */
	function Board(boardDef) {
		var cells = [];
		
		function init() {
			var i;
			var pos, num, fixed;
			
			if (typeof boardDef !== "string") {
				throw {
					name: "SudokuBoardError",
					message: "Invalid board definition (not a string)"
				};
			}
			if (boardDef.length !== 81) {
				throw {
					name: "SudokuBoardError",
					message: "Invalid board definition (wrong length)"
				};
			}
			
			for (i = 0; i < boardDef.length; i += 1) {
				pos = calcBoardPositionFromIndex(i);
				num = parseInt(boardDef[i], 10);
				fixed = num !== 0;
				
				if (isNaN(num) || num < 0 || num > 9) {
					throw {
						name: "SudokuBoardError",
						message: "Invalid board definition (invalid cell value)"
					};
				}
				
				cells[i] = new Cell(pos.row, pos.column, num, fixed);
			}
		}
		
		function getCellAtPosition(row, col, copy) {
			var idx = calcCellIndexFromBoardPosition(row, col);
			var cell = cells[idx];
			return copy ? Cell.fromCell(cell) : cell;
		}
		
		function walkCellsByRow(cb) {
			var row, col, newRow, cell;
			for (row = 1; row <= 9; row += 1) {
				for (col = 1; col <= 9; col += 1) {
					cell = getCellAtPosition(row, col, false);
					newRow = col === 1;
					if (cb(cell, row, newRow) === false) {
						return;
					}
				}
			}
		}
			
		function walkCellsByColumn(cb) {
			var row, col, newCol, cell;
			for (col = 1; col <= 9; col += 1) {
				for (row = 1; row <= 9; row += 1) {
					cell = getCellAtPosition(row, col, false);
					newCol = row === 1;
					if (cb(cell, col, newCol) === false) {
						return;
					}
				}
			}
		}
			
		function walkCellsByBox(cb) {
			var boxIdx, inBoxIdx, newBox, firstCellIdx, cellIndices;
			var cell;
			for (boxIdx = 0; boxIdx < 9; boxIdx += 1) {
				firstCellIdx = Math.floor(boxIdx / 3) * 27 + (boxIdx % 3 * 3);
				cellIndices = [firstCellIdx,      firstCellIdx + 1,  firstCellIdx + 2,
				               firstCellIdx + 9,  firstCellIdx + 10, firstCellIdx + 11,
				               firstCellIdx + 18, firstCellIdx + 19, firstCellIdx + 20];
				for (inBoxIdx = 0; inBoxIdx < 9; inBoxIdx += 1) {
					cell = cells[cellIndices[inBoxIdx]];
					newBox = inBoxIdx === 0;
					if (cb(cell, boxIdx + 1, newBox) === false) {
						return;
					}
				}
			}
		}
		
		/** 
		 * Returns the current board as an array of 81 cells.
		 * 
		 * @return {array of Cell} The current board.
		 */
		this.getBoard = function() {
			return $.extend(true, [], cells);
		};
		
		/**
		 * Returns the cell at the specified position.
		 * 
		 * @param {number} row The row of the cell.
		 * @param {number} col The column of the cell.
		 * @return {Cell} The cell.
		 */
		this.getCell = function(row, col) {
			return getCellAtPosition(row, col, true);
		};
		
		/**
		 * Sets the value for the specified cell. Only non-fixed cells can have their values changed.
		 * 
		 * @param {number} row The row of the cell.
		 * @param {number} col The column of the cell.
		 * @return {bool} True if the cell value could be changed, otherwise false.
		 */
		this.setCellValue = function(row, col, value) {
			var cell = getCellAtPosition(row, col, false);
			if (!cell.isFixed) {
				cell.value = value;
			}
			return !cell.isFixed;
		};

		/**
		 * Checks whether the board is solved.
		 * 
		 * @return {bool} True if the board is solved, otherwise false.
		 */
		this.hasWon = function() {
			var won = true;
			
			function check(walkFun) {
				var usedNumbers;
				walkFun(function(cell, x, newX) {
					if (newX) {
						usedNumbers = {};
					}
					if (!cell.value) {
						won = false;
					} else if (usedNumbers[cell.value]) {
						won = false;
					} else {
						usedNumbers[cell.value] = true;
					}
					
					if (!won) {
						// Early exit.
						return false;
					}
				});
			}
			
			check(walkCellsByRow);
			if (!won) {
				check(walkCellsByColumn);
			}
			if(!won) {
				check(walkCellsByBox);
			}
			
			return won;
		};
		
		/**
		 * Returns all cells that conflict with other cells.
		 * The cells are ordered by row primarily and column secondarily.
		 * 
		 * @return {array of Cell} Cells that are in a conflict.  
		 */
		this.getConflicts = function() {
			var conflicts = [];
			
			function check(walkFun) {
				var cellsWithValue;
				walkFun(function(cell, x, newX) {
					if (newX) {
						if (cellsWithValue) {
							$.each(cellsWithValue, function(value, cells) {
								if (cells && cells.length > 1) {
									conflicts = conflicts.concat(cells);
								}
							});
						}
						cellsWithValue = {};
					}
									
					if (cell.value) {
						if(cellsWithValue[cell.value] === undefined) {
							cellsWithValue[cell.value] = [cell];
						} else {
							cellsWithValue[cell.value].push(cell);
						}
					}
				});
				
				// Handle the last row/column/box.
				$.each(cellsWithValue, function(value, cells) {
					if (cells && cells.length > 1) {
						conflicts = conflicts.concat(cells);
					}
				});
			}
			
			check(walkCellsByRow);
			check(walkCellsByColumn);
			check(walkCellsByBox);
			
			conflicts = unique(conflicts);
			conflicts.sort(function(a, b) {
				if (a.row < b.row) {
					return -1;
				} else if(a.row > b.row) {
					return 1;
				} else if (a.column < b.column) {
					return -1;
				} else if(a.column > b.column) {
					return 1;
				} else {
					// This shouldn't happen.
					return 0;
				}
			});
			
			return conflicts;
		};
		
		init();
	}

	
	function runInCanvas(drawingCanvas) {
		var cellSize = 20;
		
		var $canvas = $(drawingCanvas);
		var canvas = $canvas.get(0); // Make sure that it's not wrapped in a jQuery object.
		var context = canvas.getContext("2d");
			
		var outerBorderWidth = 2;
		var cellBorderWidth = 1;
		var boxBorderWidth = 2;
		var borderWidthPerAxis = 2 * outerBorderWidth + 6 * cellBorderWidth + 2 * boxBorderWidth;
		var boardSideSize = 9 * cellSize + borderWidthPerAxis;
		
		var activeCellBackgroundColor = "lightblue";
		var cellTextColor = "#000";
		var cellTextColorConflict = "#c00";
		var cellFont = "normal 10px Sans-serif";
		var fixedCellFont = "bold 10px Sans-serif";
		var winCellColor = "lightgreen";
		
		var board = null;
		var activeCell = null;
		var cellPixelPositions = {};
		var hasWon = false;
		var conflicts = [];
		
		function getCellPixelCoords(cell) {
			return cellPixelPositions[cell.row + "," + cell.column];
		}
		
		function setCellPixelCoords(cell, boardX, boardY) {
			cellPixelPositions[cell.row + "," + cell.column] = {
				boardX: boardX,
				boardY: boardY
			};
		}
		
		function cellIsInConflict(cell) {
			var i, conflictCell;
			for (i = 0; i < conflicts.length; i += 1) {
				conflictCell = conflicts[i];
				if (conflictCell.row === cell.row && conflictCell.column === cell.column) {
					return true;
				}
			}
			return false;
		}
		
		function getAdjacentCell(cell, direction) {
			var result = null;
			switch (direction) {
				case 0:
					// Left
					if (cell.column > 1) {
						result = board.getCell(cell.row, cell.column - 1);
					}
					break;
				case 1:
					// Up
					if (cell.row > 1) {
						result = board.getCell(cell.row - 1, cell.column);
					}
					break;
				case 2:
					// Right
					if (cell.column < 9) {
						result = board.getCell(cell.row, cell.column + 1);
					}
					break;
				case 3:
					// Down
					if (cell.row < 9) {
						result = board.getCell(cell.row + 1, cell.column);
					}
					break;
			}
			return result;
		}
					
		function calcCanvasCoordsFromPageCoords(pageX, pageY) {
			var boardX = pageX - $canvas.offset().left;
			var boardY = pageY - $canvas.offset().top;
			return {
				boardX: boardX,
				boardY: boardY
			};
		}
		
		function getCellAtBoardCoords(boardX, boardY) {
			var row, col;
			var rowStart, rowEnd, colStart, colEnd;
			var cell, cellPosition;
			
			for (row = 1; row <= 9; row += 1) {
				for (col = 1; col <= 9; col += 1) {
					cell = board.getCell(row, col);
					cellPosition = getCellPixelCoords(cell);
					
					rowStart = cellPosition.boardY;
					rowEnd = rowStart + cellSize;
					colStart = cellPosition.boardX;
					colEnd = colStart + cellSize;
					
					if (rowStart <= boardY && boardY <= rowEnd &&
							colStart <= boardX && boardX <= colEnd) {
						return cell;
					}
				}
			}
			
			return null;
		}
				
		function drawOuterBorder() {
			var lineOffset = outerBorderWidth * 0.5;
			var lineLength = boardSideSize;
			
			context.beginPath();
			
			// Left vertical border.
			context.moveTo(lineOffset, 0);
			context.lineTo(lineOffset, lineLength);
			// Right vertical border.
			context.moveTo(boardSideSize - lineOffset, 0);
			context.lineTo(boardSideSize - lineOffset, lineLength);
			// Top horizontal border.
			context.moveTo(0, lineOffset);
			context.lineTo(lineLength, lineOffset);
			// Bottom horizontal border.
			context.moveTo(0, boardSideSize - lineOffset);
			context.lineTo(lineLength, boardSideSize - lineOffset);
					
			context.lineWidth = outerBorderWidth;
			context.strokeStyle = "#000";
			context.stroke();
		}
		
		function drawCellBorders() {
			var lineOffset; // = cellBorderWidth * 0.5;
			var lineLength = (9 * cellSize) + (6 * cellBorderWidth) + (2 * boxBorderWidth);
			var lineWidth;
			var row, col;
			var verticalOffset, horizontalOffset;
			var cell;
			
			verticalOffset = outerBorderWidth;
			
			for(row = 1; row <= 9; row += 1) {
				// (Re)start from the left.
				horizontalOffset = outerBorderWidth;
				
				for (col = 1; col <= 9; col += 1) {
					// Store cell position.
					cell = board.getCell(row, col);
					setCellPixelCoords(cell, horizontalOffset, verticalOffset);
					
					if (col < 9) {
						// Vertical line.
						context.beginPath();
						
						lineWidth = (col % 3 === 0) ? boxBorderWidth : cellBorderWidth;
						lineOffset = lineWidth * 0.5;
						
						horizontalOffset += cellSize + lineOffset;
						context.moveTo(horizontalOffset, outerBorderWidth);
						context.lineTo(horizontalOffset, outerBorderWidth + lineLength);
						horizontalOffset += lineOffset;
						
						context.lineWidth = lineWidth;
						context.strokeStyle = "#000";
						context.stroke();
					}
				}
				
				if (row < 9) {
					// Horizontal line.
					context.beginPath();
											
					lineWidth = (row % 3 === 0) ? boxBorderWidth : cellBorderWidth;
					lineOffset = lineWidth * 0.5;
					
					verticalOffset += cellSize + lineOffset;
					context.moveTo(outerBorderWidth, verticalOffset);
					context.lineTo(outerBorderWidth + lineLength, verticalOffset);
					verticalOffset += lineOffset;
					
					context.lineWidth = lineWidth;
					context.strokeStyle = "#000";
					context.stroke();
				}
			}
			
			context.lineWidth = cellBorderWidth;
			context.strokeStyle = "#000";
			context.stroke();
		}
		
		function drawNumbers() {
			var row, col;
			var cell, cellPosition;
			var centerX, centerY;
			
			context.textAlign = "center";
			context.textBaseline = "middle";
			
			for (row = 1; row <= 9; row += 1) {
				for (col = 1; col <= 9; col += 1) {
					cell = board.getCell(row, col);
					if (cell.value) {
						cellPosition = getCellPixelCoords(cell);
						centerX = cellPosition.boardX + cellSize / 2;
						centerY = cellPosition.boardY + cellSize / 2;
						
						if (cellIsInConflict(cell)) {
							context.fillStyle = cellTextColorConflict;
						} else {
							context.fillStyle = cellTextColor;
						}
						
						if (cell.isFixed) {
							context.font = fixedCellFont;
						} else {
							context.font = cellFont;
						}
						
						context.fillText(cell.value, centerX, centerY);	
					}
				}
			}
		}
		
		function drawActiveCell() {
			if (activeCell) {
				var coords = getCellPixelCoords(activeCell);
				context.fillStyle = activeCellBackgroundColor;
				context.fillRect(coords.boardX, coords.boardY, cellSize, cellSize);
			}
		}
		
		function drawWinState() {
			var row, col, cell, coords;
			
			context.fillStyle = winCellColor;
			
			for (row = 1; row <= 9; row += 1) {
				for (col = 1; col <= 9; col += 1) {
					cell = board.getCell(row, col);
					coords = getCellPixelCoords(cell);
					context.fillRect(coords.boardX, coords.boardY, cellSize, cellSize);
				}
			}
		}
				
		function drawBoard() {
			context.clearRect(0, 0, canvas.width, canvas.height);
			drawOuterBorder();
			drawCellBorders();
			if (hasWon) {
				drawWinState();
			} else {
				drawActiveCell();
			}
			drawNumbers();
		}
		
		function handleClick(evt) {
			if (hasWon) {
				return;
			}
			
			var boardPosition = calcCanvasCoordsFromPageCoords(evt.pageX, evt.pageY);
			var clickedCell = getCellAtBoardCoords(boardPosition.boardX, boardPosition.boardY);
			
			if (clickedCell && !clickedCell.isFixed) {
				activeCell = clickedCell;
				drawBoard();
			} else if (clickedCell === null && activeCell) {
				activeCell = null;
				drawBoard();
			}
		}
		
		function handleKeydown(evt) {
			var key = evt.which;
			var number = null;
			var direction = null, newActiveCell;
			
			if (key >= 48 && key <= 58) {
				// Main numeric keys.
				number = key - 48;
			} else if (key >= 96 && key <= 106) {
				// Numpad.
				number = key - 96;
			} else if (key === 8) {
				// Backspace.
				number = 0;
			} else if (key === 32) {
				// Space.
				number = 0;
			} else if (key >= 37 && key <= 40) {
				// Arrows keys.
				// 37: left
				// 38: up
				// 39: right
				// 40: down
				direction = key - 37;
			}
			
			if (number !== null && activeCell) {
				board.setCellValue(activeCell.row, activeCell.column, number);
				if (board.hasWon()) {
					activeCell = null;
					hasWon = true;
				} else {
					conflicts = board.getConflicts();
				}
				
				drawBoard();
			} else if (direction !== null && activeCell) {
				// Find adjacent non-fixed cell.
				newActiveCell = activeCell;
				do {
					newActiveCell = getAdjacentCell(newActiveCell, direction);
				} while (newActiveCell && newActiveCell.isFixed);
				
				if (newActiveCell) {
					activeCell = newActiveCell;
					drawBoard();
				}
			}
		}
		
		function initGui() {
			canvas.width = boardSideSize;
			canvas.height = boardSideSize;
			
			$(document).click(handleClick).keydown(handleKeydown);
		}
		
		function init() {
			var boardDef = "000091000" +
			       "000700600" +
                   "001003040" +
                   "002050406" +
                   "090006007" +
                   "078400010" +
                   "080309100" +
                   "406810000" +
                   "030000000";
			board = new Board(boardDef);
			initGui();
			drawBoard();
		}
		
		init();
	}
	
	function debugLog(msg) {
		console.log("<Sudoku>: " + msg);
	}
	
	return {
		Cell: Cell,
		Board: Board,
		runInCanvas: runInCanvas
	};
}(jQuery));
