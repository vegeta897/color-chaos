/* Services */

angular.module('ColorChaos.services', [])
    .factory('utility', function() {
        var hexes = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f'];

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
        
        return {
            generateLight: function(palette) {
                var hsv = {
                    hue: Math.floor(Math.random()*360),
                    sat: Math.round(Math.random()*100)/100,
                    val: Math.round((Math.random()*0.65+0.35)*100)/100
                };
                for(var key in palette) {
                    if(palette.hasOwnProperty(key)) {
                        var hueD = (hsv.hue - palette[key].hsv.hue);
                        if(Math.abs(hueD) > 180) { // We should wrap around
                            if(hsv.hue > 180) {
                                hueD = (360-hsv.hue) + palette[key].hsv.hue;
                            } else {
                                hueD = ((360-palette[key].hsv.hue) + hsv.hue)*-1;
                            }
                            if(Math.abs(hueD) > 10) {
                                hsv.hue = hsv.hue + hueD/25; // go the opposite way!
                            }
                            if(hsv.hue >= 360) { // If we've gone over 360
                                hsv.hue = hsv.hue - 360; // Wrap it
                            }
                            if(hsv.hue < 0) { // If we've gone below 0
                                hsv.hue = 360 - hsv.hue; // Wrap it
                            }
                        } else {
                            if(Math.abs(hueD) > 10) {
                                hsv.hue = hsv.hue - hueD/25;
                            }
                        }
                        var satD = (hsv.sat - palette[key].hsv.sat);
                        if(Math.abs(satD) > 0.05) {
                            hsv.sat = hsv.sat - satD*0.063;
                        }
                        var valD = (hsv.val - palette[key].hsv.val);
                        if(Math.abs(valD) > 0.05) {
                            hsv.val = hsv.val - valD*0.063;
                        }
                    }
                }
                return {
                    hex: hsvToRGB(hsv),
                    hsv: hsv
                };
            },
            generateDark: function(palette) {
                var hsv = {
                    hue: Math.floor(Math.random()*360),
                    sat: Math.round(Math.random()*100)/100,
                    val: Math.round(Math.random()*35)/100
                };
                for(var key in palette) {
                    if(palette.hasOwnProperty(key)) {
                        var hueD = (hsv.hue - palette[key].hsv.hue);
                        if(Math.abs(hueD) > 180) { // We should wrap around
                            if(hsv.hue > 180) {
                                hueD = (360-hsv.hue) + palette[key].hsv.hue;
                            } else {
                                hueD = ((360-palette[key].hsv.hue) + hsv.hue)*-1;
                            }
                            if(Math.abs(hueD) > 10) {
                                hsv.hue = hsv.hue + hueD/30; // go the opposite way!
                            }
                            if(hsv.hue >= 360) { // If we've gone over 360
                                hsv.hue = hsv.hue - 360; // Wrap it
                            }
                            if(hsv.hue < 0) { // If we've gone below 0
                                hsv.hue = 360 - hsv.hue; // Wrap it
                            }
                        } else {
                            if(Math.abs(hueD) > 10) {
                                hsv.hue = hsv.hue - hueD/30;
                            }
                        }
                        var satD = (hsv.sat - palette[key].hsv.sat);
                        if(Math.abs(satD) > 0.05) {
                            hsv.sat = hsv.sat - satD*0.093;
                        }
                        var valD = (hsv.val - palette[key].hsv.val);
                        if(Math.abs(valD) > 0.05) {
                            hsv.val = hsv.val - valD*0.093;
                        }
                    }
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