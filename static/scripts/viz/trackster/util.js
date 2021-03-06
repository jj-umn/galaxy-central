define(function(){

/**
 * Implementation of a server-state based deferred. Server is repeatedly polled, and when
 * condition is met, deferred is resolved.
 */
var ServerStateDeferred = Backbone.Model.extend({
    defaults: {
        ajax_settings: {},
        interval: 1000,
        success_fn: function(result) { return true; }
    },
    
    /**
     * Returns a deferred that resolves when success function returns true.
     */
    go: function() {
        var deferred = $.Deferred(),
            self = this,
            ajax_settings = self.get('ajax_settings'),
            success_fn = self.get('success_fn'),
            interval = self.get('interval'),
             _go = function() {
                 $.ajax(ajax_settings).success(function(result) {
                     if (success_fn(result)) {
                         // Result is good, so resolve.
                         deferred.resolve(result);
                     }
                     else {
                         // Result not good, try again.
                         setTimeout(_go, interval);
                     }
                 });
             };
         _go();
         return deferred;
    }
});

/**
 * Returns a random color in hexadecimal format that is sufficiently different from a single color
 * or set of colors.
 * @param colors a color or list of colors in the format '#RRGGBB'
 */
var get_random_color = function(colors) {
    // Default for colors is white.
    if (!colors) { colors = "#ffffff"; }
    
    // If needed, create list of colors.
    if ( typeof(colors) === "string" ) {
        colors = [ colors ];
    }
    
    // Convert colors to numbers.
    for (var i = 0; i < colors.length; i++) {
        colors[i] = parseInt( colors[i].slice(1), 16 );
    }
    
    // -- Perceived brightness and difference formulas are from 
    // -- http://www.w3.org/WAI/ER/WD-AERT/#color-contrast
    
    // Compute perceived color brightness (based on RGB-YIQ transformation):
    var brightness = function(r, g, b) {
        return ( (r * 299) + (g * 587) + (b * 114) ) / 1000;
    };
    
    // Compute color difference:
    var difference = function(r1, g1, b1, r2, g2, b2) {
        return ( Math.max(r1, r2) - Math.min(r1, r2) ) + 
               ( Math.max(g1, g2) - Math.min(g1, g2) ) + 
               ( Math.max(b1, b2) - Math.min(b1, b2) );
    };
    
    // Create new random color.
    var new_color, nr, ng, nb,
        other_color, or, og, ob,
        n_brightness, o_brightness,
        diff, ok = false,
        num_tries = 0;
    do {
        // New color is never white b/c random in [0,1)
        new_color = Math.round( Math.random() * 0xffffff );
        nr = ( new_color & 0xff0000 ) >> 16;
        ng = ( new_color & 0x00ff00 ) >> 8;
        nb = new_color & 0x0000ff;
        n_brightness = brightness(nr, ng, nb);
        ok = true;
        for (i = 0; i < colors.length; i++) {
            other_color = colors[i];
            or = ( other_color & 0xff0000 ) >> 16;
            og = ( other_color & 0x00ff00 ) >> 8;
            ob = other_color & 0x0000ff;
            o_brightness = brightness(or, og, ob);
            diff = difference(nr, ng, nb, or, og, ob);
            // These thresholds may need to be adjusted. Brightness difference range is 125; 
            // color difference range is 500.
            if ( ( Math.abs(n_brightness - o_brightness) < 40 ) ||
                 ( diff < 200 ) ) {
                ok = false;
                break;         
            }
        }
        
        num_tries++
;    } while (!ok && num_tries <= 10 );
    
    // Add 0x1000000 to left pad number with 0s.
    return '#' + ( 0x1000000 + new_color ).toString(16).substr(1,6);
};

return {
    ServerStateDeferred : ServerStateDeferred,
    get_random_color    : get_random_color
};

});
