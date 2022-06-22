<?php
add_action('wp_enqueue_scripts', 'content_theme_css', 999);
function content_theme_css() {
    wp_enqueue_style('content-parent-style', get_template_directory_uri() . '/style.css');
    wp_enqueue_style('bootstrap', get_template_directory_uri() . '/css/bootstrap.css');
	wp_enqueue_style('media-responsive-css', get_stylesheet_directory_uri()."/css/media-responsive.css" );
    wp_enqueue_script('content-mp-masonry-js', get_stylesheet_directory_uri() . '/js/masonry/mp.mansory.js');
}

//Load text domain for translation-ready
load_theme_textdomain('content', get_stylesheet_directory() . '/languages');

// footer custom script
function content_footer_custom_script() {
?>
    <script>
        jQuery(document).ready(function (jQuery) {
            jQuery("#blog-masonry").mpmansory(
                    {
                        childrenClass: 'item', // default is a div
                        columnClasses: 'padding', //add classes to items
                        breakpoints: {
                            lg: 4, //Change masonry column here like 2, 3, 4 column
                            md: 6,
                            sm: 6,
                            xs: 12
                        },
                        distributeBy: {order: false, height: false, attr: 'data-order', attrOrder: 'asc'}, //default distribute by order, options => order: true/false, height: true/false, attr => 'data-order', attrOrder=> 'asc'/'desc'
                        onload: function (items) {
                            //make somthing with items
                        }
                    }
            );
        });
    </script>
    <?php

}
add_action('wp_footer', 'content_footer_custom_script');
?>