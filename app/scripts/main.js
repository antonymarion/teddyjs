// http://www-ui.is.s.u-tokyo.ac.jp/~takeo/papers/siggraph99.pdf

var Teddy = Teddy || {};

Teddy.DIST_THRESHOLD = 0.001;

Teddy.points = [
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(0.5, 1, 0),
  new THREE.Vector3(1.5, 1.5, 0),
  new THREE.Vector3(2, 2.5, 0),
  new THREE.Vector3(2.6, 2.8, 0),
  new THREE.Vector3(3.8, 2.5, 0),
  new THREE.Vector3(4.2, 2, 0),
  new THREE.Vector3(4.5, 1.5, 0),
  new THREE.Vector3(5, 1, 0),
  new THREE.Vector3(5.5, 0.8, 0),
  new THREE.Vector3(6.5, -0.5, 0),
  new THREE.Vector3(5, -1, 0),
  new THREE.Vector3(4.5, -1, 0),
  new THREE.Vector3(4, -0.9, 0),
  new THREE.Vector3(3.5, 0, 0),
  new THREE.Vector3(2.5, -1, 0),
  new THREE.Vector3(1, -1.5, 0),
  new THREE.Vector3(0, -1, 0),
];

Teddy.outlineSize = Teddy.points.length;

Teddy.isOutline = function(pointId1, pointId2) {
  return (Math.abs(pointId1 - pointId2) == 1) || (Math.abs(pointId1 - pointId2) == Teddy.outlineSize - 1);
};

Teddy.getPointIndex = function(x, y, z) {
  var v = typeof y === 'undefined' ? x : new THREE.Vector3(x, y, z);
  for (var i = 0; i < Teddy.points.length; i++) {
    if (Teddy.points[i].distanceTo(v) < Teddy.DIST_THRESHOLD) return i;
  }
  Teddy.points.push(v);
  return Teddy.points.length - 1;
};

Teddy.makeClockwise = function(triangle) {
  var p0 = Teddy.points[triangle[0]];
  var p1 = Teddy.points[triangle[1]];
  var p2 = Teddy.points[triangle[2]];

  var v01 = p1.clone().sub(p0);
  var v02 = p2.clone().sub(p0);
  if (v01.dot(v02) > 0) {
    return [triangle[0], triangle[2], triangle[1]];
  }
  else {
    return triangle;
  }
};

Teddy.Body = function() {
  this.spines = [];
};

Teddy.Body.prototype.addSpine = function(spine) {
  this.spines.push(spine);
};

