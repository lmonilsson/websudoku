makepackage:
	rm -rf build/websudoku
	mkdir -p build/websudoku
	cp -r 404.html css img index.html js test_sudoku.html build/websudoku
	tar -cjf websudoku.tar.bz2 -C build websudoku
	rm -rf build/websudoku
