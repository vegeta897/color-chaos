/* Services */

angular.module('ColorChaos.services', [])
    .factory('utility', function() {
        var hsvToRGB = function(hsv) {
            var h = hsv.hue, s = hsv.sat, v = hsv.val;
            var rgb, i, data = [];
            if (s === 0) {
                rgb = [v,v,v];
            } else {
                h = h / 60;
                i = Math.floor(h);
                data = [v*(1-s), v*(1-s*(h-i)), v*(1-s*(1-(h-i)))];
                switch(i) {
                    case 0:
                        rgb = [v, data[2], data[0]];
                        break;
                    case 1:
                        rgb = [data[1], v, data[0]];
                        break;
                    case 2:
                        rgb = [data[0], v, data[2]];
                        break;
                    case 3:
                        rgb = [data[0], data[1], v];
                        break;
                    case 4:
                        rgb = [data[2], data[0], v];
                        break;
                    default:
                        rgb = [v, data[0], data[1]];
                        break;
                }
            }
            return rgb.map(function(x){
                return ("0" + Math.round(x*255).toString(16)).slice(-2);
            }).join('');
        };
        var getAverages = function(palette) {
            var hueTotal = 0, satTotal = 0, valTotal = 0, totalColors = 0;
            for(var palKey in palette) {
                if(palette.hasOwnProperty(palKey)) {
                    totalColors++;
                    if(palette[palKey].hsv.hue - hueTotal/totalColors > 180) {
                        hueTotal += (360 - palette[palKey].hsv.hue + hueTotal/totalColors)*-1;
                    } else if (hueTotal/totalColors - palette[palKey].hsv.hue > 180) {
                        hueTotal += 360 + palette[palKey].hsv.hue;
                    } else {
                        hueTotal += palette[palKey].hsv.hue;
                    }
                    satTotal += palette[palKey].hsv.sat;
                    valTotal += palette[palKey].hsv.val;
                }
            }
            var avgHue = hueTotal/totalColors;
            if(avgHue >= 360) {
                avgHue = avgHue % 360;
            } else if (avgHue < 0) {
                avgHue = 360 + (avgHue % 360);
            }
            if(totalColors == 0) {
                return false;
            } else {
                return {
                    hue: avgHue,
                    sat: satTotal/totalColors,
                    val: valTotal/totalColors,
                    total: totalColors
                };
            }
            
        };
        var flip = function() { // Flip a coin
            return Math.floor(Math.random()*2) == 1;
        };
        return {
            generate: function(palette) {
                var hsv = {};
                var averages = getAverages(palette);
                if(averages) {
                    var hueOffset = Math.floor(Math.pow(Math.random(),1+Math.log(averages.total)/Math.LN10 )*180);
                    if(flip()) { hueOffset *= -1; }
                    var satMin = averages.sat > 0.5? 1-averages.sat : averages.sat;
                    var satMax = averages.sat > 0.5? averages.sat : 1-averages.sat;
                    var satOffset = Math.pow(Math.random(),1+Math.log(averages.total)/Math.LN10) * satMax;
                    if(satOffset > satMin) { // If offset is > min range
                        if(flip()) { satOffset *= satOffset*(satMin/satMax); } // Resize the offset to the min range
                        if(flip()) { satOffset *= -1; } // Then see which side of the min to go
                    }
                    if(averages.sat + satOffset > 1) { satOffset *= -1; } // Put the offset in the right direction
                        else if(averages.sat + satOffset < 0) { satOffset *= -1; }
                    var valMin = averages.val > 0.5? 1-averages.val : averages.val;
                    var valMax = averages.val > 0.5? averages.val : 1-averages.val;
                    var valOffset = Math.pow(Math.random(),1+Math.log(averages.total)/Math.LN10) * valMax;
                    if(valOffset > valMin) { // If offset is > min range
                        if(flip()) { valOffset *= valOffset*(valMin/valMax); } // Resize the offset to the min range
                        if(flip()) { valOffset *= -1; } // Then see which side of the min to go
                    }
                    if(averages.val + valOffset > 1) { valOffset *= -1; }
                        else if(averages.val + valOffset < 0) { valOffset *= -1; }
                    hsv = {
                        hue: averages.hue+hueOffset,
                        sat: averages.sat+satOffset,
                        val: averages.val+valOffset
                    };
                    if(hsv.hue >= 360) {
                        hsv.hue = hsv.hue % 360;
                    } else if (hsv.hue < 0) {
                        hsv.hue = 360 + (hsv.hue % 360);
                    }
                    hsv.sat = Math.round(hsv.sat*100)/100; // Clean up long decimals
                    hsv.val = Math.round(hsv.val*100)/100;
                    console.log(hsv.sat, hsv.val);
                    console.log(averages);
                } else {
                    hsv = {
                        hue: Math.floor(Math.random()*360),
                        sat: Math.round(Math.random()*100)/100,
                        val: Math.round(Math.random()*100)/100
                    };
                }
                return {
                    hex: hsvToRGB(hsv),
                    hsv: hsv
                };
            },
            rgbToHex: function rgbToHex(r, g, b) {
                if (r > 255 || g > 255 || b > 255)
                    throw "Invalid color component";
                return ((r << 16) | (g << 8) | b).toString(16);
            }
        }
});