Teddy.Body.prototype.prunSpines = function() {
  var prunedSpines = [];
  this.spines.forEach(function(tSpine) {
    if (!tSpine.isTerminal()) return;

    var currentSpine = tSpine;
    var currentJoint = currentSpine.joint1.isTerminal() ? currentSpine.joint1 : currentSpine.joint2;
    var checkPointIds = [];
    do {
      prunedSpines.push(currentSpine);
      currentJoint = currentSpine.getNextJoint(currentJoint);

      var linkPointIds = currentSpine.getEdgeIdsIncluding(currentJoint.getPoint());
      var linkPoints = linkPointIds.map(function(id) {return Teddy.points[id]});
      var center = currentJoint.getPoint();
      var distance = center.distanceTo(linkPoints[0]);
      currentSpine.getAllPointIdsWithoutIds(linkPointIds).forEach(function(pointId) {
        checkPointIds.push(pointId);
      });
      for (var i = 0; i < checkPointIds.length; i++) {
        var point = Teddy.points[checkPointIds[i]];
        if (distance < center.distanceTo(point)) {
          checkPointIds.push(linkPointIds[0]);
          checkPointIds.push(linkPointIds[1]);
          checkPointIds = checkPointIds.sort(function(a, b) {
            return a === b ? 0 : a < b ? -1 : 1;
          });
          var cursor = checkPointIds.shift();
          for (var i = 0; i < checkPointIds.length + 1; i++) {
            checkPointIds.push(cursor);
            if (checkPointIds[0] === cursor + 1) {
              cursor = checkPointIds.shift();
            }
            else {
              break;
            }
          }
          for (var i = 1; i < checkPointIds.length; i++) {
            currentJoint.addTriangle(
              checkPointIds[i-1],
              checkPointIds[i],
              Teddy.getPointIndex(center)
            );
          }
          return;
        }
      }

      currentSpine = currentJoint.getSpinesExcept(currentSpine)[0];

      if (currentSpine.isJunction()) {
        // TODO: need refactoring
        prunedSpines.push(currentSpine);
        linkPointIds.forEach(function(id) { checkPointIds.push(id); });
        currentJoint = currentSpine.getNextJoint(currentJoint);
        var center = currentJoint.getPoint();
        checkPointIds = checkPointIds.sort(function(a, b) {
          return a === b ? 0 : a < b ? -1 : 1;
        });
        var cursor = checkPointIds.shift();
        for (var i = 0; i < checkPointIds.length + 1; i++) {
          checkPointIds.push(cursor);
          if (checkPointIds[0] === cursor + 1) {
            cursor = checkPointIds.shift();
          }
          else {
            break;
          }
        }
        for (var i = 1; i < checkPointIds.length; i++) {
          currentJoint.addTriangle(
            checkPointIds[i-1],
            checkPointIds[i],
            Teddy.getPointIndex(center)
          );
        }
        return;
      }
      else if (currentSpine.isSleeve()) {
        // go next
      }
      else if (currentSpine.isTerminal()) {
        throw 'ERROR: cannot handle this geometry';
      }
    } while (typeof currentSpine !== 'undefined'); 
  });

  prunedSpines.map(function(spine) {
    return this.spines.indexOf(spine);
  }, this).sort(function(a, b) {
    return a === b ? 0 : a < b ? 1 : -1
  }).forEach(function(id) {
    this.spines.splice(id, 1);
  }, this);

  this.spines.forEach(function(spine) {
    var triangle = spine.triangles[0].triangle;
    spine.triangles = [];
    var isJunction = true;
    [[0, 1, 2], [1, 2, 0], [2, 0, 1]].forEach(function(ijk) {
      var i = ijk[0], j = ijk[1], k = ijk[2];
      if (Teddy.isOutline(triangle[i], triangle[j])) {
        isJunction = false;
        spine.joint1.addTriangle(triangle[i], triangle[j], spine.joint1.pointIndex);
        spine.triangles.push({triangle:[triangle[i], spine.joint1.pointIndex, spine.joint2.pointIndex]});
        spine.triangles.push({triangle:[triangle[k], spine.joint1.pointIndex, spine.joint2.pointIndex]});
        return;
      }
    });
    if (isJunction) {
      // junction
      var p0 = Teddy.points[triangle[0]];
      var p1 = Teddy.points[triangle[1]];
      var p2 = Teddy.points[triangle[2]];
      var center = new THREE.Vector3(
        (p0.x + p1.x + p2.x) / 3,
        (p0.y + p1.y + p2.y) / 3,
        (p0.z + p1.z + p2.z) / 3
      );
      var jp1 = spine.joint1.getPoint();
      var jp2 = spine.joint2.getPoint();
      var joints = jp1.distanceTo(center) < jp2.distanceTo(center) ? [spine.joint2, spine.joint1] : [spine.joint1, spine.joint2];
      var edgeJoint = joints[0];
      var centerJoint = joints[1];
      var l01 = p0.clone().add(p1).multiplyScalar(0.5).distanceTo(edgeJoint.getPoint());
      var l12 = p1.clone().add(p2).multiplyScalar(0.5).distanceTo(edgeJoint.getPoint());
      var l20 = p2.clone().add(p0).multiplyScalar(0.5).distanceTo(edgeJoint.getPoint());
      if (l01 <= l12 && l01 <= l20) {
        spine.triangles.push({triangle:[triangle[0], edgeJoint.pointIndex, centerJoint.pointIndex]});
        spine.triangles.push({triangle:[triangle[1], edgeJoint.pointIndex, centerJoint.pointIndex]});
      }
      else if (l12 <= l01 && l12 <= l20) {
        spine.triangles.push({triangle:[triangle[1], edgeJoint.pointIndex, centerJoint.pointIndex]});
        spine.triangles.push({triangle:[triangle[2], edgeJoint.pointIndex, centerJoint.pointIndex]});
      }
      else if (l20 <= l01 && l20 <= l12) {
        spine.triangles.push({triangle:[triangle[2], edgeJoint.pointIndex, centerJoint.pointIndex]});
        spine.triangles.push({triangle:[triangle[0], edgeJoint.pointIndex, centerJoint.pointIndex]});
      }
      else {
        throw 'never reach';
      }
    }
  });
};

