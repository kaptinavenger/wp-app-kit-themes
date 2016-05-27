define( function ( require ) {

	"use strict";
    
	var $ = require( 'jquery' );
    var Velocity = require ( 'theme/js/velocity.min' );

	var config = {
		delay: 300
	};
    
	var transitions = { };
    
    console.log("transitions.js loaded");
    
	transitions.slideLeft = function ( $wrapper, $current, $next, $deferred ) {
		
        console.log("slideLeft");
        
/*
        console.log($wrapper);
        console.log("---");
        console.log($current);
        console.log("---");
        console.log($next);
*/

        //Set $next DOM element to the right of the screen (invisible) :
		$next.css( {
			position: 'absolute',
			top: 0,
			left: '100%',
			height: '100%',
			width: '100%'
		} );

		//Add $next to the end of the wrapper (still invisible)
		$wrapper.append( $next );

        //debugger;
        
		//Animate $wrapper to make $next appear from right to left
		$wrapper.velocity(
				{ left: '-100%' },
				config.delay,
				'ease-out',
				function () {
					// remove the screen that has been transitioned out
					$current.remove();

					// remove the CSS transition
					$wrapper.attr( 'style', '' );

					// remove the position absoluteness
					$next.css( {
						top: '',
						left: '',
						position: ''
					} );

					$deferred.resolve();
				} );
	}

	transitions.slideRight = function ( $wrapper, $current, $next, $deferred ) {

        console.log("slideRight");

		//Set $next DOM element to the left of the screen (invisible) :
		$next.css( {
			position: 'absolute',
			top: 0,
			left: '-100%',
			height: '100%',
			width: '100%'
		} );

		//Add $next to the left of the wrapper (still invisible)
		$wrapper.prepend( $next );

		//Animate $wrapper to make $next appear from left to right
		$wrapper.velocity(
				{ left: '100%' },
				config.delay,
				'ease-out',
				function () {
					// remove the screen that has been transitioned out
					$current.remove();

					// remove the CSS transition
					$wrapper.attr( 'style', '' );

					// remove the position absoluteness
					$next.css( {
						top: '',
						left: '',
						position: ''
					} );

					$deferred.resolve();
				} );
	};
	
	transitions.replace = function ( $wrapper, $current, $next, $deferred ) {
		
        console.log("replace");
        
        $current.remove();
		$wrapper.empty().append( $next );
		$deferred.resolve();
	};
    
    return transitions;
    
} );