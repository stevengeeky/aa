// Implement Levels Here
/*
    For Level Implementation:
        Add your level run function onto the array LEVELS
        Available object variables for modification:
            web.numBlanks       <-- Number of blank circles automatically generated
            web.rspeed          <-- Rotation speed
            web.reversed        <-- Whether or not the web has a reversed rotation
            web.failTimer       <-- Set this to a non-zero value in order to put in a failure timer.  After this many frames (the timer is displayed in
                                        seconds), you automatically fail
            web.hideCount       <-- Set this to false to include numbers on the user available circles
        To add a number of circles, call the function addCircles(n) where n is the number of circles to add to the user's available count
        
        timer is a global variable representing the frames that have passed since the game has begun
        internalUpdate may be set to a custom function per level to do things depending on the game timer or any other events
        toggle(n, a, b) is a function taking in a number n, a first value a, and a second value b.  If causes n to switch between a and b
        
        Every level run function may be called with a parameter f which is true if the level has been visited before (for first-visit messages)
*/

var startLevel = 0;         // What level to initially load

// -------------------------------------------
clevel = startLevel - 1;     // Start at the level in the array index after this value

// 0
LEVELS.push(function(f){
    web.numBlanks = 4;
    web.rspeed = 2;
    addCircles(5);
    if (!f)
        alert("Welcome to the remake of the game aa!  The goal, if you have not played the original, is to rid yourself of all of your circles, placing them along the radius of a rotating 'web'.  When all of your circles are gone and not touching any other circles within the web, you can advance to the next level!");
});

// 1
LEVELS.push(function(){
    web.numBlanks = 5;
    web.rspeed = 3;
    addCircles(5);
});

// 2
LEVELS.push(function(f){
    web.numBlanks = 4;
    addCircles(6);
    web.rspeed = 3;
    var instantiationTime = timer;
    
    if (!f)  // f represents first-time visiting of this level
        alert("Watch out!  The speed of the web can now change at a given interval.");
    internalUpdate = function(){
        if ((timer - instantiationTime) % 100 == 0)
            web.rspeed = toggle(web.rspeed, 1, 3);
    };
});

// 3
LEVELS.push(function(){
    web.numBlanks = 6;
    addCircles(7);
    
    var maxSpeed = 4, minSpeed = 2;
    
    web.rspeed = maxSpeed;
    var instantiationTime = timer;
    
    internalUpdate = function(){
        if ((timer - instantiationTime) % 100 == 0)
            web.rspeed = toggle(web.rspeed, minSpeed, maxSpeed);
    };
});

// 4
LEVELS.push(function(){
    web.numBlanks = 9;
    addCircles(4);
    
    web.reversed = true;
    web.rspeed = 1.5;
    var instantiationTime = timer;
});

// 5
LEVELS.push(function(){
    web.numBlanks = 5;
    addCircles(11);
    web.rspeed = 1.5;
    var instantiationTime = timer;
});

// 6
LEVELS.push(function(){
    web.numBlanks = 1;
    addCircles(17);
    web.rspeed = 1.5;
    var instantiationTime = timer;
    
});

// 7
LEVELS.push(function(){
    web.numBlanks = 2;
    addCircles(20);
    web.rspeed = 1.5;
    var instantiationTime = timer;
    
});

// 8
LEVELS.push(function(){
    web.numBlanks = 14;
    addCircles(1);
    
    web.rspeed = 1.3;
    var instantiationTime = timer;
});

// 9
LEVELS.push(function(){
    web.numBlanks = 4;
    web.reversed = true;
    
    addCircles(10);
    var instantiationTime = timer;
    
    internalUpdate = function(){
        web.rspeed = Math.sin((timer - instantiationTime) * Math.PI / 180) * 4;
    };
});

// 10
LEVELS.push(function(){
    web.numBlanks = 5;
    addCircles(17);
    //web.rspeed = 1;       // No need to set what is default
});

// 11
LEVELS.push(function(){
    web.numBlanks = 4;
    addCircles(15);
    
    // For fluxuation of speed (or changing of speed from one value to another):
    // We'll make two speeds that our web can have:
    var minSpeed = 1, maxSpeed = 2;
    // You want to start your web rotation speed with the opposite of the toggled speed (because of our timer toggle later on)
    web.rspeed = maxSpeed;      // So minSpeed will be the initial speed
    
    // We need to detect the time at which this level was created
    var instantiationTime = timer;
    // timer is the current game time (in frames, starting from the beginning of the game loop)
    
    internalUpdate = function(){
        // This is called every frame the game runs
        // Check if the new timer is a multiple of the amount of frames required for the speed to change
        if ((timer - instantiationTime) % 40 == 0)      // Every 30 frames...
            web.rspeed = toggle(web.rspeed, minSpeed, maxSpeed);        // Toggle the speed to either the minSpeed or maxSpeed depending on which it already is
    };
});

// 12
LEVELS.push(function(){
    web.numBlanks = 10;
    addCircles(10);
    web.rspeed = 2.2;
    
    web.failTimer = 15 * 60;    // 15 seconds, because there are 60 frames in a second
});

// 13
LEVELS.push(function(f){
    if (!f)
        alert("In this level (and in some to come), 'shooting' one inventory circle automatically does the same for the next up");
    
    web.numBlanks = 5;
    addCircles(20);
    web.rspeed = 1.5;
    
    var spaceTimer = 0, shootInterval = 11;
    web.failTimer = 5 * 60;
    
    internalUpdate = function(){
        if (getkeydown(32) && spaceTimer == 0)
            spaceTimer++;
        if (spaceTimer > 0)
        {
            spaceTimer++;
            if (spaceTimer >= shootInterval)
            {
                spaceTimer = 0;
                for (var i in circles)
                {
                    var c = circles[i];
                    if (moving.indexOf(c) == -1)
                    {
                        moving.push(c);
                        break;
                    }
                }
                
            }
        }
    }
});

// 14
LEVELS.push(function(){
    web.numBlanks = 8;
    addCircles(1);
    web.rspeed = 10;
    var instantiationTime = timer;
    web.reversed = true;
});

// 15
LEVELS.push(function(){
    web.numBlanks = 7;
    addCircles(9);
    web.rspeed = 3;
    var instantiationTime = timer;
    var speeds = [1, 5, 10, 2, 1, 4, 3, 7];
    var sindex = 0;
    
    internalUpdate = function(){
        if ((timer - instantiationTime) % 50 == 0)
        {
            sindex = (sindex + 1) % speeds.length;
            web.rspeed = speeds[sindex];
        }
    };
});

// 16
LEVELS.push(function(){
    web.numBlanks = 1;
    addCircles(30);
    web.rspeed = 3;
    var instantiationTime = timer;
    var range = 60;
    var changeRate = 360;
    
    wypos = web.radius + totalWebRadius + range;
    cypos = wypos * 2;
    
    internalUpdate = function(){
        totalWebRadius = Math.abs( Math.sin((timer - instantiationTime) / changeRate) ) * range + restRadius;
    }
});

// 17
LEVELS.push(function(){
    web.numBlanks = 5;
    addCircles(14);
    web.rspeed = 6;
    var instantiationTime = timer;
    
    internalUpdate = function(){
        if ((instantiationTime - timer) % 60 == 0)
            web.rspeed = toggle(web.rspeed, 6, 4);
        if ((instantiationTime - timer) % 180 == 0)
            web.reversed = toggle(web.reversed, true, false);
    }
});