Teddy.Body.prototype.elevateSpines = function() {
  this.spines.forEach(function(spine) {
    spine.elevate();
  }, this);
};

Teddy.Body.prototype.drawSkins = function(scene) {
  this.spines.forEach(function(spine) {
    var type =
      spine.isTerminal() ? 't' :
      spine.isSleeve() ? 's' :
      spine.isJunction() ? 'j' : '';
    spine.triangles.forEach(function(triangle) {
      displayTriangle(scene, triangle['triangle'], type);
    });
    spine.joint1.triangles.forEach(function(triangle) {
      displayTriangle(scene, triangle, type);
    });
    spine.joint2.triangles.forEach(function(triangle) {
      displayTriangle(scene, triangle, type);
    });
  }, this);
};

Teddy.Body.prototype.drawSpines = function(scene) {
  this.spines.forEach(function(spine) {
    displayLine(scene, spine.joint1.getPoint(), spine.joint2.getPoint(), 0xff0000, 0.2);
  }, this);
};

Teddy.Spine = function(joint1, joint2) {
  if (joint1 instanceof THREE.Vector3) joint1 = Teddy.getPointIndex(joint1);
  if (joint2 instanceof THREE.Vector3) joint2 = Teddy.getPointIndex(joint2);
  if (typeof joint1 === 'number') joint1 = Teddy.getJoint(joint1);
  if (typeof joint2 === 'number') joint2 = Teddy.getJoint(joint2);

  this.joint1 = joint1;
  this.joint1.addSpine(this);
  this.joint2 = joint2;
  this.joint2.addSpine(this);
  this.triangles = [];
};

Teddy.Spine.prototype.getEdgeIdsIncluding = function(point) {
  var ret = [];
  this.triangles.forEach(function(triangle) {
    var pointIds = triangle.triangle;
    [[0,1], [1,2], [2,0]].forEach(function(edgeIds) {
      var pi1 = pointIds[edgeIds[0]];
      var pi2 = pointIds[edgeIds[1]];
      var p1 = Teddy.points[pi1];
      var p2 = Teddy.points[pi2];
      var center = p1.clone().add(p2).multiplyScalar(0.5);
      if (center.distanceTo(point) < 0.01) {
        ret.push(pi1);
        ret.push(pi2);
        return;
      }
    });
  });
  return ret;
};

Teddy.Spine.prototype.getNextJoint = function(joint) {
  //return this.joint1.isNear(joint) ? this.joint2 : this.joint1;
  return this.joint1 === joint ? this.joint2 : this.joint1;
};

Teddy.Spine.prototype.isTerminal = function() {
  return this.joint1.isTerminal() || this.joint2.isTerminal();
};

Teddy.Spine.prototype.isSleeve = function() {
  return this.joint1.isSleeve() || this.joint2.isSleeve();
};

Teddy.Spine.prototype.isJunction = function() {
  return this.joint1.isJunction() || this.joint2.isJunction();
};

Teddy.Spine.prototype.addTriangle = function(triangle) {
  this.triangles.push(triangle);
};

Teddy.Spine.prototype.getAllPointIds = function() {
  return this.getAllPointIdsWithoutIds([]);
};

