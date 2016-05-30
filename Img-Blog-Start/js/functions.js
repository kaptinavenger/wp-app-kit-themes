define( [ 'jquery', 'core/theme-app', 'core/theme-tpl-tags', 'core/modules/storage', 
		  'theme/js/bootstrap.min', 'theme/js/auth/auth-pages.min', 'theme/js/auth/simple-login.min', 
		  'theme/js/auth/premium-posts.min', 'theme/js/comments.min' 
		], 
		function( $, App, TemplateTags, Storage ) {

	var $refresh_button = $( '#refresh-button' );

	/**
	 * Launch app contents refresh when clicking the refresh button :
	 */
	$refresh_button.click( function( e ) {
		e.preventDefault();
		closeMenu();
		App.refresh();
	} );

	/**
	 * Animate refresh button when the app starts refreshing
	 */
	App.on( 'refresh:start', function() {
		$refresh_button.addClass( 'refreshing' );
	} );

	/**
	 * When the app stops refreshing :
	 * - scroll to top
	 * - stop refresh button animation
	 * - display success or error message
	 *
	 * Callback param : result : object {
	 *		ok: boolean : true if refresh is successful,
	 *		message: string : empty if success, error message if refresh fails,
	 *		data: object : empty if success, error object if refresh fails :
	 *					   use result.data to get more info about the error
	 *					   if needed.
	 * }
	 */
	App.on( 'refresh:end', function( result ) {
		scrollTop();
		Storage.clear( 'scroll-pos' );
		$refresh_button.removeClass( 'refreshing' );
		if ( result.ok ) {
			$( '#feedback' ).removeClass( 'error' ).html( 'Content updated successfully :)' ).slideDown();
		} else {
			$( '#feedback' ).addClass( 'error' ).html( result.message ).slideDown();
		}
	} );

	/**
	 * When an error occurs, display it in the feedback box
	 */
	App.on( 'error', function( error ) {
		$( '#feedback' ).addClass( 'error' ).html( error.message ).slideDown();
	} );

	/**
	 * Hide the feedback box when clicking anywhere in the body
	 */
	$( 'body' ).click( function( e ) {
		$( '#feedback' ).slideUp();
	} );

	/**
	 * Back button 
	 */
	var $back_button = $( '#go-back' );
	
	//Show/Hide back button (in place of refresh button) according to current screen:
	App.on( 'screen:showed', function () {
		var display = App.getBackButtonDisplay();
		if ( display === 'show' ) {
			$refresh_button.hide();
			$back_button.show();
		} else if ( display === 'hide' ) {
			$back_button.hide();
			$refresh_button.show();
		}
	} );

	//Go to previous screen when clicking back button:
	$back_button.click( function ( e ) {
		e.preventDefault();
		App.navigateToPreviousScreen();
	} );

	/**
	 * Allow to click anywhere on post list <li> to go to post detail :
	 */
	$( '#app-content-wrapper' ).on( 'click', 'li.media', function( e ) {
		e.preventDefault();
		var navigate_to = $( 'a', this ).attr( 'href' );
		App.navigate( navigate_to );
	} );

	/**
	 * Close menu when we click a link inside it.
	 * The menu can be dynamically refreshed, so we use "on" on parent div (which is always here):
	 */
	$( '#slide-nav' ).on( 'click', 'a', function( e ) {
		closeMenu();
	} );

	/**
	 * Open all links inside single content with the inAppBrowser
	 */
	$( "#page-content" ).on( "click", ".single-content a, .page-content a", function( e ) {
		e.preventDefault();
		openWithInAppBrowser( e.target.href );
	} );

	$( "#page-content" ).on( "click", ".comments", function( e ) {
		e.preventDefault();
		
		$('#waiting').show();
		
		App.displayPostComments( 
			$(this).attr( 'data-post-id' ),
			function( comments, post, item_global ) {
				//Do something when comments display is ok
				//We hide the waiting panel in 'screen:showed'
			},
			function( error ){
				//Do something when comments display fail (note that an app error is triggered automatically)
				$('#waiting').hide();
			}
		);
	} );

	/**
	 * "Get more" button in post lists
	 */
	$( '#app-content-wrapper' ).on( 'click', '.get-more', function( e ) {
		e.preventDefault();
		
		var $this = $( this );
		
		var text_memory = $this.text();
		$this.attr( 'disabled', 'disabled' ).text( 'Loading...' );

		App.getMoreComponentItems( 
			function() {
				//If something is needed once items are retrieved, do it here.
				//Note : if the "get more" link is included in the archive.html template (which is recommended),
				//it will be automatically refreshed.
				$this.removeAttr( 'disabled' );
			},
			function( error, get_more_link_data ) {
				$this.removeAttr( 'disabled' ).text( text_memory );
			}
		);
	} );

	/**
	 * Do something before leaving a screen.
	 * Here, if we're leaving a post list, we memorize the current scroll position, to
	 * get back to it when coming back to this list.
	 */
	App.on( 'screen:leave', function( current_screen, queried_screen, view ) {
		//current_screen.screen_type can be 'list','single','page','comments'
		if ( current_screen.screen_type == 'list' ) {
			Storage.set( 'scroll-pos', current_screen.fragment, $( 'body' ).scrollTop() );
		}
	} );

	/**
	 * Do something when a new screen is showed.
	 * Here, if we arrive on a post list, we resore the scroll position
	 */
	App.on( 'screen:showed', function( current_screen, view ) {
		//current_screen.screen_type can be 'list','single','page','comments'
		if ( current_screen.screen_type == 'list' ) {
			var pos = Storage.get( 'scroll-pos', current_screen.fragment );
			if ( pos !== null ) {
				$( 'body' ).scrollTop( pos );
			} else {
				scrollTop();
			}
		} else {
			scrollTop();
		}
		
		if ( current_screen.screen_type == 'comments' ) {
			$('#waiting').hide();
		}
		
	} );

	/**
	 * Example of how to react to network state changes :
	 */
	/*
	 App.on( 'network:online', function(event) {
	 $( '#feedback' ).removeClass( 'error' ).html( "Internet connexion ok :)" ).slideDown();
	 } );
	 
	 App.on( 'network:offline', function(event) {
	 $( '#feedback' ).addClass( 'error' ).html( "Internet connexion lost :(" ).slideDown();
	 } );
	 */

	/**
	 * Manually close the bootstrap navbar
	 */
	function closeMenu() {
		var navbar_toggle_button = $( ".navbar-toggle" ).eq( 0 );
		if ( !navbar_toggle_button.hasClass( 'collapsed' ) ) {
			navbar_toggle_button.click();
		}
	}

	/**
	 * Get back to the top of the screen
	 */
	function scrollTop() {
		window.scrollTo( 0, 0 );
	}

	/**
	 * Opens the given url using the inAppBrowser
	 */
	function openWithInAppBrowser( url ) {
		window.open( url, "_blank", "location=yes" );
	}
    
    
    //**slideout nav */
    
    $(document).ready(function () {


    //stick in the fixed 100% height behind the navbar but don't wrap it
    $('#slide-nav.navbar .container').append($('<div id="navbar-height-col"></div>'));

    // Enter your ids or classes
    var toggler = '.navbar-toggle';
    var pagewrapper = '#page-content';
    var navigationwrapper = '.navbar-header';
    var menuwidth = '100%'; // the menu inside the slide menu itself
    var slidewidth = '80%';
    var menuneg = '-100%';
    var slideneg = '-80%';

        
    $("#slide-nav").on("click", toggler, function (e) {

        var selected = $(this).hasClass('slide-active');

        $('#slidemenu').stop().animate({
            left: selected ? menuneg : '0px'
        });

        $('#navbar-height-col').stop().animate({
            left: selected ? slideneg : '0px'
        });

        $(pagewrapper).stop().animate({
            left: selected ? '0px' : slidewidth
        });

        $(navigationwrapper).stop().animate({
            left: selected ? '0px' : slidewidth
        });


        $(this).toggleClass('slide-active', !selected);
        $('#slidemenu').toggleClass('slide-active');


        $('#page-content, .navbar, body, .navbar-header').toggleClass('slide-active');


    });


    var selected = '#slidemenu, #page-content, .navbar, .navbar-header';


    $(window).on("resize", function () {

        if ($(window).width() > 768 && $('.navbar-toggle').is(':hidden')) {
            $(selected).removeClass('slide-active');
        }


    });




});

} );