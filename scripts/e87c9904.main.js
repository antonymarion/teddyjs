var Teddy=Teddy||{};Teddy.DIST_THRESHOLD=.001,Teddy.Body=function(a){this.points=a||[],this.outlineSize=this.points.length,this.joints=[],this.triangles=[],this.spines=[],this.mesh=void 0},Teddy.Body.prototype.onOutline=function(a){return a<this.outlineSize},Teddy.Body.prototype.isOutline=function(a,b){return this.onOutline(a)&&this.onOutline(b)&&(1===Math.abs(a-b)||Math.abs(a-b)===this.outlineSize-1)},Teddy.Body.prototype.getPointIndex=function(a,b,c){for(var d="undefined"==typeof b?a:new THREE.Vector3(a,b,c),e=0;e<this.points.length;e++)if(this.points[e].distanceTo(d)<Teddy.DIST_THRESHOLD)return e;return this.points.push(d),this.points.length-1},Teddy.Body.prototype.makeCCW=function(a,b){var c=this.points[a[0]],d=this.points[a[1]],e=this.points[a[2]],f=d.clone().sub(c),g=e.clone().sub(c);return b&&f.cross(g).z<0||!b&&f.cross(g).z>0?[a[0],a[2],a[1]]:a},Teddy.Body.prototype.getJoint=function(a){for(var b=0;b<this.joints.length;b++){var c=this.joints[b];if(c.pointIndex===a)return c}var d=new Teddy.Joint(this,a);return this.joints.push(d),d},Teddy.Body.prototype.triangulate=function(){var a=[],b={};this.points.forEach(function(c,d){b[c.x]||(b[c.x]={}),b[c.x][c.y]=d,a.push(new poly2tri.Point(c.x,c.y))});var c=new poly2tri.SweepContext(a);c.triangulate();var d=c.getTriangles();d.forEach(function(a){var c=a.points_;this.triangles.push([b[c[0].x][c[0].y],b[c[1].x][c[1].y],b[c[2].x][c[2].y]])},this)},Teddy.Body.prototype.retrieveSpines=function(){this.triangles.forEach(function(a){var b=a[0],c=a[1],d=a[2],e=this.points[b],f=this.points[c],g=this.points[d],h=new THREE.Vector3((e.x+f.x)/2,(e.y+f.y)/2,0),i=new THREE.Vector3((f.x+g.x)/2,(f.y+g.y)/2,0),j=new THREE.Vector3((g.x+e.x)/2,(g.y+e.y)/2,0),k=new THREE.Vector3((e.x+f.x+g.x)/3,(e.y+f.y+g.y)/3,0),l=function(a,b,c){var d=[];switch(this.isOutline(a,b)&&d.push([0,1]),this.isOutline(b,c)&&d.push([1,2]),this.isOutline(c,a)&&d.push([2,0]),d.length){case 0:return{type:"j",edges:d};case 1:return{type:"s",edges:d};case 2:return{type:"t",edges:d};default:throw"error"}}.bind(this)(b,c,d);switch(l.type){case"t":if("0,1,1,2"===l.edges.toString()){var m=new Teddy.Spine(this,f,j);m.addTriangle({triangle:a,edges:l.edges,links:[[2,0]]}),this.addSpine(m)}else if("1,2,2,0"===l.edges.toString()){var m=new Teddy.Spine(this,g,h);m.addTriangle({triangle:a,edges:l.edges,links:[[0,1]]}),this.addSpine(m)}else if("0,1,2,0"===l.edges.toString()){var m=new Teddy.Spine(this,e,i);m.addTriangle({triangle:a,edges:l.edges,links:[[1,2]]}),this.addSpine(m)}break;case"s":if("0,1"===l.edges.toString()){var m=new Teddy.Spine(this,i,j);m.addTriangle({triangle:a,edges:l.edges,links:[[1,2],[2,0]]}),this.addSpine(m)}else if("1,2"===l.edges.toString()){var m=new Teddy.Spine(this,j,h);m.addTriangle({triangle:a,edges:l.edges,links:[[2,0],[0,1]]}),this.addSpine(m)}else if("2,0"===l.edges.toString()){var m=new Teddy.Spine(this,h,i);m.addTriangle({triangle:a,edges:l.edges,links:[[0,1],[1,2]]}),this.addSpine(m)}break;case"j":var n=new Teddy.Spine(this,h,k);n.addTriangle({triangle:a,edges:l.edges,links:[[0,1],[1,2],[2,0]]}),this.addSpine(n);var o=new Teddy.Spine(this,i,k);o.addTriangle({triangle:a,edges:l.edges,links:[[0,1],[1,2],[2,0]]}),this.addSpine(o);var p=new Teddy.Spine(this,j,k);p.addTriangle({triangle:a,edges:l.edges,links:[[0,1],[1,2],[2,0]]}),this.addSpine(p)}},this)},Teddy.Body.prototype.addSpine=function(a){this.spines.push(a)},Teddy.Body.prototype.prunSpines=function(){var a=[];this.spines.forEach(function(b){if(b.isTerminal()){var c=b,d=c.joint1.isTerminal()?c.joint1:c.joint2,e=[];do{a.push(c),d=c.getNextJoint(d);var f=c.getEdgeIdsIncluding(d.getPoint()),g=f.map(function(a){return this.points[a]}.bind(this)),h=d.getPoint(),i=h.distanceTo(g[0]);c.getAllPointIdsWithoutIds(f).forEach(function(a){e.push(a)});for(var j=0;j<e.length;j++){var k=this.points[e[j]];if(i<h.distanceTo(k)){e.push(f[0]),e.push(f[1]),e=e.sort(function(a,b){return a===b?0:b>a?-1:1});for(var l=e.shift(),j=0;j<e.length+1&&(e.push(l),e[0]===l+1);j++)l=e.shift();for(var j=1;j<e.length;j++)d.addTriangle(e[j-1],e[j],this.getPointIndex(h));return}}if(c=d.getSpinesExcept(c)[0],c.isJunction()){a.push(c),f.forEach(function(a){e.push(a)}),d=c.getNextJoint(d);var h=d.getPoint();e=e.sort(function(a,b){return a===b?0:b>a?-1:1});for(var l=e.shift(),j=0;j<e.length+1&&(e.push(l),e[0]===l+1);j++)l=e.shift();for(var j=1;j<e.length;j++)d.addTriangle(e[j-1],e[j],this.getPointIndex(h));return}if(c.isSleeve());else if(c.isTerminal())throw"ERROR: cannot handle this geometry"}while("undefined"!=typeof c)}},this),a.map(function(a){return this.spines.indexOf(a)},this).sort(function(a,b){return a===b?0:b>a?1:-1}).forEach(function(a){this.spines.splice(a,1)},this),this.spines.forEach(function(a){var b=a.triangles[0].triangle;a.triangles=[];var c=!0;if([[0,1,2],[1,2,0],[2,0,1]].forEach(function(d){var e=d[0],f=d[1],g=d[2];return this.isOutline(b[e],b[f])?(c=!1,a.joint1.addTriangle(b[e],b[f],a.joint1.pointIndex),a.triangles.push({triangle:[b[e],a.joint1.pointIndex,a.joint2.pointIndex]}),void a.triangles.push({triangle:[b[g],a.joint1.pointIndex,a.joint2.pointIndex]})):void 0},this),c){var d=this.points[b[0]],e=this.points[b[1]],f=this.points[b[2]],g=new THREE.Vector3((d.x+e.x+f.x)/3,(d.y+e.y+f.y)/3,(d.z+e.z+f.z)/3),h=a.joint1.getPoint(),i=a.joint2.getPoint(),j=h.distanceTo(g)<i.distanceTo(g)?[a.joint2,a.joint1]:[a.joint1,a.joint2],k=j[0],l=j[1],m=d.clone().add(e).multiplyScalar(.5).distanceTo(k.getPoint()),n=e.clone().add(f).multiplyScalar(.5).distanceTo(k.getPoint()),o=f.clone().add(d).multiplyScalar(.5).distanceTo(k.getPoint());if(n>=m&&o>=m)a.triangles.push({triangle:[b[0],k.pointIndex,l.pointIndex]}),a.triangles.push({triangle:[b[1],k.pointIndex,l.pointIndex]});else if(m>=n&&o>=n)a.triangles.push({triangle:[b[1],k.pointIndex,l.pointIndex]}),a.triangles.push({triangle:[b[2],k.pointIndex,l.pointIndex]});else{if(!(m>=o&&n>=o))throw"never reach";a.triangles.push({triangle:[b[2],k.pointIndex,l.pointIndex]}),a.triangles.push({triangle:[b[0],k.pointIndex,l.pointIndex]})}}},this)},Teddy.Body.prototype.elevateSpines=function(){this.spines.forEach(function(a){a.elevate()},this)},Teddy.Body.prototype.sewSkins=function(){this.spines.forEach(function(a){var b=[];if(a.elevatedTriangles.forEach(function(a){this.sewTriangle(a,b,!0)},this),a.droppedTriangles.forEach(function(a){this.sewTriangle(a,b,!1)},this),a.triangles=b,!a.joint1.triangulated){var c=[];a.joint1.elevatedTriangles.forEach(function(a){this.sewTriangle(a,c,!0)},this),a.joint1.droppedTriangles.forEach(function(a){this.sewTriangle(a,c,!1)},this),a.joint1.triangles=c,a.joint1.triangulated=!0}if(!a.joint2.triangulated){var d=[];a.joint2.elevatedTriangles.forEach(function(a){this.sewTriangle(a,d,!0)},this),a.joint2.droppedTriangles.forEach(function(a){this.sewTriangle(a,d,!1)},this),a.joint2.triangles=d,a.joint2.triangulated=!0}},this)},Teddy.Body.prototype.sewTriangle=function(a,b,c){var d=this.points[a[0]],e=this.points[a[1]],f=this.points[a[2]],g=[],h=[];Math.abs(d.z)<1e-4?h.push(d):g.push(d),Math.abs(e.z)<1e-4?h.push(e):g.push(e),Math.abs(f.z)<1e-4?h.push(f):g.push(f);for(var i=[],j=g[0],k=h[0],l=j.z,m=k.clone().sub(j.clone().setZ(k.z)),n=m.length(),o=0;90>=o;o+=10){var p=o/180*Math.PI,q=n*Math.cos(p),r=l*Math.sin(p);i.push(new THREE.Vector3(j.x+q/n*m.x,j.y+q/n*m.y,r))}var s=[];for(j=g[g.length-1],k=h[h.length-1],l=j.z,m=k.clone().sub(j.clone().setZ(k.z)),n=m.length(),o=0;90>=o;o+=10)p=o/180*Math.PI,q=n*Math.cos(p),r=l*Math.sin(p),s.push(new THREE.Vector3(j.x+q/n*m.x,j.y+q/n*m.y,r));i[0].distanceTo(s[0])<1e-4&&(i=i.reverse(),s=s.reverse());var t=[];t.push(this.getPointIndex(i.pop())),s.pop(),t.push(this.getPointIndex(i[i.length-1])),t.push(this.getPointIndex(s[s.length-1])),b.push(this.makeCCW(t,c));for(var u=1;u<i.length;u++)b.push(this.makeCCW([this.getPointIndex(i[u-1]),this.getPointIndex(s[u-1]),this.getPointIndex(i[u])],c)),b.push(this.makeCCW([this.getPointIndex(s[u-1]),this.getPointIndex(s[u]),this.getPointIndex(i[u])],c))},Teddy.Body.prototype.buildMesh=function(){var a=new THREE.Geometry;this.points.forEach(function(b){a.vertices.push(b)},this),this.spines.forEach(function(b){b.triangles.forEach(function(b){a.faces.push(new THREE.Face3(b[0],b[1],b[2]))},this),b.joint1.triangles.forEach(function(b){a.faces.push(new THREE.Face3(b[0],b[1],b[2]))},this),b.joint2.triangles.forEach(function(b){a.faces.push(new THREE.Face3(b[0],b[1],b[2]))},this)},this),a.computeFaceNormals(),a.computeVertexNormals(),this.mesh=new THREE.Mesh(a,new THREE.MeshPhongMaterial({color:16777215,wireframe:!1}))},Teddy.Body.prototype.smoothMesh=function(){if("undefined"!=typeof this.mesh){var a={},b=this.mesh.geometry;b.faces.forEach(function(b){"undefined"==typeof a[b.a]&&(a[b.a]=[]),"undefined"==typeof a[b.b]&&(a[b.b]=[]),"undefined"==typeof a[b.c]&&(a[b.c]=[]),a[b.a].push(b.b),a[b.a].push(b.c),a[b.b].push(b.c),a[b.b].push(b.a),a[b.c].push(b.a),a[b.c].push(b.b)},this),Object.keys(a).forEach(function(c){var d=a[c],e=new THREE.Vector3;d.forEach(function(a){e.add(b.vertices[a])},this),e.multiplyScalar(1/d.length),a[c]=e},this),Object.keys(a).forEach(function(c){b.vertices[c].copy(a[c])},this),b.computeFaceNormals(),b.computeVertexNormals()}},Teddy.Body.prototype.debugAddSpineMeshes=function(a){this.spines.forEach(function(b){var c=new THREE.Geometry;c.vertices.push(this.points[b.joint1.elevatedPointIndex]),c.vertices.push(this.points[b.joint2.elevatedPointIndex]);var d=new THREE.Line(c,new THREE.LineBasicMaterial({color:16711680,linewidth:4}));a.add(d)},this)},Teddy.Body.prototype.getMesh=function(){if(!this.mesh){this.triangulate(),this.retrieveSpines(),this.prunSpines(),this.elevateSpines(),this.sewSkins(),this.buildMesh();for(var a=0;5>a;a++)this.smoothMesh()}return this.mesh},Teddy.Spine=function(a,b,c){this.body=a,b instanceof THREE.Vector3&&(b=this.body.getPointIndex(b)),c instanceof THREE.Vector3&&(c=this.body.getPointIndex(c)),"number"==typeof b&&(b=this.body.getJoint(b)),"number"==typeof c&&(c=this.body.getJoint(c)),this.joint1=b,this.joint1.addSpine(this),this.joint2=c,this.joint2.addSpine(this),this.triangles=[],this.elevatedTriangles=[],this.droppedTriangles=[]},Teddy.Spine.prototype.getEdgeIdsIncluding=function(a){var b=[];return this.triangles.forEach(function(c){var d=c.triangle;[[0,1],[1,2],[2,0]].forEach(function(c){var e=d[c[0]],f=d[c[1]],g=this.body.points[e],h=this.body.points[f],i=g.clone().add(h).multiplyScalar(.5);return i.distanceTo(a)<.01?(b.push(e),void b.push(f)):void 0},this)},this),b},Teddy.Spine.prototype.getNextJoint=function(a){return this.joint1===a?this.joint2:this.joint1},Teddy.Spine.prototype.isTerminal=function(){return this.joint1.isTerminal()||this.joint2.isTerminal()},Teddy.Spine.prototype.isSleeve=function(){return this.joint1.isSleeve()||this.joint2.isSleeve()},Teddy.Spine.prototype.isJunction=function(){return this.joint1.isJunction()||this.joint2.isJunction()},Teddy.Spine.prototype.addTriangle=function(a){this.triangles.push(a)},Teddy.Spine.prototype.getAllPointIds=function(){return this.getAllPointIdsWithoutIds([])},Teddy.Spine.prototype.getAllPointIdsWithoutIds=function(a){var b=[];return this.triangles.forEach(function(c){c.triangle.forEach(function(c){b.indexOf(c)<0&&a.indexOf(c)<0&&b.push(c)})}),b},Teddy.Spine.prototype.elevate=function(){"undefined"!=typeof this.joint1&&this.joint1.elevate(),"undefined"!=typeof this.joint1&&this.joint2.elevate(),this.triangles.forEach(function(a){var b=[],c=[];a.triangle.forEach(function(a){a===this.joint1.pointIndex?(b.push(this.joint1.elevatedPointIndex),c.push(this.joint1.droppedPointIndex)):a===this.joint2.pointIndex?(b.push(this.joint2.elevatedPointIndex),c.push(this.joint2.droppedPointIndex)):(b.push(a),c.push(a))},this),this.elevatedTriangles.push(b),this.droppedTriangles.push(c)},this)},Teddy.Spine.prototype.isEqual=function(a){var b="undefined"==typeof this.joint1?-1:this.joint1.pointIndex,c="undefined"==typeof this.joint2?-1:this.joint2.pointIndex,d="undefined"==typeof a.joint1?-1:a.joint1.pointIndex,e="undefined"==typeof a.joint2?-1:a.joint2.pointIndex;return b===d&&c===e||b===e&&c===d},Teddy.Spine.prototype.toString=function(){var a="undefined"==typeof this.joint1?-1:this.joint1.pointIndex,b="undefined"==typeof this.joint2?-1:this.joint2.pointIndex;return""+a+","+b},Teddy.Joint=function(a,b){this.body=a,this.pointIndex=b,this.spines=[],this.triangles=[],this.elevatedPointIndex=void 0,this.droppedPointIndex=void 0,this.elevatedTriangles=[],this.droppedTriangles=[],this.elevated=!1,this.triangulated=!1},Teddy.Joint.prototype.getPoint=function(){return this.body.points[this.pointIndex]},Teddy.Joint.prototype.getElevatedPoint=function(){return this.body.points[this.elevatedPointIndex]},Teddy.Joint.prototype.getDroppedPoint=function(){return this.body.points[this.droppedPointIndex]},Teddy.Joint.prototype.addSpine=function(a){this.spines.indexOf(a)<0&&this.spines.push(a)},Teddy.Joint.prototype.getSpinesExcept=function(a){var b=[];return this.spines.forEach(function(c){c.isEqual(a)||b.push(c)}),b},Teddy.Joint.prototype.isTerminal=function(){return 1===this.spines.length},Teddy.Joint.prototype.isSleeve=function(){return 2===this.spines.length},Teddy.Joint.prototype.isJunction=function(){return 3===this.spines.length},Teddy.Joint.prototype.addTriangle=function(a,b,c){this.triangles.push([a,b,c])},Teddy.Joint.prototype.isNear=function(a){return this.getPoint().distanceTo(a.getPoint())<Teddy.DIST_THRESHOLD},Teddy.Joint.prototype.elevate=function(){if(!this.elevated){this.elevated=!0;var a=[];this.spines.forEach(function(b){b.triangles.forEach(function(b){a.push(b.triangle[0]),a.push(b.triangle[1]),a.push(b.triangle[2])},this)},this),this.triangles.forEach(function(b){a.push(b[0]),a.push(b[1]),a.push(b[2])},this);var b=[];a.forEach(function(a){b.indexOf(a)<0&&this.body.onOutline(a)&&b.push(a)},this);var c=this.getPoint(),d=0;b.forEach(function(a){d+=this.body.points[a].distanceTo(c)},this);var e=d/b.length;this.elevatedPointIndex=this.body.getPointIndex(this.getPoint().clone().setZ(e)),this.droppedPointIndex=this.body.getPointIndex(this.getPoint().clone().setZ(-e)),this.triangles.forEach(function(a){var b=[],c=[];a.forEach(function(a){a===this.pointIndex?(b.push(this.elevatedPointIndex),c.push(this.droppedPointIndex)):(b.push(a),c.push(a))},this),this.elevatedTriangles.push(b),this.droppedTriangles.push(c)},this)}};var Teddy=Teddy||{};Teddy.UI={},Teddy.UI.addTextureCanvas=function(a,b){var c=document.createElement("canvas");c.id="texture",c.style.position="absolute",c.style.top="-"+b+"px",c.style.left=""+a+"px",c.style.backgroundColor="white",c.width=a,c.height=b;var d=c.getContext("2d");return d.fillStyle="rgb(255,255,255)",d.fillRect(0,0,a,b),document.body.appendChild(c),c},Teddy.UI.setup=function(a,b,c,d){function e(a,b){var e=a.target.getBoundingClientRect(),f=a.clientX-e.left,g=a.clientY-e.top;f=f/window.innerWidth*2-1,g=2*-(g/window.innerHeight)+1;var h=new THREE.Vector3(f,g,1);z.unprojectVector(h,c);var i=new THREE.Raycaster(c.position,h.sub(c.position).normalize()),j=i.intersectObjects([d]);1==j.length&&b(j[0])}function f(){u.position.set(-1e3,-1e3,-1e3),u.rotation.x=0,u.rotation.y=0,u.rotation.z=0,v=!1,x.forEach(function(b){a.remove(b)}),x=[];var b=new Teddy.Body(w);try{var c=b.getMesh();y&&a.remove(y),y=c;var e=y.geometry;e.faces.forEach(function(a){var b=e.vertices[a.a],c=e.vertices[a.b],d=e.vertices[a.c];e.faceVertexUvs[0].push([new THREE.Vector2((b.x+4)/8,(b.y+4)/8),new THREE.Vector2((c.x+4)/8,(c.y+4)/8),new THREE.Vector2((d.x+4)/8,(d.y+4)/8)])},this),y.material.map=t}catch(f){return w=[],console.log(f),void alert("Fail to create 3D mesh")}a.add(y),w=[],d.material.opacity=0,n.enabled=!0}function g(a){var b=50,c="rgb(0,0,255)",d=(a.x+4)/8*p,e=q-(a.y+4)/8*q;"undefined"==typeof H?(H={x:d,y:e},s.fillStyle=c,s.beginPath(),s.arc(d,e,b/2,0,2*Math.PI),s.closePath(),s.fill(),t.needsUpdate=!0):(s.strokeStyle=c,s.lineCap="round",s.lineWidth=b,s.beginPath(),s.moveTo(H.x,H.y),s.lineTo(d,e),s.stroke(),H.x=d,H.y=e,t.needsUpdate=!0)}function h(b){if(0==w.length&&u.position.copy(b).setZ(.2),u.rotation.x+=.05,u.rotation.y+=.025,u.rotation.z+=.0125,0==w.length||.1<w[w.length-1].distanceTo(b)){for(;2<=w.length;){var c=b.clone().sub(w[w.length-1]),d=b.clone().sub(w[w.length-2]),e=Math.acos(c.dot(d)/c.length()/d.length())/Math.PI*180;if(!(1>e))break;a.remove(x.pop()),w.pop()}if(i(b,w))return!1;if(w.push(b),2<=w.length){var f=new THREE.Geometry;f.vertices.push(w[w.length-1].clone().setZ(.01)),f.vertices.push(w[w.length-2].clone().setZ(.01));var g=new THREE.Line(f,E);a.add(g),x.push(g)}}return!0}function i(a,b){if(b.length<3)return!1;for(var c=[a,b[b.length-1]],d=1;d<b.length-2;d++)if(j(c,[b[d-1],b[d]]))return!0;return!1}function j(a,b){var c=a[0],d=a[1],e=b[0],f=b[1];if(c.x<e.x&&c.x<f.x&&d.x<e.x&&d.x<f.x)return!1;if(e.x<c.x&&f.x<c.x&&e.x<d.x&&f.x<d.x)return!1;if(c.y<e.y&&c.y<f.y&&d.y<e.y&&d.y<f.y)return!1;if(e.y<c.y&&f.y<c.y&&e.y<d.y&&f.y<d.y)return!1;var g=c.clone().sub(d),h=e.clone().sub(d),i=f.clone().sub(d),j=e.clone().sub(f),k=c.clone().sub(f),l=d.clone().sub(f);return g.cross(h).z*g.cross(i).z<=0&&j.cross(k).z*j.cross(l).z<=0?!0:!1}function k(){G="pen",H=void 0,u.position.set(-1e3,-1e3,-1e3),v=!1,w=[],y&&a.remove(y),y=void 0,x.forEach(function(b){a.remove(b)}),x=[],d.material.opacity=1,s.fillStyle="rgb(255,255,255)",s.fillRect(0,0,p,q),t.needsUpdate=!0,c.position.set(0,0,8),c.lookAt(0,0,0),n.reset(),n.enabled=!1}function l(){"undefined"==typeof F?(F=document.createElement("video"),F.style.position="absolute",F.style.top=-q+"px",F.style.left=0,F.style.display="none",document.body.appendChild(F),navigator.getUserMedia({video:!0},function(a){F.src=window.URL.createObjectURL(a),F.play(),setTimeout(function(){m(F)},3e3)},function(a){console.log(a)})):m(F)}function m(a){var b,c,d,e,f=a.videoWidth,g=a.videoHeight;f>g?(b=(f-g)/2,c=0,d=g,e=g):(b=0,c=(g-f)/2,d=f,e=f),s.drawImage(a,b,c,d,e,0,0,p,q),t.needsUpdate=!0}var n=new THREE.OrbitControls(c);n.enabled=!1;var o=document.createElement("div");o.classList.add("now-making"),o.textContent="Now Building...",o.style.display="none",document.body.appendChild(o);var p=600,q=600,r=Teddy.UI.addTextureCanvas(p,q),s=r.getContext("2d"),t=new THREE.Texture(r);t.needsUpdate=!0,"undefined"==typeof d&&(d=new THREE.Mesh(new THREE.PlaneGeometry(8,8),new THREE.MeshBasicMaterial({color:16777215,transparent:!0,map:t})),a.add(d));var u=new THREE.Mesh(new THREE.BoxGeometry(.2,.2,.2),new THREE.MeshLambertMaterial({color:16711680,transparent:!0,opacity:.5}));u.position.set(-1e3,-1e3,-1e3);var v=!1,w=[],x=[],y=void 0,z=new THREE.Projector,A=0,B=0,C=0,D=new THREE.Color(Math.sin(A/180*Math.PI),Math.sin(B/180*Math.PI),Math.sin(C/180*Math.PI)),E=new THREE.LineBasicMaterial({color:D});!function I(){requestAnimationFrame(I),A+=1,B+=2,C+=3,D.r=Math.sin(A/180*Math.PI),D.g=Math.sin(B/180*Math.PI),D.b=Math.sin(C/180*Math.PI),E.color.copy(D)}(),navigator.getUserMedia=navigator.getUserMedia||navigator.webkitGetUserMedia||navigator.mozGetUserMedia||navigator.msGetUserMedia;var F,G="pen",H=void 0;document.getElementById("pen-button").addEventListener("click",function(){G="pen",v=!1,H=void 0}),document.getElementById("scissors-button").addEventListener("click",function(){G="scissors",v=!1,w=[],x.forEach(function(b){a.remove(b)}),x=[]}),document.getElementById("teddy-button").addEventListener("click",function(){f()}),document.getElementById("clear-button").addEventListener("click",function(){k()}),document.getElementById("camera-button").addEventListener("click",function(){l()}),b.domElement.addEventListener("mouseup",function(){0!==d.material.opacity&&(v=!1,H=void 0)}),b.domElement.addEventListener("mousedown",function(a){0!==d.material.opacity&&e(a,function(a){v=!0,"pen"===G&&g(a.point)})}),b.domElement.addEventListener("mousemove",function(a){0!==d.material.opacity&&v&&e(a,function(a){"pen"===G?g(a.point):"scissors"===G&&(h(a.point)||(v=!1,H=void 0))})}),b.domElement.addEventListener("touchend",function(){0!==d.material.opacity&&(v=!1,H=void 0)}),b.domElement.addEventListener("touchstart",function(a){0!==d.material.opacity&&e(a.touches[0],function(a){v=!0,"pen"===G&&g(a.point)})}),b.domElement.addEventListener("touchmove",function(a){0!==d.material.opacity&&v&&e(a.touches[0],function(a){"pen"===G?g(a.point):"scissors"===G&&(h(a.point)||(v=!1,H=void 0))})})},function(){var a=new THREE.Scene,b=new THREE.PerspectiveCamera(70,window.innerWidth/window.innerHeight,1,1e3);b.position.z=8,a.add(b);var c=new THREE.DirectionalLight(16777215);c.position.set(1,.5,1),a.add(c);var d=new THREE.DirectionalLight(3355494);d.position.set(-1,-.5,-1),a.add(d);var e=new THREE.AmbientLight(3355443);a.add(e);var f=new THREE.WebGLRenderer({antialias:!0});f.setSize(window.innerWidth,window.innerHeight),f.sortObjects=!1,document.body.appendChild(f.domElement),function g(){requestAnimationFrame(g),f.render(a,b)}(),Teddy.UI.setup(a,f,b),window.addEventListener("resize",function(){f.setSize(window.innerWidth,window.innerHeight),b.aspect=window.innerWidth/window.innerHeight,b.updateProjectionMatrix()},!1),document.addEventListener("keyup",function(a){13===a.keyCode&&window.location.reload()})}();