Teddy.Spine.prototype.getAllPointIdsWithoutIds = function(ids) {
  var ret = [];
  this.triangles.forEach(function(triangle) {
    triangle.triangle.forEach(function(pointIndex) {
      if (ret.indexOf(pointIndex) < 0 && ids.indexOf(pointIndex) < 0) {
        ret.push(pointIndex);
      }
    });
  });
  return ret;
};

Teddy.Spine.prototype.elevate = function() {
  if (typeof this.joint1 !== 'undefined') this.joint1.elevate();
  if (typeof this.joint1 !== 'undefined') this.joint2.elevate();
};

Teddy.Spine.prototype.isEqual = function(that) {
  var thisJ1 = typeof this.joint1 === 'undefined' ? -1 : this.joint1.pointIndex;
  var thisJ2 = typeof this.joint2 === 'undefined' ? -1 : this.joint2.pointIndex;
  var thatJ1 = typeof that.joint1 === 'undefined' ? -1 : that.joint1.pointIndex;
  var thatJ2 = typeof that.joint2 === 'undefined' ? -1 : that.joint2.pointIndex;

  return (thisJ1 === thatJ1 && thisJ2 === thatJ2)
      || (thisJ1 === thatJ2 && thisJ2 === thatJ1);
};

Teddy.Spine.prototype.toString = function() {
  var thisJ1 = typeof this.joint1 === 'undefined' ? -1 : this.joint1.pointIndex;
  var thisJ2 = typeof this.joint2 === 'undefined' ? -1 : this.joint2.pointIndex;

  return '' + thisJ1 + ',' + thisJ2;
};

Teddy.Joints = [];

Teddy.getJoint = function(index) {
  for (var i = 0; i < Teddy.Joints.length; i++) {
    var joint = Teddy.Joints[i];
    if (joint.pointIndex === index) return joint;
  }
  var newJoint = new Teddy.Joint(index);
  Teddy.Joints.push(newJoint);
  return newJoint;
};

Teddy.Joint = function(index) {
  this.pointIndex = index;
  this.spines = [];
  this.triangles = [];
  this.elevated = false;
};

Teddy.Joint.prototype.getPoint = function() {
  return Teddy.points[this.pointIndex];
};

Teddy.Joint.prototype.addSpine = function(spine) {
  if (this.spines.indexOf(spine) < 0) this.spines.push(spine);
};

Teddy.Joint.prototype.getSpinesExcept = function(spine) {
  var ret = [];
  this.spines.forEach(function(b) {
    if (!b.isEqual(spine)) ret.push(b);
  });
  return ret;
};

Teddy.Joint.prototype.isTerminal = function() {
  return this.spines.length === 1;
};

Teddy.Joint.prototype.isSleeve = function() {
  return this.spines.length === 2;
};

Teddy.Joint.prototype.isJunction = function() {
  return this.spines.length === 3;
};

Teddy.Joint.prototype.addTriangle = function(x, y, z) {
  this.triangles.push([x, y, z]);
};

Teddy.Joint.prototype.isNear = function(joint) {
  return this.getPoint().distanceTo(joint.getPoint()) < Teddy.DIST_THRESHOLD;
};

Teddy.Joint.prototype.elevate = function() {
  if (this.elevated) return;
  this.elevated = true;

  var allPointIds = [];
  this.spines.forEach(function(spine) {
    spine.triangles.forEach(function(triangle) {
      allPointIds.push(triangle.triangle[0]);
      allPointIds.push(triangle.triangle[1]);
      allPointIds.push(triangle.triangle[2]);
    }, this);
  }, this);
  this.triangles.forEach(function(triangle) {
    allPointIds.push(triangle[0]);
    allPointIds.push(triangle[1]);
    allPointIds.push(triangle[2]);
  }, this);

  var pointIds = [];
  allPointIds.forEach(function(pointId) {
    if (pointIds.indexOf(pointId) < 0 && pointId < Teddy.outlineSize) {
      pointIds.push(pointId);
    }
  }, this);

  var jointPoint = this.getPoint();
  var sumDistance = 0;
  pointIds.forEach(function(pointId) {
    sumDistance += Teddy.points[pointId].distanceTo(jointPoint);
  }, this);
  Teddy.points[this.pointIndex].z = sumDistance / pointIds.length;
};






