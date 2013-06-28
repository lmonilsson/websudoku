/*globals jQuery */
/*globals module, test, equal, deepEqual, strictEqual */
/*globals SUDOKU */

(function($) {
	"use strict";
	
	module("Cell tests");
	
	test("Cell construction", function() {
		var cell = new SUDOKU.Cell(3, 2, 4, true);
		strictEqual(cell.row, 3);
		strictEqual(cell.column, 2);
		strictEqual(cell.value, 4);
		strictEqual(cell.isFixed, true);
	});
}(jQuery));

(function($) {
	"use strict";
	
	var boardDef = "000091000" +
			       "000700600" +
                   "001003040" +
                   "002050406" +
                   "090006007" +
                   "078400010" +
                   "080309100" +
                   "406810000" +
                   "030000000";
                   
    var solution = "847691352" +
                   "253748691" +
                   "961523748" +
                   "312957486" +
                   "594186237" +
                   "678432519" +
                   "785369124" +
                   "426815973" +
                   "139274865";
	
	var board;
	
	module("Board tests", {
		setup: function() {
			board = new SUDOKU.Board(boardDef);
		},
		teardown: function() {
			board = null;
		}
	});
	
	test("Board construction", function() {
		// Check some individual cells.
		deepEqual(board.getCell(1, 1), new SUDOKU.Cell(1, 1, 0, false));
		deepEqual(board.getCell(2, 4), new SUDOKU.Cell(2, 4, 7, true));
		
		// Check that the whole board corresponds to getting individual cells.
		var cells = board.getBoard(); 
		strictEqual(cells.length, 81);
		deepEqual(cells[0], board.getCell(1, 1));
		deepEqual(cells[20], board.getCell(3, 3));
		
		strictEqual(board.hasWon(), false);
		deepEqual(board.getConflicts(), []);
	});
	
	test("Change cell value", function() {
		var res = board.setCellValue(3, 2, 4);
		strictEqual(res, true);
		deepEqual(board.getCell(3, 2), new SUDOKU.Cell(3, 2, 4, false));
		
		// It should not be possible to change a fixed cell.
		res = board.setCellValue(3, 3, 4);
		strictEqual(res, false);
		deepEqual(board.getCell(3, 3), new SUDOKU.Cell(3, 3, 1, true));
	});
	
	test("Check winning condition", function() {
		var i;
		var row, col;
		var nOrig, nSolution;
		
		for (i = 0; i < 81; i += 1) {
			row = Math.floor(i / 9) + 1;
			col = i % 9 + 1;
			nOrig  = parseInt(boardDef[i], 10);
			nSolution = parseInt(solution[i], 10);
			if (nOrig === 0) {
				// It should not be won until all values have been put in,
				strictEqual(board.hasWon(), false);
				board.setCellValue(row, col, nSolution);
			}
		}
		
		strictEqual(board.hasWon(), true);
	});
	
	test("Conflicts", function() {
		var expected = [new SUDOKU.Cell(1, 1, 9, false),
		                new SUDOKU.Cell(1, 5, 9, true),
		                new SUDOKU.Cell(3, 4, 9, false),
		                new SUDOKU.Cell(5, 2, 9, true),
		                new SUDOKU.Cell(8, 2, 9, false)];
		var conflicts;
		board.setCellValue(1, 1, 9); // Same row as (1, 5)
		board.setCellValue(3, 4, 9); // Same cell as (1, 5)
		board.setCellValue(8, 2, 9); // Same column as (5, 2)
		conflicts = board.getConflicts();
		deepEqual(conflicts, expected)
	});
	
	test("Restart", function() {
	    board.setCellValue(1, 1, 3);
	    board.setCellValue(3, 2, 5);
	    board.restart();
	    deepEqual(board.getCell(1, 1), new SUDOKU.Cell(1, 1, 0, false));
	    deepEqual(board.getCell(3, 2), new SUDOKU.Cell(3, 2, 0, false));
	    deepEqual(board.getCell(8, 1), new SUDOKU.Cell(8, 1, 4, true));
	});
}(jQuery));
