//generativeartistry.com/tutorials/triangular-mesh/
// ty <3 ruth & tim

let triangular_mesh_yasha_mia = function ( sketch ) {
    let s = sketch;
    let utils = new okdimokPrimitives(sketch);
    // var [size_x, size_y] = [3840, 2160];
	// var dpi = 100;
	var dpi = 600;
    var [size_x, size_y] = utils.getPaperSizeInPixes("a4", dpi);
    // var [size_x, size_y] = [500, 500];

    var disturbance = 0.8;
	var n_triangles_per_side = 30;
	var n_points = 100;
	var spatialGradient = undefined;

	this.add_monkeypox = function(n_per_side, rad) {
		let lines = [],
		gap = size_x / n_per_side,
		odd = true;

		for (var y = - gap / 2; y <= size_y + 3*gap; y += gap) {
			for (var x = gap / 4 - 2 * gap; x <= size_x + 2*gap; x += gap) {
				let x_c = x + (odd ? gap / 2 : 0);
				s.fill("#fff");
				s.circle(x_c, y, rad)
			}
			odd = !odd;
		}
	}

	this.prepareNewGrid = function() {
		var line, dot,
		odd = false,
		gap = size_x / n_triangles_per_side;
		lines=[];
	
		for (var y = - gap / 2; y <= size_y + 3*gap; y += gap) {
			odd = !odd;
			line = [];
			for (var x = gap / 4 - 2 * gap; x <= size_x + 2*gap; x += gap) {
				dot = {
					x: x + (odd ? gap / 2 : 0),
					y: y
				};
				line.push(new utils.PerlinDynamics(new p5.Vector(
						x + (odd ? gap / 2 : 0),
						y 
					), new p5.Vector(
						disturbance * gap,
						disturbance * gap,
					),
					5.
				));
			}
			lines.push(line);
		}
	}

	var lines=[];

	this.drawPatternOnAGrid = function () {
		var dotLine;
		odd = true; 
		let gap = size_x / n_triangles_per_side;
	
		for (var y = 0; y < lines.length - 1; y++) {
			odd = !odd;
			dotLine = [];
			for (var i = 0; i < lines[y].length; i++) {
				dotLine.push(odd ? lines[y][i] : lines[y + 1][i]);
				dotLine.push(odd ? lines[y + 1][i] : lines[y][i]);
			}
			for (var i = 0; i < dotLine.length - 2; i++) {
				var vertices = [dotLine[i], dotLine[i + 1], dotLine[i + 2]];
				var coords = [];
				for (let v of vertices.values()) {
					coords = coords.concat([v.q.x, v.q.y])
				}
				const color = colorByPoint(utils.middle(vertices.map(pd => pd.q)))
				s.fill(color);
				s.stroke(color);
				s.strokeWeight(1);
				s.triangle(...coords);
			}
		}
		
		for (var y = 0; y < lines.length - 1; y++) {
			for (var i = 0; i < lines[y].length; i++) {
				let p = lines[y][i].q;
				if (Math.random() < 0.99) {
					s.fill("#fff")
					// s.fill(yashaMiaColor())
					s.stroke(yashaMiaColor())
					// s.strokeWeight(dpi/200)
					s.noStroke()
					s.circle(p.x, p.y, 0.15*gap)
				}
			}
		}
	}

	this.drawPatternOnce = function() {
		// let colorPoints = [];
		// for (var i = 0; i < n_points/2; i++){
		// 	colorPoints.push(new utils.ColorPoint(new p5.Vector(
		// 			utils.randomIn(0, size_x),
		// 			utils.randomIn(0, size_y)
		// 		),
		// 		new utils.Color(0, 0.8, 0.6)
		// 	))
		// }
		// for (var i = 0; i < n_points/2; i++){
		// 	colorPoints.push(new utils.ColorPoint(new p5.Vector(
		// 			utils.randomIn(0, size_x),
		// 			utils.randomIn(0, size_y)
		// 		),
		// 		new utils.Color(1., 1., 1.)
		// 	))
		// }
		// spatialGradient = new utils.SpatialGradient(colorPoints, 3);
	
		this.prepareNewGrid();
		this.drawPatternOnAGrid();

		// this.add_monkeypox(n_triangles_per_side, 0.05*dpi);


		// const rad = 3;
		// for (var x = -rad; x <= size_x + 2 * rad; x += 2 * rad) {
		// 	for (var y = -rad; y <= size_y + 2 * rad; y += 2 * rad) {
		// 		let p = new p5.Vector(x, y);
		// 		s.fill(colorByPoint(utils.middle([p, p])))
		// 		s.circle(x, y, 2*rad);
		// 	}
		// }
	};

	var prev = s.millis(), curr = s.millis();
	this.stepGrid = function (){
		curr = s.millis();
		for (var y = 0; y < lines.length - 1; y++) {
			for (var i = 0; i < lines[y].length; i++) {
				lines[y][i].step((curr-prev)/1000., curr/1000.);
			}
		}
		prev = curr;

	}
	
	function yashaMiaColor() {
		if (Math.random() > 0.5) 
			return utils.hslFracToColor(
				// 0.05 + point.x/size/2.5
				// randomIn(0.05, 0.1),
				// -0.1 + 0.4 * Math.sin(1*point.x/size_x + (point.y/size_x)**2),
				174/360,
				utils.randomIn(0.8, 1.0),
				utils.randomIn(0.4, 1.0),
			);
		else
			return utils.hslFracToColor(
				// 0.05 + point.x/size/2.5
				// randomIn(0.05, 0.1),
				// -0.1 + 0.4 * Math.sin(1*point.x/size_x + (point.y/size_x)**2),
				// 30, 35/360,
				35/360,
				utils.randomIn(0.8, 1.0),
				utils.randomIn(0.5, 1.0),
			);
	}


	function yashaMiaColorNoise(point) {
		let gap = size_x / n_triangles_per_side;
		let factor = gap;
		if (s.noise(point.x/factor, point.y/factor, 0) > 0.5) 
			return utils.hslFracToColor(
				174/360,
				s.map(s.noise(point.x/factor, point.y/factor), 0.2, 0.8, 0.8, 1.0),
				s.map(s.noise(point.y/factor, point.x/factor), 0.2, 0.8, 0.4, 1.0),
			);
		else
			return utils.hslFracToColor(
				35/360,
				s.map(s.noise(point.x/factor, point.y/factor, 30), 0.2, 0.8, 0.8, 1.0),
				s.map(s.noise(point.y/factor, point.x/factor, 30), 0.2, 0.8, 0.5, 1.0),
			);
	}

	function colorByPoint(point) {
		// return "#ff0000";
		// return color = '#' +
		// 	utils.colorFracToHex() +
		// 	utils.colorFracToHex(point.x/size_x) +
		// 	utils.colorFracToHex(point.y/size_y);
		// return spatialGradient.getPointColor(point).getHex();
		return yashaMiaColorNoise(point);
		return yashaMiaColor();

	}
	
	var fullscreen = false;
	s.draw = function(){
		if (fullscreen) {
			stepGrid();
			drawPatternOnAGrid();
		}
	}
	
    s.setup = function() {
		s.createCanvas(size_x, size_y);
        s.background("#000");
		drawPatternOnce()
    }

	s.mouseClicked = function(){
		if (fullscreen) {this.make_a4();}
		else {this.make_fullscreen()}
	}
	
	s.windowResized = function() {
		if (fullscreen) {
			[size_x, size_y] = [s.windowWidth, s.windowHeight];
			s.resizeCanvas(size_x, size_y);
			drawPatternOnce();
		}
	}	
	
	s.make_fullscreen = function() {
		fullscreen = true;
		s.fullscreen(fullscreen);
		document.querySelector("body").style.overflow= "hidden";
		// document.querySelector("#make-fullscreen").style.display= "none";
		// document.querySelector("#make-a4").style.display= "block";
		document.querySelector("#manual").style.display= "none";
		[size_x, size_y] = [s.windowWidth, s.windowHeight];
		s.resizeCanvas(size_x, size_y);
		drawPatternOnce();
	}

	s.make_a4 = function() {
		fullscreen = false;
		s.fullscreen(fullscreen);
		document.querySelector("body").style.overflowY= "scroll";
		// document.querySelector("#make-a4").style.display= "none";
		// document.querySelector("#make-fullscreen").style.display= "block";
		document.querySelector("#manual").style.display= "block";
		[size_x, size_y] = utils.getPaperSizeInPixes("a4", dpi);
		s.resizeCanvas(size_x, size_y);
		drawPatternOnce();
	}
	
}