function getTriangleType(i, j, k) {
  var edges = [];
  if (Teddy.isOutline(i, j)) edges.push([0, 1]);
  if (Teddy.isOutline(j, k)) edges.push([1, 2]);
  if (Teddy.isOutline(k, i)) edges.push([2, 0]);

  switch (edges.length) {
    case 0: return {type:'j', edges:edges};
    case 1: return {type:'s', edges:edges};
    case 2: return {type:'t', edges:edges};
    default: throw 'error';
  }
}

function displayLine(scene, p1, p2, color, z) {
  if (typeof color === 'undefined') color = 0xff0000;
  if (typeof z !== 'undefined') {
    p1 = p1.clone();
    p1.z = z;
    p2 = p2.clone();
    p2.z = z;
  }
  var geometry = new THREE.Geometry();
  geometry.vertices.push(p1);
  geometry.vertices.push(p2);
  var line = new THREE.Line(geometry, new THREE.LineBasicMaterial({color: color}));
  scene.add(line);
}

function displayPoint(scene, p, color, z) {
  var dx = Math.random()/5;
  dx = 0.1;
  var p1 = p.clone();
  p1.z = z;
  var p2 = p.clone();
  p2.x -= dx;
  p2.y -= 0.1;
  p2.z = z;
  var p3 = p.clone();
  p3.x -= dx;
  p3.y += 0.1;
  p3.z = z;
  var geometry = new THREE.Geometry();
  geometry.vertices.push(p1);
  geometry.vertices.push(p2);
  geometry.vertices.push(p3);
  geometry.faces.push(new THREE.Face3(0, 1, 2));
  var mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({color:color, ambient:0xffff, wireframe:true}));
  scene.add(mesh);
}

function displayTriangle(scene, triangle, materialType) {
  triangle = Teddy.makeClockwise(triangle); // TODO: おかしい？

  var geometry = new THREE.Geometry();
  geometry.vertices.push(Teddy.points[triangle[0]]);
  geometry.vertices.push(Teddy.points[triangle[1]]);
  geometry.vertices.push(Teddy.points[triangle[2]]);
  geometry.faces.push(new THREE.Face3(0, 1, 2));
  geometry.computeFaceNormals();
  var mesh = new THREE.Mesh(geometry, materials[materialType]);
  scene.add(mesh);
};

function triangulate(contour, useShapeUtil) {
  if (useShapeUtil) {
    return THREE.Shape.Utils.triangulateShape(contour, []);
  }
  else {
    var contourPT = [];
    var pointTable = {};
    contour.forEach(function(point, index) {
      if (!pointTable[point.x]) pointTable[point.x] = {};
      pointTable[point.x][point.y] = index;
      contourPT.push(new poly2tri.Point(point.x, point.y));
    });
    var swctx = new poly2tri.SweepContext(contourPT);
    swctx.triangulate();
    var triangles = swctx.getTriangles();
    var triangleIndex = [];
    triangles.forEach(function(triangle) {
      var points = triangle.points_;
      triangleIndex.push([
        pointTable[points[0].x][points[0].y],
        pointTable[points[1].x][points[1].y],
        pointTable[points[2].x][points[2].y]
      ]);
    });
    return triangleIndex;
  }
}

var triangles = triangulate(Teddy.points);

var renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

var scene = new THREE.Scene();

var camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000);
camera.position.z = 8;
scene.add(camera);

var light = new THREE.DirectionalLight(0xffffff);
light.position.set(1, 1, 1);
scene.add(light);
var ambient = new THREE.AmbientLight(0x333333);
scene.add(ambient);

var materials = {
/*
  t: new THREE.MeshBasicMaterial({color: 0xffffcc, ambient:0xffffff, wireframe:true}),
  s: new THREE.MeshBasicMaterial({color: 0xffffff, ambient:0xffffff, wireframe:true}),
  j: new THREE.MeshBasicMaterial({color: 0xffcccc, ambient:0xffffff, wireframe:true})
*/
  t: new THREE.MeshPhongMaterial({color: 0xffffcc, side:THREE.DoubleSide}),
  s: new THREE.MeshPhongMaterial({color: 0xffffff, side:THREE.DoubleSide}),
  j: new THREE.MeshPhongMaterial({color: 0xffcccc, side:THREE.DoubleSide})
};

