// aa remake
// (with djmaster72)

var circleRadius = 9, webRadius = 34, lineWidth = 1;
var failColor = "radial-gradient(#ff5, #f00)", successColor = "radial-gradient(#aaf, #afa)";

//

var mc, ctx;
var timer = 0;
var camera = { x:0, y:0, scale:1 };

var web, circles = [];
var moving = [];

var restRadius, totalWebRadius;

var defaultBackground = "white";

var clevel = -1;

var LEVELS = [], EFFECTS = {}, buffered = [];
var internalUpdate;

var cypos, wypos;

var tfailure = false;

var W = 360, H = 480, dpr = 1;      // Logical canvas size; the backing store is scaled by devicePixelRatio for crisp lines
var ripples = [];                   // Rings that spread out from a circle the moment it lands
var selecting = false, selected = 0;    // Level select screen
var progress = { current:0, best:0 };   // Saved in localStorage when it is available

// Progress
function loadProgress()
{
    try
    {
        var p = JSON.parse(localStorage.getItem("aa.progress"));
        if (p && typeof p.current == "number" && typeof p.best == "number")
            progress = p;
    }
    catch (e) {}
    return progress;
}
function saveProgress()
{
    try
    {
        localStorage.setItem("aa.progress", JSON.stringify(progress));
    }
    catch (e) {}
}

// For debugging or level testing
function loadLevel(n)
{
    clevel = n - 1;
    buffered = [];
    camera.x = camera.y = 0;
    camera.scale = 1;
    tfailure = false;
    mc.style.background = defaultBackground;
    advanceLevel();
}

// Input
var keydowns = [], lastkeys = [];
window.onkeydown = function(e)
{
    if (keydowns.indexOf(e.keyCode) == -1)
        keydowns.push(e.keyCode);
}
window.onkeyup = function(e)
{
    if (keydowns.indexOf(e.keyCode) != -1)
        keydowns.splice(keydowns.indexOf(e.keyCode), 1);
}
function iskeydown(kc)
{
    return keydowns.indexOf(kc) != -1;
}
function getkeydown(kc)
{
    return keydowns.indexOf(kc) != -1 && lastkeys.indexOf(kc) == -1;
}
function getkeyup(kc)
{
    return keydowns.indexOf(kc) == -1 && lastkeys.indexOf(kc) != -1;
}

var running = [];
var ismobile = false;

// Pointer input (touch and mouse), in canvas coordinates
function canvasPoint(cx, cy)
{
    var r = mc.getBoundingClientRect();
    return { x:(cx - r.left) * W / r.width, y:(cy - r.top) * H / r.height };
}
function pointerAt(p)
{
    if (selecting)
    {
        var n = selectCellAt(p.x, p.y);
        if (n != -1 && n <= progress.best)
        {
            selected = n;
            selecting = false;
            loadLevel(n);
        }
        return;
    }
    // The 'levels' word in the bottom right corner opens the level select
    if (p.x > W - 60 && p.y > H - 30 && (circles.length || web.attached.length))
    {
        selecting = true;
        selected = clevel;
        return;
    }
    if (keydowns.indexOf(32) == -1)
        keydowns.push(32);
}

