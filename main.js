// aa remake
// By Steven Geeky (And djmaster72)

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

// For debugging or level testing
function loadLevel(n)
{
    clevel = n - 1;
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

window.onload = function()
{
    mc = document.createElement("canvas");
    ctx = mc.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    
    mc.style.position = "fixed";
    mc.width = 360;
    mc.height = 480;
    mc.style.background = defaultBackground;
    document.body.style.background = "black";
    
    ismobile = !!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    totalWebRadius = (mc.width - 170) / 2;
    restRadius = totalWebRadius;
    
    window.ontouchstart = function(e)
    {
        e.preventDefault();
        if (keydowns.indexOf(32) == -1)
            keydowns.push(32);
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
    resized();
    
    if (ismobile)
        setTimeout(resized, 10);
    document.body.appendChild(mc);
    advanceLevel();
    
    _loop();
}

function advanceLevel(f)
{
    clevel++;
    totalWebRadius = restRadius;
    circles = [];
    moving = [];
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
    
    if (running.indexOf(false) == -1 && buffered.length == 0)
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
    if (getkeydown(76))
    {
        keydowns = [];
        loadLevel(+prompt("What level would you like to load?"));
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
    web.x = mc.width / 2;
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
        
        ctx.arc(nc.x, nc.y, c.radius * camera.scale, 0, 2 * Math.PI);
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
    
    ctx.fillStyle = "black";
    
    ctx.arc(nweb.x, nweb.y, web.radius * camera.scale, 0, 2 * Math.PI);
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
        
        c.x = (mc.width - c.radius * 2) / 2;
        c.y = cypos + i * (c.radius + 2) * 2 + circleRadius * 2 - c.ady + 10;
        
        var npos = transform(c);
        
        if (npos.y - c.radius * camera.scale > mc.height)
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
            ctx.fillRect(0, 0, mc.width, mc.height);
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
        buffered.push({
            effect:EFFECTS.timeout,
            op: { length:10 }
        });
    }
    else
    {
        buffered.push({
            effect:EFFECTS.timeout,
            op: { length:10 }
        }, EFFECTS.zoomIn, {
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
        x:(a - camera.x - mc.width / 2) * camera.scale + mc.width / 2,
        y:(b - camera.y - mc.height / 2) * camera.scale + mc.height / 2
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
        x:(a - mc.width / 2) / camera.scale + mc.width / 2 + camera.x,
        y:(b - mc.height / 2) / camera.scale + mc.height / 2 + camera.y
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
    ctx.fillRect(0, 0, mc.width, mc.height);
    
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
    ctx.fillRect(0, 0, mc.width, mc.height);
    
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
    ctx.fillRect(0, 0, mc.width, mc.height);
    
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
        for (var x = 0; x < mc.width + maxRadius / 2; x += maxRadius)
            for (var y = 0; y < mc.height + maxRadius / 2; y += maxRadius)
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