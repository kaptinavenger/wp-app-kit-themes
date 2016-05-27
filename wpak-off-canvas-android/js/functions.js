/**
 * All JavaScript required for the theme has to be placed in this file
 * Use RequireJS define to import external JavaScript libraries
 * To be imported, a JavaScript has to be a module (AMD)
 * http://www.sitepoint.com/understanding-requirejs-for-effective-javascript-module-loading/
 * If this is not the case: place the path to the library at the end of the define array
 * Paths are relative to the app subfolder of the wp-app-kit plugin folder
 * You don't need to specify the .js extensions
    
 * (AMD) jQuery          available as    $
 * (AMD) Theme App Core  available as    App
 * (AMD) Local Storage   available as    Storage
 * (AMD) Template Tags   avaialble as    TplTags
 * (AMD) Velocity 1.2.3  available as    Velocity (but used with jQuery) (http://julian.com/research/velocity/)
 */
define(['jquery','core/theme-app','core/modules/storage','core/theme-tpl-tags','theme/js/velocity.min','theme/js/transitions'],function($,App,Storage,TplTags,Velocity,Transitions){
    
	/**
     * App Events
     */

    // @desc Refresh process begins
	App.on('refresh:start',function(){
		$("#refresh-button").removeClass("refresh-off").addClass("refresh-on");
	});

    /**
     * @desc Refresh process ends
     * @param result
     */
	App.on('refresh:end',function(result){

		scrollTop(0);                   // Scroll to the top of the screen
        Storage.clear('scroll-pos');    // Clear the previous memorized position in the local storage
		
		// The refresh icon stops to spin
		$("#refresh-button").removeClass("refresh-on").addClass("refresh-off");
		
		// Select the current screen item in off-canvas menu
        $("#menu-items li").removeClass("menu-active-item");
		$("#menu-items li:first-child").addClass("menu-active-item");
		
		/**
         * Display if the refresh process is a success or not
         * @todo if an error occurs we should not reset scroll position
         * @todo messages should be centralized to ease translations
         */
		if ( result.ok ) {
			showMessage("Content updated successfully :)");
		}else{
			showMessage(result.message);
		}

    });

	/**
     * @desc An error occurs
     * @param error
     */
	App.on('error',function(error){
		showMessage(error.message);
	});

	/**
     * @desc A new screen is displayed
     * @param {object} current_screen - Screen types: list|single|page|comments
     * @param view
     */
	App.on('screen:showed',function(current_screen,view){

        // Close off-canvas menu
        if (isMenuOpen) {
			$("#app-canvas").css("left","85%"); 
			closeMenu();
		}

		// A Post or a Page is displayed
        if (current_screen.screen_type=="single"||current_screen.screen_type=="page") {
			cleanImgTag(); // Prepare <img> tags for styling
            $("#app-layout").on("click",".single-template a",openInBrowser); // Redirect all hyperlinks clicks
		}

		// A Post List is displayed
        if( current_screen.screen_type == "list" ){

            /**
             * Retrieve any memorized scroll position from the local storage
             * If a position has been memorized, scroll to it
             * If not, scroll to the top of the screen
             */
            var pos = Storage.get("scroll-pos",current_screen.fragment);
			if( pos !== null ){
				$("#content").scrollTop(pos);
			}else{
				scrollTop();
			}
		}else{
			scrollTop(); // Scroll to the top of screen if we're not displaying a Post List (eg. a Post)
		}
        
	});

    /**
     * @desc About to leave the current screen
     * @param {object} current_screen - Screen types: list|single|page|comments
     * @param queried_screen
     * @param view
     */
	App.on('screen:leave',function(current_screen,queried_screen,view){

        // If the current screen is a Post List
        if( current_screen.screen_type == "list" ){
			Storage.set("scroll-pos",current_screen.fragment,$("#content").scrollTop()); // Memorize the current scroll position in local storage
		}
        
    });

    
    
	/**
     * UI events and variables
     */
    
    // Event bindings
    // All events are bound to #app-layout using event delegation as it is a permanent DOM element
    // They became available as soon as the target element is available in the DOM
    // Single and page content click on hyperlinks bindings are done in screen:showed

	var isMenuOpen = false; // Stores if the off-canvas menu is currently opened or closed

    // Menu Button events
    $("#app-layout").on("touchstart","#menu-button",menuButtonTapOn);
	$("#app-layout").on("touchend","#menu-button",menuButtonTapOff);

    // Refresh Button events
    $("#app-layout").on("touchstart","#refresh-button",refreshTapOn);
	$("#app-layout").on("touchend","#refresh-button",refreshTapOff);

    // Menu Item events
	$("#app-layout").on("click","#menu-items li a",menuItemTap);
	$("#app-layout").on("click","#content .content-item a",contentItemTap);

    App.setAutoScreenTransitions( Transitions.replace, Transitions.slideLeft, Transitions.slideRight );

    
    
    /**
     * Functions
     */

    /**
     * @desc open off-canvas menu
     */
    function openMenu() {

		$("#menu-items").css("display","block");

        $("#app-canvas").velocity({
			left:"85%",
			},300, function() {
				setTimeout(function(){isMenuOpen=true;},150);
			});
	}

    /**
     * @desc Close off-canvas menu
     * @param action (1 means that we close the off-canvas menu after clicking on a menu item)
     * @param menuItem
     */
	function closeMenu(action,menuItem) {

		isMenuOpen = false;

        $("#app-canvas").velocity({
			left:"0",
		},300, function() {

				$("#menu-items").css("display","none");

				// We have tapped a menu item, let's open the corresponding screen
                if (action==1) {
					App.navigate(menuItem.attr("href"));
				}

			});
	}

    /**
     * @desc Open or close off-canvas menu (based on isMenuOpen variable)
     */
	function toggleMenu() {
		if (isMenuOpen) {
			closeMenu();
		} else {
			openMenu();
		}
	}

    /**
     * @desc Finger presses the menu button
     */
	function menuButtonTapOn() {
        $("#menu-button").removeClass("button-tap-off").addClass("button-tap-on"); // Switch icon state (on)
	}

    /**
     * @desc Finger releases the menu button
     * @todo use e.preventDefault()
     */
	function menuButtonTapOff() {
		$("#menu-button").removeClass("button-tap-on").addClass("button-tap-off"); // Switch icon state (off)
		toggleMenu(); // Open or close off-canvas menu
		return false;
	}

    /**
     * @desc Finger taps one of the off-canvas menu item
     * @todo use e.preventDefault()
     */
	function menuItemTap() {	

		if (isMenuOpen) {

			// Select tapped item
            $("#menu-items li").removeClass("menu-active-item"); // Unselect all menu items
			$(this).closest("li").addClass("menu-active-item");

            // Close menu and navigate to the item's corresponding screen
            // @todo use navigate here rather than in close menu
			closeMenu(1,$(this));
            
		}

		return false;
	}

    /**
     * @desc Finger taps one of the post item in a post list
     * @todo use e.preventDefault()
     */
	function contentItemTap() {

		if (!isMenuOpen) {
			App.navigate($(this).attr("href")); // Display post
		} else {
			closeMenu(); // Tapping a post item when the off-canvas menu is opened closes it
		}
		return false;
	}

    
    /**
     * @desc Show a message in the message bar during 3 sec
     */
	function showMessage(msgText) {
		$("#app-message-bar").html(msgText);
		$("#app-message-bar").removeClass("message-off").addClass("message-on");
		setTimeout(hideMessage,3000);
	}

    /**
     * @desc Hide the message bar
     */
	function hideMessage() {
		$("#app-message-bar").removeClass("message-on").addClass("message-off");	
		$("#app-message-bar").html("");
	}

    /**
     * @desc Finger taps the refresh button
     */
	function refreshTapOn() {
		$("#refresh-button").removeClass("button-touch-off").addClass("button-touch-on");
	}

    /**
     * @desc Finger releases the refresh button
     */
	function refreshTapOff() {
		if (!App.isRefreshing()) { // Check if the app is not already refreshing content
			$("#refresh-button").removeClass("button-touch-on").addClass("button-touch-off");
			$("#refresh-button").removeClass("refresh-off").addClass("refresh-on");
			App.refresh(); // Refresh content
		}
	}

    /**
     * @desc Stop spinning when refresh ends
     */
	function stopRefresh() {
		$("#refresh-button").removeClass("refresh-on").addClass("refresh-off");	
	}

    /**
     * @desc Scroll to the top of the screen
     * @param pos (in px)
     */
    function scrollTop(pos){
        $("#content").scrollTop(pos);        
	}
    
    /**
     * @desc Prepare <img> tags for proper styling (responsive)
     */
	function cleanImgTag() {
		$(".single-template img").removeAttr("width height"); // Remove all width and height attributes
		$(".single-template .wp-caption").removeAttr("style"); // Remove any style attributes
		$(".single-template .wp-caption a").removeAttr("href"); // Remove any hyperlinks attached to an image
	}
    
    /**
     * @desc Hyperlinks click handler
     * @desc Relies on the InAppBrowser PhoneGap Core Plugin / https://build.phonegap.com/plugins/233
     * @desc Target _blank calls an in app browser (iOS behavior)
     * @desc Target _system calls the default browser (Android behavior)
     * @param {object} e
     * @todo harmonize ways of naming event object and preventDefault() position
     */
    function openInBrowser(e) {
        window.open(e.target.href,"_system","location=yes");
        e.preventDefault();
    }

});