window.onload = function()
{
    mc = document.createElement("canvas");
    ctx = mc.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    
    mc.style.position = "fixed";
    dpr = window.devicePixelRatio || 1;
    mc.width = W * dpr;
    mc.height = H * dpr;
    mc.style.background = defaultBackground;
    mc.style.touchAction = "none";
    document.body.style.background = "black";
    document.body.style.margin = "0";
    document.body.style.overflow = "hidden";
    
    ismobile = !!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    totalWebRadius = (W - 170) / 2;
    restRadius = totalWebRadius;
    
    window.ontouchstart = function(e)
    {
        e.preventDefault();
        var t = e.touches[0] || e.changedTouches[0];
        pointerAt(canvasPoint(t.clientX, t.clientY));
    }
    window.ontouchend = function(e)
    {
        if (keydowns.indexOf(32) != -1)
            keydowns.splice(keydowns.indexOf(32), 1);
    }
    mc.onmousedown = function(e)
    {
        e.preventDefault();
        pointerAt(canvasPoint(e.clientX, e.clientY));
    }
    window.onmouseup = function(e)
    {
        if (keydowns.indexOf(32) != -1)
            keydowns.splice(keydowns.indexOf(32), 1);
    }
    
    
    var w = 0, h = 0;
    function resized()
    {
        var ar = mc.width / mc.height;
        if (window.innerWidth > window.innerHeight)
        {
            h = window.innerHeight;
            w = h * ar;
        }
        else
        {
            w = window.innerWidth;
            h = w / ar;
        }
        mc.style.width = w + "px";
        mc.style.height = h + "px";
        
        mc.style.left = (window.innerWidth - w) / 2 + "px";
        mc.style.top = (window.innerHeight - h) / 2 + "px";
    }
    window.onresize = resized;
    window.onorientationchange = function(){ setTimeout(resized, 100); };
    resized();
    
    if (ismobile)
        setTimeout(resized, 10);
    document.body.appendChild(mc);
    
    // Pick up where the player left off, unless a startLevel was set for testing
    loadProgress();
    if (startLevel == 0 && progress.current > 0)
        clevel = Math.min(progress.current, LEVELS.length - 1) - 1;
    advanceLevel();
    
    _loop();
}

function advanceLevel(f)
{
    clevel++;
    totalWebRadius = restRadius;
    circles = [];
    moving = [];
    ripples = [];
    internalUpdate = function(){};
    
    web = new Web({ radius:webRadius || 7 });
    cypos = (web.radius + totalWebRadius) * 2;
    wypos = web.radius + totalWebRadius;
    
    if (clevel >= LEVELS.length)
        return;
    LEVELS[clevel](f);
}

function _loop()
{
    requestAnimationFrame(_loop);
    mc.width = mc.width;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    
    if (selecting)
        selectScreen();
    else if (running.indexOf(false) == -1 && buffered.length == 0)
    {
        internalUpdate();
        update();
    }
    else
    {
        render();
        for (var i = 0; i < buffered.length; i++)
        {
            if (typeof buffered[i] == "function")
            {
                buffered[i] = {
                    effect:buffered[i],
                    op:{}
                }
            }
            
            var b = buffered[i];
            var f = b.effect || b.f;
            var ops = b.op || b.ops || {};
            var r = f(ops);
            if (typeof r == "undefined" || typeof r == "boolean" && r)
            {
                buffered.splice(i, 1);
                i--;
            }
            else
                break;
        }
    }
    
    lastkeys = keydowns.slice(0);
    if (ismobile)
        keydowns = [];
}

function render()
{
    update(true);
}