var teddy = new Teddy.Body();
triangles.forEach(function(triangle) {
  var t0 = triangle[0];
  var t1 = triangle[1];
  var t2 = triangle[2];
  var p0 = Teddy.points[t0];
  var p1 = Teddy.points[t1];
  var p2 = Teddy.points[t2];
  var c01 = new THREE.Vector3((p0.x + p1.x) / 2, (p0.y + p1.y) / 2, 0);
  var c12 = new THREE.Vector3((p1.x + p2.x) / 2, (p1.y + p2.y) / 2, 0);
  var c20 = new THREE.Vector3((p2.x + p0.x) / 2, (p2.y + p0.y) / 2, 0);
  var c012 = new THREE.Vector3((p0.x + p1.x + p2.x) / 3, (p0.y + p1.y + p2.y) / 3, 0);

  var triangleType = getTriangleType(t0, t1, t2);

  switch (triangleType.type) {
    case 't':
      if (triangleType.edges.toString() == '0,1,1,2') {
        var spine = new Teddy.Spine(p1, c20);
        spine.addTriangle({triangle:triangle, edges:triangleType.edges, links:[[2,0]]});
        teddy.addSpine(spine);
      }
      else if (triangleType.edges.toString() == '1,2,2,0') {
        var spine = new Teddy.Spine(p2, c01);
        spine.addTriangle({triangle:triangle, edges:triangleType.edges, links:[[0,1]]});
        teddy.addSpine(spine);
      }
      else if (triangleType.edges.toString() == '0,1,2,0') {
        var spine = new Teddy.Spine(p0, c12);
        spine.addTriangle({triangle:triangle, edges:triangleType.edges, links:[[1,2]]});
        teddy.addSpine(spine);
      }
      break;
    case 's':
      if (triangleType.edges.toString() == '0,1') {
        var spine = new Teddy.Spine(c12, c20);
        spine.addTriangle({triangle:triangle, edges:triangleType.edges, links:[[1,2], [2,0]]});
        teddy.addSpine(spine);
      }
      else if (triangleType.edges.toString() == '1,2') {
        var spine = new Teddy.Spine(c20, c01);
        spine.addTriangle({triangle:triangle, edges:triangleType.edges, links:[[2,0], [0,1]]});
        teddy.addSpine(spine);
      }
      else if (triangleType.edges.toString() == '2,0') {
        var spine = new Teddy.Spine(c01, c12);
        spine.addTriangle({triangle:triangle, edges:triangleType.edges, links:[[0,1], [1,2]]});
        teddy.addSpine(spine);
      }
      break;
    case 'j':
      var spine1 = new Teddy.Spine(c01, c012);
      spine1.addTriangle({triangle:triangle, edges:triangleType.edges, links:[[0,1], [1,2], [2,0]]});
      teddy.addSpine(spine1);
      var spine2 = new Teddy.Spine(c12, c012);
      spine2.addTriangle({triangle:triangle, edges:triangleType.edges, links:[[0,1], [1,2], [2,0]]});
      teddy.addSpine(spine2);
      var spine3 = new Teddy.Spine(c20, c012);
      spine3.addTriangle({triangle:triangle, edges:triangleType.edges, links:[[0,1], [1,2], [2,0]]});
      teddy.addSpine(spine3);
      break;
  }
});

teddy.prunSpines();
teddy.elevateSpines();
teddy.drawSkins(scene);
//teddy.drawSpines(scene);

var controls = new THREE.FlyControls(camera);
controls.movementSpeed = 1000;
controls.rollSpeed = Math.PI / 24;
var clock = new THREE.Clock();    
function render() {
//  controls.update(clock.getDelta()); 
  requestAnimationFrame(render);
  renderer.render(scene, camera);
};
render();
