var dirchars = ['^', 'v', '>', '<'];
var dirs = ['North', 'South', 'East', 'West'];
var deltas = [[-1, 0], [1, 0], [0, 1], [0, -1]];
var opposites = [1, 0, 3, 2];

function valid(board, distanceFromTop, distanceFromLeft) {
	return (!(distanceFromTop < 0 || distanceFromLeft < 0 ||
		distanceFromTop > board.lengthOfSide - 1 || distanceFromLeft > board.lengthOfSide - 1));
}

function around(board, r, c, cb) {
	var delta, x, y;
	for(var di = 0; di < 4; di++) {
		delta = deltas[di];
		x = r + delta[0];
		y = c + delta[1];
		if(valid(board, x, y)) {
			cb(board.tiles[x][y], x, y, di);
		}
	}
}

function all(board, cb) {
	var i, j, t;
	for(i = 0; i < board.lengthOfSide; i++) {
		for(j = 0; j < board.lengthOfSide; j++) {
			t = board.tiles[i][j];
			cb(t, i, j);
		}
	}
}

function maketb(board) {
	var i, j;
	var size = board.lengthOfSide;
	var tb = [];
	var t;
	for(i = 0; i < size; i++) {
		t = [];
		for(j = 0; j < size; j++) {
			t.push({});
		}
		tb.push(t);
	}
	return tb;
}

function threat_map(game) {
	var me = game.activeHero;
	var tl = maketb(game.board);
	var queue = [];
	var h, i, j, k, xy, v;
	for(i = 0; i < game.heroes.length; i++) {
		h = game.heroes[i];
		if(h.dead || h.team == me.team)
			continue;

		tl[h.distanceFromTop][h.distanceFromLeft].ed = 0;
		tl[h.distanceFromTop][h.distanceFromLeft].edone = true;
		queue.push([h.distanceFromTop, h.distanceFromLeft]);
	}

	while(queue.length) {
		xy = queue.shift();

		around(game.board, xy[0], xy[1], function(atile, ax, ay) {
			if((atile.type == 'Unoccupied' || atile.type == 'Hero') && !tl[ax][ay].edone) {
				v = -1;
				around(game.board, ax, ay, function(atile, ax, ay) {
					var ed = tl[ax][ay].ed;
					if(tl[ax][ay].edone) {
						if(v == -1 || ed < v) {
							v = ed;
						}
					}
				});
				if(v != -1) {
					tl[ax][ay].ed = v + 1;
					tl[ax][ay].edone = true;
					queue.push([ax, ay]);
				}
			}
		});
	}

	return tl;
}
function debug_threat_map(tl) {
	var i, j, v, n, row, col;
	for(i = 0; i < tl.length; i++) {
		row = "[";
		for(j = 0; j < tl[i].length; j++) {
			v = tl[i][j];
			col = "---";
			if(v.edone) {
				n = String(v.ed);
				while(n.length < col.length) {
					n += " ";
				}
				col = n;
			}
			row += " " + col;
		}
		row += "]";
		console.log(row);
	}
}

function path_map(board, fx, fy, tx, ty, fitness_cb) {
	// special case for "hold still"
	if(fx == tx && fy == ty)
		return -2;

	var xy;
	var queue = [];
	var dmap = maketb(board);
	var d = -1; // -1 means could not find a path

	queue.push([tx, ty]);
	dmap[tx][ty].done = true;

	while(d == -1 && queue.length) {
		xy = queue.shift();

		around(board, xy[0], xy[1], function(atile, ax, ay, ad) {
			if(ax == fx && ay == fy) {
				d = opposites[ad];
				return;
			}

			if(fitness_cb && !fitness_cb(atile, ax, ay, ad)) {
				return;
			}

			if(atile.type == 'Unoccupied' && !dmap[ax][ay].done) {
				dmap[ax][ay].done = true;
				queue.push([ax, ay]);
			}
		});
	}

	return d;
}

function path_map_min_safety(tl, board, fx, fy, tx, ty, min_safety) {
	return path_map(board, fx, fy, tx, ty, function(atile, ax, ay, ad) {
		if(tl[ax][ay].edone && tl[ax][ay].ed < min_safety)
			return false;

		return true;
	});
}

function safest_path_map(tl, board, fx, fy, tx, ty) {
	var safety = 3;
	var dir = -1;
	while(safety > -1) {
		dir = path_map_min_safety(tl, board, fx, fy, tx, ty, safety);
		if(dir != -1)
			return dir;

		safety--;
	}

	return -1;
}


var move = function(game, helpers) {
	var me = game.activeHero;

	var tl = threat_map(game);

	// find the least dangerous route to the
	// least dangerous place on the map.

	var lv = 0;
	var lx = 0;
	var ly = 0;
	all(game.board, function(t, x, y) {
		if(tl[x][y].edone && tl[x][y].ed > lv) {
			lv = tl[x][y].ed;
			lx = x;
			ly = y;
		}
	});

	//debug_threat_map(tl);
	//console.log("threat level", tl[me.distanceFromTop][me.distanceFromLeft].ed);

	//var d = path_map(game.board, me.distanceFromTop, me.distanceFromLeft, lx, ly);

	var d = safest_path_map(tl, game.board, me.distanceFromTop, me.distanceFromLeft, lx, ly);

	if(d == -2) // already there
		return 'Stay';

	if(d == -1) // trapped!
		return 'Stay';

		//return dirs[Math.floor(Math.random() * 4)];

	return dirs[d];
};

module.exports = move;