function update(ov)
{
    if (getkeydown(76) && !ov)     // L: level select
    {
        keydowns = [];
        selecting = true;
        selected = clevel;
        return;
    }
    if (getkeydown(82) && !ov)      // R: restart this level
    {
        keydowns = [];
        restartLevel();
        return;
    }
    var num = circles.length;
    if (num == 0 && web.attached.length == 0)
        return;
    
    if (!ov)        
        timer++;
    var crad = 2 * Math.PI / num;
    
    var apad = 30 + circleRadius * 2 + 50;
    var cfs = 9;
    
    // Update Web
    web.x = W / 2;
    web.y = wypos;
    
    if (!ov)
    {
        if (web.reversed)
            web.rotation -= web.rspeed;
        else
            web.rotation += web.rspeed;
    }
    
    var wnum = 2 * Math.PI / web.numBlanks;
    
    ctx.strokeStyle = "black";
    ctx.lineWidth = lineWidth;
    var nweb = transform(web);
    
    for (var i = 0; i < web.numBlanks; i++)
    {
        var deg = wnum * i / Math.PI * 180;
        var pos = rotate(0, -totalWebRadius, web.rotation + deg);
        pos.x += web.x;
        pos.y += web.y;
        pos = transform(pos);
        
        var spos = rotate(0, -totalWebRadius + circleRadius, web.rotation + deg);
        spos.x += web.x;
        spos.y += web.y;
        spos = transform(spos);
        
        ctx.moveTo(nweb.x, nweb.y);
        ctx.lineTo(spos.x, spos.y);
        ctx.stroke();
        ctx.beginPath();
        
        ctx.arc(pos.x, pos.y, circleRadius * camera.scale, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.beginPath();
        
    }
    
    ctx.fillStyle = "black";
    for (var i = 0; i < web.attached.length; i++)
    {
        var c = web.attached[i];
        c.x -= web.x;
        c.y -= web.y;
        
        var pos = !ov ? rotate(c.x, c.y, web.reversed ? -web.rspeed : web.rspeed) : { x:c.x, y:c.y };
        c.x = pos.x + web.x;
        c.y = pos.y + web.y;
        
        var npos = transform(c);
        ctx.moveTo(nweb.x, nweb.y);
        ctx.lineTo(npos.x, npos.y);
        ctx.stroke();
        ctx.beginPath();
        
        ctx.fillStyle = c.color;
        ctx.strokeStyle = "black";
        var nc = transform(c);
        
        // A circle that just landed pops a little larger, then settles (drawing only; the collision radius is unchanged)
        if (!ov && c.hit > 0)
            c.hit--;
        ctx.arc(nc.x, nc.y, c.radius * camera.scale * (1 + .4 * c.hit / 10), 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        
        if (!web.hideCount)
        {
            ctx.fillStyle = "white";
            var fs = cfs;
            ctx.font = fs + "px Arial";
            ctx.fillText(c.number, npos.x - ctx.measureText(c.number).width / 2, npos.y + fs / 2);
        }
    }
    
    // Rings that spread out from each circle as it lands
    ctx.lineWidth = lineWidth;
    for (var i = 0; i < ripples.length; i++)
    {
        var rp = ripples[i];
        var rpos = transform(rp.c);
        ctx.strokeStyle = "rgba(0, 0, 0, " + (1 - rp.t / 16) + ")";
        ctx.arc(rpos.x, rpos.y, (rp.c.radius + rp.t * 1.6) * camera.scale, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.beginPath();
        if (!ov && ++rp.t >= 16)
        {
            ripples.splice(i, 1);
            i--;
        }
    }
    ctx.strokeStyle = "black";
    
    ctx.fillStyle = "black";
    
    // The hub pulses when a circle lands
    if (!ov && web.pulse > 0)
        web.pulse--;
    ctx.arc(nweb.x, nweb.y, web.radius * camera.scale * (1 + .2 * web.pulse / 8), 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    
    var fs = camera.scale * 22;
    ctx.fillStyle = "white";
    ctx.font = fs + "px Arial";
    ctx.fillText(clevel, nweb.x - ctx.measureText(clevel).width / 2, nweb.y + fs / 2);
    
    // Update circles
    var foundNotMoving = false;
    ctx.fillStyle = (circles[0] || { color:"black" }).color;
    
    for (var i = 0; i < circles.length; i++)
    {
        var c = circles[i];
        if (!foundNotMoving && moving.indexOf(c) == -1 && getkeydown(32) && !ov)
        {
            moving.push(c);
            foundNotMoving = true;
        }
        else if (!foundNotMoving && moving.indexOf(c) == -1)
            foundNotMoving = true;
        
        c.x = (W - c.radius * 2) / 2;
        c.y = cypos + i * (c.radius + 2) * 2 + circleRadius * 2 - c.ady + 10;
        
        var npos = transform(c);
        
        if (npos.y - c.radius * camera.scale > H)
            break;
        ctx.strokeStyle = "black";
        ctx.arc(npos.x, npos.y, c.radius * camera.scale, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        
        if (!web.hideCount)
        {
            ctx.fillStyle = "white";
            var fs = cfs;
            ctx.font = fs + "px Arial";
            ctx.fillText(c.number, npos.x - ctx.measureText(c.number).width / 2, npos.y + fs / 2 - 1);
        }
    }
    
    // Moving
    for (var i = 0; i < moving.length; i++)
    {
        var c = moving[i];
        
        if (!ov)
            c.ady += 10;
        if (c.y <= web.y + totalWebRadius)
        {
            c.y = web.y + totalWebRadius;
            web.attached.push(c);
            moving.splice(i, 1);
            circles.splice(i, 1);
            c.hit = 10;
            web.pulse = 8;
            ripples.push({ c:c, t:0 });
            checkAttached(c);
            i--;
        }
        else
            checkAttached(c, true);
    }
    
    if (web.failTimer > 0)
    {
        if (!ov)
            web.failTimer--;
        if (web.failTimer <= 0)
        {
            web.failTimer = 0;
            failure(true);
        }
        else
        {
            ctx.fillStyle = "black";
            var fs = 17;
            ctx.font = fs + "px Arial";
            var acc = 10e3;
            ctx.fillText("Time: " + Math.ceil(web.failTimer / 60) + "s", 2, 2 + fs);
        }
    }
    
    // Corner word: tap or click it (or press L) to open the level select
    ctx.fillStyle = "#aaa";
    ctx.font = "11px Arial";
    ctx.fillText("levels", W - 8 - ctx.measureText("levels").width, H - 8);
}

// Level select
var selectCols = 6, selectCell = 50, selectTop = 90;
function selectCellAt(x, y)
{
    var left = (W - selectCols * selectCell) / 2;
    var col = Math.floor((x - left) / selectCell), row = Math.floor((y - selectTop) / selectCell);
    if (col < 0 || col >= selectCols || row < 0)
        return -1;
    var n = row * selectCols + col;
    return n < LEVELS.length ? n : -1;
}
function selectScreen()
{
    var n = LEVELS.length;
    var left = (W - selectCols * selectCell) / 2;
    
    if (getkeydown(37))
        selected--;
    if (getkeydown(39))
        selected++;
    if (getkeydown(38))
        selected -= selectCols;
    if (getkeydown(40))
        selected += selectCols;
    selected = Math.max(0, Math.min(n - 1, selected));
    
    if ((getkeydown(27) || getkeydown(76)) && (circles.length || web.attached.length))    // Esc / L: back to the level in play
    {
        keydowns = [];
        selecting = false;
        return;
    }
    if (getkeydown(13) && selected <= progress.best)      // Enter: load the selected level
    {
        keydowns = [];
        selecting = false;
        loadLevel(selected);
        return;
    }
    
    ctx.fillStyle = "black";
    var fs = 22;
    ctx.font = fs + "px Arial";
    ctx.fillText("levels", W / 2 - ctx.measureText("levels").width / 2, 40);
    ctx.fillStyle = "#aaa";
    ctx.font = "11px Arial";
    var hint = "best " + progress.best + " of " + (n - 1) + "  ·  arrows + enter, or tap";
    ctx.fillText(hint, W / 2 - ctx.measureText(hint).width / 2, 60);
    
    ctx.lineWidth = lineWidth;
    for (var i = 0; i < n; i++)
    {
        var cx = left + (i % selectCols) * selectCell + selectCell / 2;
        var cy = selectTop + Math.floor(i / selectCols) * selectCell + selectCell / 2;
        var unlocked = i <= progress.best;
        
        ctx.arc(cx, cy, 18, 0, 2 * Math.PI);
        if (i == selected)
        {
            ctx.fillStyle = unlocked ? "black" : "#ccc";
            ctx.fill();
            ctx.fillStyle = "white";
        }
        else
        {
            ctx.strokeStyle = unlocked ? "black" : "#ccc";
            ctx.stroke();
            ctx.fillStyle = unlocked ? "black" : "#ccc";
        }
        ctx.beginPath();
        
        ctx.font = "13px Arial";
        ctx.fillText(i, cx - ctx.measureText(i).width / 2, cy + 5);
    }
}

function toggle(n, a, b)
{
    if (n != a && n != b)
        n = a;
    else if (n == a)
        n = b;
    else if (n == b)
        n = a;
    return n;
}

function checkCollision(a, b)
{
    return Math.sqrt( Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) ) <= a.radius + b.radius;
}

function rotate(a, b, d)
{
    if (typeof d == "undefined")
    {
        d = b;
        b = a.y;
        a = a.x;
    }
    var r = d * Math.PI / 180;
    var sin = Math.sin(r);
    var cos = Math.cos(r);
    return {
        x:cos * a - sin * b,
        y:sin * a + cos * b
    };
}

function checkAttached(c, ov)
{
    var wnum = 2 * Math.PI / web.numBlanks;
    
    for (var i = 0; i < web.numBlanks; i++)
    {
        var deg = wnum * i / Math.PI * 180;
        var pos = rotate(0, -totalWebRadius, web.rotation + deg);
        pos.x += web.x;
        pos.y += web.y;
        pos.radius = circleRadius;
        
        if (checkCollision(c, pos))
        {
            failure();
            return;
        }
    }
    for (var i = 0; i < web.attached.length; i++)
    {
        if (c != web.attached[i] && checkCollision(c, web.attached[i]))
        {
            failure();
            return;
        }
    }
    
    if (circles.length == 0 && moving.length == 0 && !ov)
        success();
}

function addCircles(n)
{
    circles = [];
    for (var i = 1; i <= n; i++)
        circles.push(new Sprite({ x:0, y:0, number:n - i + 1, color:"lightblue" }));
}

function restartLevel(av)
{
    buffered.push(EFFECTS.fadeOut);
    buffered.push(function(){
        if (!av)
            clevel--;
        mc.style.background = defaultBackground;
        tfailure = false;
        advanceLevel(true && !av);
    });
    buffered.push({
        effect:EFFECTS.timeout,
        op:{ length:10 }
    });
    buffered.push(EFFECTS.fadeIn);
}

function success()
{
    mc.style.background = successColor;
    progress.current = Math.min(clevel + 1, LEVELS.length - 1);
    progress.best = Math.max(progress.best, progress.current);
    saveProgress();
    buffered.push({
        effect:EFFECTS.timeout,
        op: { length:20 }
    });
    if (clevel == LEVELS.length - 1)
    {
        buffered.push(EFFECTS.fadeOut);
        buffered.push(function()
        {
            ctx.fillStyle = "black";
            ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = "white";
            ctx.font = "22px Arial";
            ctx.fillText("aa", W / 2 - ctx.measureText("aa").width / 2, H / 2 - 10);
            ctx.font = "11px Arial";
            var line = "all " + LEVELS.length + " levels clear  ·  L or tap for levels";
            ctx.fillText(line, W / 2 - ctx.measureText(line).width / 2, H / 2 + 14);
            
            if (getkeydown(76) || keydowns.indexOf(32) != -1)
            {
                keydowns = [];
                selecting = true;
                selected = clevel;
                return true;
            }
            return false;
        });
    }
    else
        restartLevel(true);
}

function failure(ov)
{
    if (tfailure)
        return;
    
    tfailure = true;
    mc.style.background = failColor;
    
    if (ov)
    {
        buffered.push(EFFECTS.shake);
    }
    else
    {
        buffered.push(EFFECTS.shake, EFFECTS.zoomIn, {
            effect:EFFECTS.timeout,
            op: { length:20 }
        }, EFFECTS.zoomOut, {
            effect:EFFECTS.timeout,
            op: { length:10 }
        });
    }
    restartLevel();
}

function Web(op)
{
    op = op || {};
    this.x = 0;
    this.y = 0;
    this.reversed = false;
    this.rotation = 0;
    this.radius = op.radius || 1;
    this.numBlanks = op.numBlanks || webRadius || 0;
    this.circles = [];
    this.attached = [];
    this.rspeed = op.rspeed || 1;
    this.failTimer = 0;
    this.hideCount = true;
    this.pulse = 0;
}

function Sprite(op)
{
    op = op || {};
    this.x = op.x || 0;
    this.y = op.y || 0;
    this.radius = op.radius || op.r || circleRadius || 1;
    this.color = op.color || "black";
    this.number = op.number || 1;
    this.ady = op.ady || 0;
    this.hit = 0;
}

// Transform with camera
function transform(a, b)
{
    if (typeof b == "undefined")
    {
        b = a.y;
        a = a.x;
    }
    
    return {
        x:(a - camera.x - W / 2) * camera.scale + W / 2,
        y:(b - camera.y - H / 2) * camera.scale + H / 2
    };
}
function untransform(a, b)
{
    if (typeof b == "undefined")
    {
        b = a.y;
        a = a.x;
    }
    
    return {
        x:(a - W / 2) / camera.scale + W / 2 + camera.x,
        y:(b - H / 2) / camera.scale + H / 2 + camera.y
    };
}

// Effects
var galpha = 0;
EFFECTS.fadeOut = function(op)
{
    if (typeof op.first == "undefined")
    {
        galpha = 0;
        op.first = false;
    }
    galpha = Math.min(galpha + (op.inc || .04), 1);
    ctx.fillStyle = "rgba(0, 0, 0, " + galpha + ")";
    ctx.fillRect(0, 0, W, H);
    
    if (galpha >= 1)
        return true;
    return false;
}
EFFECTS.fadeIn = function(op)
{
    if (typeof op.first == "undefined")
    {
        galpha = 1;
        op.first = false;
    }
    
    galpha = Math.max(galpha - (op.dec || .04), 0);
    ctx.fillStyle = "rgba(0, 0, 0, " + galpha + ")";
    ctx.fillRect(0, 0, W, H);
    
    if (galpha <= 0)
        return true;
    return false;
}
EFFECTS.timeout = function(op)
{
    if (typeof op.first == "undefined")
    {
        op.length = op.length || 50;
        op.current = 0;
        op.first = false;
    }
    
    ctx.fillStyle = "rgba(0, 0, 0, " + galpha + ")";
    ctx.fillRect(0, 0, W, H);
    
    op.current++;
    if (op.current >= op.length)
        return true;
    return false;
}

var maxRadius = 100;
EFFECTS.circlesOut = function(op)
{
    if (typeof op.circles == "undefined")
    {
        op.circles = [];
        for (var x = 0; x < W + maxRadius / 2; x += maxRadius)
            for (var y = 0; y < H + maxRadius / 2; y += maxRadius)
                op.circles.push({ x:x, y:y });
        op.cradius = 0;
    }
    op.cradius += 3;
    
    for (var i in op.circles)
    {
        var c = op.circles[i];
        ctx.fillStyle = "black";
        ctx.arc(c.x, c.y, op.cradius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
    }
    if (op.cradius >= maxRadius)
    {
        galpha = 1;
        return true;
    }
    
    return false;
}
EFFECTS.shake = function(op)
{
    if (typeof op.first == "undefined")
    {
        op.length = op.length || 14;
        op.amp = op.amp || 6;
        op.current = 0;
        op.first = false;
    }
    var left = 1 - op.current / op.length;
    camera.x = (Math.random() - .5) * 2 * op.amp * left;
    camera.y = (Math.random() - .5) * 2 * op.amp * left;
    mc.width = mc.width;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    render();
    
    // A flash that fades with the shake
    ctx.fillStyle = "rgba(255, 80, 80, " + (.5 * left) + ")";
    ctx.fillRect(0, 0, W, H);
    
    op.current++;
    if (op.current >= op.length)
    {
        camera.x = camera.y = 0;
        return true;
    }
    return false;
}
EFFECTS.zoomIn = function(op)
{
    if (typeof op.mz == "undefined")
        op.mz = 2;
    camera.scale += .15;
    render();
    
    if (camera.scale >= op.mz)
    {
        camera.scale = op.mz;
        return true;
    }
    return false;
}
EFFECTS.zoomOut = function(op)
{
    camera.scale -= .15;
    render();
    
    if (camera.scale <= 1)
    {
        camera.scale = 1;
        return true;
    }
    return false;
}
