var okdimokPrimitives = function (sketch) {
    let s = sketch;
    let utils = this;

    this.getPaperSizeInPixes = function (paper, dpi, landscape) {
        let paper_size_mm = {
            a2: [420, 594],
            a3: [297, 420],
            a4: [210, 297],
        }
        let mm_per_inch = 25.4;
        let sz = paper_size_mm[paper];
        sz = sz.map(s => s/mm_per_inch*dpi);
        if (landscape) {
            return [sz[1], sz[0]]
        } else {
            return sz;
        }
    }

    this.randomIn = function randomIn (left, right) {
        return left + Math.random()*(right - left);
    }

    this.clip = function (v, minv, maxv) {
        if (v < minv) return minv;
        if (v > maxv) return maxv;
        return v;
    }

    this.realMod = v => v - Math.floor(v);

    this.hslFracToColor = function (h, s, l) {
        return sketch.color("hsl(" +
            (this.realMod(h) * 360).toFixed(0) + ", " +
            (this.clip(s, 0, 1)*100).toFixed(0) + "%, " +
            (this.clip(l, 0, 1)*100).toFixed(0) + "%" +
            ")");	
    }

    this.colorFracToHex = function (frac_orig) {
        var frac = this.clip(frac_orig, 0, 0.999)
        var s = Math.floor(frac * 256).toString(16);
        if (s.length == 1) return "0" + s;
        if (s.length == 2) return s;
        return "00";
    }

    this.ColorPoint = class ColorPoint {
        constructor(point, color) {
            this.p = point;
            this.c = color;
        }
    }

    this.Color = class Color {
        constructor(r, g, b) {
            this.r = r;
            this.g = g;
            this.b = b;
            this.channels = ["r", "g", "b"];
        }

        mix(other, ratio) {
            if (ratio == undefined) ratio = 0.5;
            let result = new Color();
            for (let c in this.channels) {
                result[c] = this[c] * (1 - ratio) + other[c] * ratio;
            }
        }

        getHex() {
            return "#" +
                utils.colorFracToHex(this.r) +
                utils.colorFracToHex(this.g) +
                utils.colorFracToHex(this.b);
        }

        static mixMany(...colors) {
            let result = new Color();
            var ratios = colors.map(c => c[1]);
            var total = ratios.reduce((partialSum, r) => partialSum + r, 0);
            ratios = ratios.map(r => r / total);
            for (var ch of Object.values(result.channels)) {
                result[ch] = 0.0;
                for (let i = 0; i < colors.length; i++) {
                    result[ch] += ratios[i] * colors[i][0][ch];
                }
            }
            return result;
        }
    }

    this.Point = class Point {
        constructor (x, y) {
            console.assert(false, "deprecated")
            this.x = x;
            this.y = y;
        }

        distance (other) {
            return Math.sqrt(this.distanceSqr(other));
        }
        
        distanceSqr (other) {
            return ((this.x - other.x) ** 2 + (this.y - other.y) ** 2);
        }
        
        add (other) {
            this.x += other.x;
            this.y += other.y;
            return this
        }
        
        scale (s) {
            this.x *= s;
            this.y *= s;
            return this;
        }
        
        getProjectedToCanvas(){
            return new Point(this.x % size_x, this.y % size_y);
        }
        
        copy() {
            return new Point(this.x, this.y);
        }
    }

    this.middle0 = function (vertices){
        var middle = {};
        const s = 1.0/vertices.length;
        for (const v in vertices) {
            for (const k in vertices[v]) {
                if (!(k in middle)) middle[k] = 0.0;
                middle[k] += s * vertices[v][k];
            }
        }
        return middle;
    }

    this.middle = function (points){
        let middle = new p5.Vector();
        for (const p of points) {
            middle.add(p);
        }
        middle.mult(1.0/points.length);
        return middle;
    }    


    // Takes an array and a number of needed minimal values
    // returns an array of pairs [[min_index, value_at_that_index]]
    this.argminN = function (ar, n) {
        let minPairs = [];
        for (var [k, v] of Object.entries(ar)) {
            if (minPairs.length < n) {
                minPairs.push([k, v])
            } else {
                if (v < minPairs[n - 1][1]) {
                    minPairs[n - 1] = [k, v];
                } else {
                    continue;
                }
            }
            minPairs.sort((a, b) => a[1] - b[1]);
        }
        return minPairs;
    }

    this.getPointColor = function (point, colorPoints) {
        let distances = colorPoints.map(cp => p5.Vector.sub(cp.p, point).magSq());
        let closest = argminN(distances, 3);
        let pairs = closest.map(v => [colorPoints[v[0]].c, v[1] ** (-2)]);
        return Color.mixMany(...pairs);

    }

    this.SpatialGradient = class SpatialGradient {
        constructor(colorPoints, n_closest, distance_mapping) {
            this.colorPoints = colorPoints;
            this.n_closest = n_closest;
            this.distance_mapping = distance_mapping !== undefined ? distance_mapping : v => v**(-2);
        }

        getPointColor(point){
            let distances = this.colorPoints.map(cp => p5.Vector.sub(cp.p, point).magSq());
            let closest = utils.argminN(distances, this.n_closest);
            let pairs = closest.map(v => [this.colorPoints[v[0]].c, this.distance_mapping(v[1])]);
            return utils.Color.mixMany(...pairs);
        }
    }

    this.Dynamics = class Dynamics {
        constructor(q, qdot) {
            this.q = q;
            this.qdot = qdot;
        }
        
        step(frame_s, elapsed_s) {
            console.assert(frame_s !== undefined);
            let dq = this.qdot.copy().mult(frame_s);
            this.q.add(dq);
        }
    }

    this.PerlinDynamics = class PerlinDynamics {
        constructor(q, sz, tempo) {
            this.qinit = q;
            this.q = q.copy();
            this.sz = sz;
            this.tempo = tempo;
            this.seed = utils.randomIn(0, 10000);
            this.seed2 = utils.randomIn(1000, 10000);
            this.step(0, 0);
        }
        
        step(frame_s, elapsed_s) {
            console.assert(frame_s !== undefined);
            this.q.x = this.qinit.x + s.map(s.noise(elapsed_s/this.tempo, this.seed), 0, 1, -1, 1)*this.sz.x;
            this.q.y = this.qinit.y + s.map(s.noise(elapsed_s/this.tempo, this.seed, this.seed2), 0, 1, -1, 1)*this.sz.y;
        }
        
    }

};